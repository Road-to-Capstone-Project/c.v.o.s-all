import {
  CartCreditLineDTO,
  CartWorkflowDTO,
  UsageComputedActions,
} from "@medusajs/framework/types"
import {
  isDefined,
  Modules,
  OrderStatus,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import {
  createHook,
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  emitEventStep,
  useQueryGraphStep,
  useRemoteQueryStep,
} from "../../common"
import { createOrdersStep } from "../../order/steps/create-orders"
import { authorizePaymentSessionStep } from "../../payment/steps/authorize-payment-session"
import { registerUsageStep } from "../../promotion/steps/register-usage"
import {
  updateCartsStep,
  validateCartPaymentsStep,
  validateShippingStep,
} from "../steps"
import { reserveInventoryStep } from "../steps/reserve-inventory"
import { completeCartFields } from "../utils/fields"
import { prepareConfirmInventoryInput } from "../utils/prepare-confirm-inventory-input"
import {
  prepareAdjustmentsData,
  prepareLineItemData,
  PrepareLineItemDataInput,
  prepareTaxLinesData,
} from "../utils/prepare-line-item-data"
import { compensatePaymentIfNeededStep } from "../steps/compensate-payment-if-needed"
/**
 * The data to complete a cart and place an order.
 */
export type CompleteCartWorkflowInput = {
  /**
   * The ID of the cart to complete.
   */
  id: string
}

export type CompleteCartWorkflowOutput = {
  /**
   * The ID of the order that was created.
   */
  id: string
}

export const THREE_DAYS = 60 * 60 * 24 * 3

export const completeCartWorkflowId = "complete-cart"
/**
 * This workflow completes a cart and places an order for the customer. It's executed by the
 * [Complete Cart Store API Route](https://docs.medusajs.com/api/store#carts_postcartsidcomplete).
 *
 * You can use this workflow within your own customizations or custom workflows, allowing you to wrap custom logic around completing a cart.
 * For example, in the [Subscriptions recipe](https://docs.medusajs.com/resources/recipes/subscriptions/examples/standard#create-workflow),
 * this workflow is used within another workflow that creates a subscription order.
 *
 * @example
 * const { result } = await completeCartWorkflow(container)
 * .run({
 *   input: {
 *     id: "cart_123"
 *   }
 * })
 *
 * @summary
 *
 * Complete a cart and place an order.
 *
 * @property hooks.validate - This hook is executed before all operations. You can consume this hook to perform any custom validation. If validation fails, you can throw an error to stop the workflow execution.
 */
export const completeCartWorkflow = createWorkflow(
  {
    name: completeCartWorkflowId,
    store: true,
    idempotent: true,
    retentionTime: THREE_DAYS,
  },
  (input: WorkflowData<CompleteCartWorkflowInput>) => {
    const orderCart = useQueryGraphStep({
      entity: "order_cart",
      fields: ["cart_id", "order_id"],
      filters: { cart_id: input.id },
    })

    const orderId = transform({ orderCart }, ({ orderCart }) => {
      return orderCart.data[0]?.order_id
    })

    const cart = useRemoteQueryStep({
      entry_point: "cart",
      fields: completeCartFields,
      variables: { id: input.id },
      list: false,
    }).config({
      name: "cart-query",
    })

    // this is only run when the cart is completed for the first time (same condition as below)
    // but needs to be before the validation step
    const paymentSessions = when(
      "create-order-payment-compensation",
      { orderId },
      ({ orderId }) => !orderId
    ).then(() => {
      const paymentSessions = validateCartPaymentsStep({ cart })
      // purpose of this step is to run compensation if cart completion fails
      // and tries to cancel or refund the payment depending on the status.
      compensatePaymentIfNeededStep({
        payment_session_id: paymentSessions[0].id,
      })

      return paymentSessions
    })

    const validate = createHook("validate", {
      input,
      cart,
    })

    // If order ID does not exist, we are completing the cart for the first time
    const order = when("create-order", { orderId }, ({ orderId }) => {
      return !orderId
    }).then(() => {
      const cartOptionIds = transform({ cart }, ({ cart }) => {
        return cart.shipping_methods?.map((sm) => sm.shipping_option_id)
      })

      const shippingOptions = useRemoteQueryStep({
        entry_point: "shipping_option",
        fields: ["id", "shipping_profile_id"],
        variables: { id: cartOptionIds },
        list: true,
      }).config({
        name: "shipping-options-query",
      })

      validateShippingStep({ cart, shippingOptions })

      createHook("beforePaymentAuthorization", {
        input,
      })

      const payment = authorizePaymentSessionStep({
        // We choose the first payment session, as there will only be one active payment session
        // This might change in the future.
        id: paymentSessions![0].id,
      })

      const { variants, sales_channel_id } = transform({ cart }, (data) => {
        const variantsMap: Record<string, any> = {}
        const allItems = data.cart?.items?.map((item) => {
          variantsMap[item.variant_id] = item.variant

          return {
            id: item.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          }
        })

        return {
          variants: Object.values(variantsMap),
          items: allItems,
          sales_channel_id: data.cart.sales_channel_id,
        }
      })

      const cartToOrder = transform({ cart, payment }, ({ cart, payment }) => {
        const transactions =
          (payment &&
            payment?.captures?.map((capture) => {
              return {
                amount: capture.raw_amount ?? capture.amount,
                currency_code: payment.currency_code,
                reference: "capture",
                reference_id: capture.id,
              }
            })) ??
          []

        const allItems = (cart.items ?? []).map((item) => {
          const input: PrepareLineItemDataInput = {
            item,
            variant: item.variant,
            cartId: cart.id,
            unitPrice: item.unit_price,
            isTaxInclusive: item.is_tax_inclusive,
            taxLines: item.tax_lines ?? [],
            adjustments: item.adjustments ?? [],
          }

          return prepareLineItemData(input)
        })

        const shippingMethods = (cart.shipping_methods ?? []).map((sm) => {
          return {
            name: sm.name,
            description: sm.description,
            amount: sm.raw_amount ?? sm.amount,
            is_tax_inclusive: sm.is_tax_inclusive,
            shipping_option_id: sm.shipping_option_id,
            data: sm.data,
            metadata: sm.metadata,
            tax_lines: prepareTaxLinesData(sm.tax_lines ?? []),
            adjustments: prepareAdjustmentsData(sm.adjustments ?? []),
          }
        })

        const creditLines = (cart.credit_lines ?? []).map(
          (creditLine: CartCreditLineDTO) => {
            return {
              amount: creditLine.amount,
              raw_amount: creditLine.raw_amount,
              reference: creditLine.reference,
              reference_id: creditLine.reference_id,
              metadata: creditLine.metadata,
            }
          }
        )

        const itemAdjustments = allItems
          .map((item) => item.adjustments ?? [])
          .flat(1)
        const shippingAdjustments = shippingMethods
          .map((sm) => sm.adjustments ?? [])
          .flat(1)

        const promoCodes = [...itemAdjustments, ...shippingAdjustments]
          .map((adjustment) => adjustment.code)
          .filter(Boolean)

        return {
          region_id: cart.region?.id,
          customer_id: cart.customer?.id,
          sales_channel_id: cart.sales_channel_id,
          status: OrderStatus.PENDING,
          email: cart.email,
          currency_code: cart.currency_code,
          shipping_address: cart.shipping_address,
          billing_address: cart.billing_address,
          no_notification: false,
          items: allItems,
          shipping_methods: shippingMethods,
          metadata: cart.metadata,
          promo_codes: promoCodes,
          transactions,
          credit_lines: creditLines,
        }
      })

      const createdOrders = createOrdersStep([cartToOrder])

      const createdOrder = transform({ createdOrders }, ({ createdOrders }) => {
        return createdOrders?.[0] ?? undefined
      })

      const reservationItemsData = transform(
        { createdOrder },
        ({ createdOrder }) =>
          createdOrder.items!.map((i) => ({
            variant_id: i.variant_id,
            quantity: i.quantity,
            id: i.id,
          }))
      )

      const formatedInventoryItems = transform(
        {
          input: {
            sales_channel_id,
            variants,
            items: reservationItemsData,
          },
        },
        prepareConfirmInventoryInput
      )

      const updateCompletedAt = transform({ cart }, ({ cart }) => {
        return {
          id: cart.id,
          completed_at: new Date(),
        }
      })

      const linksToCreate = transform(
        { cart, createdOrder },
        ({ cart, createdOrder }) => {
          const links: Record<string, any>[] = [
            {
              [Modules.ORDER]: { order_id: createdOrder.id },
              [Modules.CART]: { cart_id: cart.id },
            },
          ]

          if (isDefined(cart.payment_collection?.id)) {
            links.push({
              [Modules.ORDER]: { order_id: createdOrder.id },
              [Modules.PAYMENT]: {
                payment_collection_id: cart.payment_collection.id,
              },
            })
          }

          return links
        }
      )

      parallelize(
        createRemoteLinkStep(linksToCreate),
        updateCartsStep([updateCompletedAt]),
        reserveInventoryStep(formatedInventoryItems),
        emitEventStep({
          eventName: OrderWorkflowEvents.PLACED,
          data: { id: createdOrder.id },
        })
      )

      const promotionUsage = transform(
        { cart },
        ({ cart }: { cart: CartWorkflowDTO }) => {
          const promotionUsage: UsageComputedActions[] = []

          const itemAdjustments = (cart.items ?? [])
            .map((item) => item.adjustments ?? [])
            .flat(1)

          const shippingAdjustments = (cart.shipping_methods ?? [])
            .map((item) => item.adjustments ?? [])
            .flat(1)

          for (const adjustment of itemAdjustments) {
            promotionUsage.push({
              amount: adjustment.amount,
              code: adjustment.code!,
            })
          }

          for (const adjustment of shippingAdjustments) {
            promotionUsage.push({
              amount: adjustment.amount,
              code: adjustment.code!,
            })
          }

          return promotionUsage
        }
      )

      registerUsageStep(promotionUsage)

      createHook("orderCreated", {
        order_id: createdOrder.id,
        cart_id: cart.id,
      })

      return createdOrder
    })

    const result = transform({ order, orderId }, ({ order, orderId }) => {
      return { id: order?.id ?? orderId } as CompleteCartWorkflowOutput
    })

    return new WorkflowResponse(result, {
      hooks: [validate],
    })
  }
)
