import {
  AdditionalData,
  OrderChangeActionDTO,
  OrderChangeDTO,
  OrderDTO,
  OrderPreviewDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import { ChangeActionType, OrderChangeStatus } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createStep,
  createWorkflow,
  parallelize,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../../common"
import {
  updateOrderChangeActionsStep,
  updateOrderShippingMethodsStep,
} from "../../steps"
import { previewOrderChangeStep } from "../../steps/preview-order-change"
import { throwIfOrderChangeIsNotActive } from "../../utils/order-validation"
import { prepareShippingMethodUpdate } from "../../utils/prepare-shipping-method"
import { pricingContextResult } from "../../../cart/utils/schemas"

/**
 * The data to validate that an order edit's shipping method can be updated.
 */
export type UpdateOrderEditShippingMethodValidationStepInput = {
  /**
   * The order change's details.
   */
  orderChange: OrderChangeDTO
  /**
   * The details of the shipping method to be updated.
   */
  input: Pick<
    OrderWorkflow.UpdateOrderEditShippingMethodWorkflowInput,
    "order_id" | "action_id"
  >
}

/**
 * This step validates that an order edit's shipping method can be updated.
 * If the order change is not active, the shipping method isn't in the order edit,
 * or the action is not adding a shipping method, the step will throw an error.
 *
 * :::note
 *
 * You can retrieve an order change details using [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query),
 * or [useQueryGraphStep](https://docs.medusajs.com/resources/references/medusa-workflows/steps/useQueryGraphStep).
 *
 * :::
 *
 * @example
 * const data = updateOrderEditShippingMethodValidationStep({
 *   orderChange: {
 *     id: "orch_123",
 *     // other order change details...
 *   },
 *   input: {
 *     order_id: "order_123",
 *     action_id: "orchac_123",
 *     data: {
 *       custom_amount: 10,
 *     }
 *   }
 * })
 */
export const updateOrderEditShippingMethodValidationStep = createStep(
  "validate-update-order-edit-shipping-method",
  async function ({
    orderChange,
    input,
  }: UpdateOrderEditShippingMethodValidationStepInput) {
    throwIfOrderChangeIsNotActive({ orderChange })

    const associatedAction = (orderChange.actions ?? []).find(
      (a) => a.id === input.action_id
    ) as OrderChangeActionDTO

    if (!associatedAction) {
      throw new Error(
        `No shipping method found for order ${input.order_id} in order change ${orderChange.id}`
      )
    } else if (associatedAction.action !== ChangeActionType.SHIPPING_ADD) {
      throw new Error(
        `Action ${associatedAction.id} is not adding a shipping method`
      )
    }
  }
)

export const updateOrderEditShippingMethodWorkflowId =
  "update-order-edit-shipping-method"
/**
 * This workflow updates an order edit's shipping method. It's used by the
 * [Update Shipping Method Admin API Route](https://docs.medusajs.com/api/admin#order-edits_postordereditsidshippingmethodaction_id).
 *
 * You can use this workflow within your customizations or your own custom workflows, allowing you to update an order edit's shipping method
 * in your custom flow.
 *
 * @example
 * const { result } = await updateOrderEditShippingMethodWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *     action_id: "orchac_123",
 *     data: {
 *       custom_amount: 10,
 *     }
 *   }
 * })
 *
 * @summary
 *
 * Update a shipping method of an order edit.
 * 
 * @property hooks.setPricingContext - This hook is executed before the shipping method's option is retrieved. You can consume this hook to return any custom context useful for the prices retrieval of shipping method's option.
 * 
 * For example, assuming you have the following custom pricing rule:
 * 
 * ```json
 * {
 *   "attribute": "location_id",
 *   "operator": "eq",
 *   "value": "sloc_123",
 * }
 * ```
 * 
 * You can consume the `setPricingContext` hook to add the `location_id` context to the prices calculation:
 * 
 * ```ts
 * import { updateOrderEditShippingMethodWorkflow } from "@medusajs/medusa/core-flows";
 * import { StepResponse } from "@medusajs/workflows-sdk";
 * 
 * updateOrderEditShippingMethodWorkflow.hooks.setPricingContext((
 *   { order, order_change, additional_data }, { container }
 * ) => {
 *   return new StepResponse({
 *     location_id: "sloc_123", // Special price for in-store purchases
 *   });
 * });
 * ```
 * 
 * The price of the shipping method's option will now be retrieved using the context you return.
 * 
 * :::note
 * 
 * Learn more about prices calculation context in the [Prices Calculation](https://docs.medusajs.com/resources/commerce-modules/pricing/price-calculation) documentation.
 * 
 * :::
 */
export const updateOrderEditShippingMethodWorkflow = createWorkflow(
  updateOrderEditShippingMethodWorkflowId,
  function (
    input: WorkflowData<
      OrderWorkflow.UpdateOrderEditShippingMethodWorkflowInput & AdditionalData
    >
  ) {
    const order: OrderDTO = useRemoteQueryStep({
      entry_point: "order_claim",
      fields: ["id", "currency_code"],
      variables: { id: input.order_id },
      list: false,
      throw_if_key_not_found: true,
    })

    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: ["id", "status", "version", "actions.*"],
      variables: {
        filters: {
          order_id: input.order_id,
          status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
        },
      },
      list: false,
    }).config({ name: "order-change-query" })

    const setPricingContext = createHook(
      "setPricingContext",
      {
        order: order,
        order_change: orderChange,
        additional_data: input.additional_data,
      },
      {
        resultValidator: pricingContextResult,
      }
    )
    const setPricingContextResult = setPricingContext.getResult()

    const shippingOptions = when({ input }, ({ input }) => {
      return input.data?.custom_amount === null
    }).then(() => {
      const action = transform(
        { orderChange, input, order },
        ({ orderChange, input, order }) => {
          const originalAction = (orderChange.actions ?? []).find(
            (a) => a.id === input.action_id
          ) as OrderChangeActionDTO

          return {
            shipping_method_id: originalAction.reference_id,
            currency_code: order.currency_code,
          }
        }
      )

      const pricingContext = transform(
        { action, setPricingContextResult },
        (data) => {
          return {
            ...(data.setPricingContextResult
              ? data.setPricingContextResult
              : {}),
            currency_code: data.action.currency_code,
          }
        }
      )

      const shippingMethod = useRemoteQueryStep({
        entry_point: "order_shipping_method",
        fields: ["id", "shipping_option_id"],
        variables: {
          id: action.shipping_method_id,
        },
        list: false,
      }).config({ name: "fetch-shipping-method" })

      return useRemoteQueryStep({
        entry_point: "shipping_option",
        fields: [
          "id",
          "name",
          "calculated_price.calculated_amount",
          "calculated_price.is_calculated_price_tax_inclusive",
        ],
        variables: {
          id: shippingMethod.shipping_option_id,
          calculated_price: {
            context: pricingContext,
          },
        },
      }).config({ name: "fetch-shipping-option" })
    })

    updateOrderEditShippingMethodValidationStep({
      orderChange,
      input,
    })

    const updateData = transform(
      { orderChange, input, shippingOptions },
      prepareShippingMethodUpdate
    )

    parallelize(
      updateOrderChangeActionsStep([updateData.action]),
      updateOrderShippingMethodsStep([updateData.shippingMethod!])
    )

    return new WorkflowResponse(
      previewOrderChangeStep(input.order_id) as OrderPreviewDTO,
      {
        hooks: [setPricingContext] as const,
      }
    )
  }
)
