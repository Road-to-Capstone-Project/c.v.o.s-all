import {
  AdditionalData,
  OrderLineItemDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import { isDefined, MedusaError } from "@medusajs/framework/utils"
import {
  createHook,
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { findOneOrAnyRegionStep } from "../../cart/steps/find-one-or-any-region"
import { findOrCreateCustomerStep } from "../../cart/steps/find-or-create-customer"
import { findSalesChannelStep } from "../../cart/steps/find-sales-channel"
import { validateLineItemPricesStep } from "../../cart/steps/validate-line-item-prices"
import { validateVariantPricesStep } from "../../cart/steps/validate-variant-prices"
import {
  prepareLineItemData,
  PrepareLineItemDataInput,
} from "../../cart/utils/prepare-line-item-data"
import { confirmVariantInventoryWorkflow } from "../../cart/workflows/confirm-variant-inventory"
import { useRemoteQueryStep } from "../../common"
import { createOrderLineItemsStep } from "../steps"
import { productVariantsFields } from "../utils/fields"
import { pricingContextResult } from "../../cart/utils/schemas"

function prepareLineItems(data) {
  const items = (data.input.items ?? []).map((item) => {
    const variant = data.variants?.find((v) => v.id === item.variant_id)!

    const input: PrepareLineItemDataInput = {
      item,
      variant: variant,
      unitPrice: item.unit_price,
      isTaxInclusive:
        item.is_tax_inclusive ??
        variant?.calculated_price?.is_calculated_price_tax_inclusive,
      isCustomPrice: isDefined(item?.unit_price),
      taxLines: item.tax_lines || [],
      adjustments: item.adjustments || [],
    }

    if (variant && !input.unitPrice) {
      input.unitPrice = variant.calculated_price?.calculated_amount
    }

    return prepareLineItemData(input)
  })

  return items
}

/**
 * The created order line items.
 */
export type OrderAddLineItemWorkflowOutput = OrderLineItemDTO[]

export const addOrderLineItemsWorkflowId = "order-add-line-items"
/**
 * This workflow adds line items to an order. This is useful when making edits to
 * an order. It's used by other workflows, such as {@link orderEditAddNewItemWorkflow}.
 *
 * You can use this workflow within your customizations or your own custom workflows, allowing you to wrap custom logic around adding items to
 * an order.
 *
 * @example
 * const { result } = await addOrderLineItemsWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *     items: [
 *       {
 *         variant_id: "variant_123",
 *         quantity: 1,
 *       }
 *     ]
 *   }
 * })
 *
 * @summary
 *
 * Add line items to an order.
 * 
 * @property hooks.setPricingContext - This hook is executed after the order is retrieved and before the line items are created. You can consume this hook to return any custom context useful for the prices retrieval of the variants to be added to the order.
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
 * import { addOrderLineItemsWorkflow } from "@medusajs/medusa/core-flows";
 * import { StepResponse } from "@medusajs/workflows-sdk";
 * 
 * addOrderLineItemsWorkflow.hooks.setPricingContext((
 *   { order, variantIds, region, customerData, additional_data }, { container }
 * ) => {
 *   return new StepResponse({
 *     location_id: "sloc_123", // Special price for in-store purchases
 *   });
 * });
 * ```
 * 
 * The variants' prices will now be retrieved using the context you return.
 * 
 * :::note
 * 
 * Learn more about prices calculation context in the [Prices Calculation](https://docs.medusajs.com/resources/commerce-modules/pricing/price-calculation) documentation.
 * 
 * :::
 */
export const addOrderLineItemsWorkflow = createWorkflow(
  addOrderLineItemsWorkflowId,
  (
    input: WorkflowData<
      OrderWorkflow.OrderAddLineItemWorkflowInput & AdditionalData
    >
  ) => {
    const order = useRemoteQueryStep({
      entry_point: "orders",
      fields: [
        "id",
        "sales_channel_id",
        "region_id",
        "customer_id",
        "email",
        "currency_code",
      ],
      variables: { id: input.order_id },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "order-query" })

    const variantIds = transform({ input }, (data) => {
      return (data.input.items ?? [])
        .map((item) => item.variant_id)
        .filter(Boolean) as string[]
    })

    const [salesChannel, region, customerData] = parallelize(
      findSalesChannelStep({
        salesChannelId: order.sales_channel_id,
      }),
      findOneOrAnyRegionStep({
        regionId: order.region_id,
      }),
      findOrCreateCustomerStep({
        customerId: order.customer_id,
        email: order.email,
      })
    )

    const setPricingContext = createHook(
      "setPricingContext",
      {
        order,
        variantIds,
        region,
        customerData,
        additional_data: input.additional_data,
      },
      {
        resultValidator: pricingContextResult,
      }
    )
    const setPricingContextResult = setPricingContext.getResult()

    const pricingContext = transform(
      { input, region, customerData, order, setPricingContextResult },
      (data) => {
        if (!data.region) {
          throw new MedusaError(MedusaError.Types.NOT_FOUND, "Region not found")
        }

        return {
          ...(data.setPricingContextResult ? data.setPricingContextResult : {}),
          currency_code: data.order.currency_code ?? data.region.currency_code,
          region_id: data.region.id,
          customer_id: data.customerData.customer?.id,
        }
      }
    )

    const variants = when({ variantIds }, ({ variantIds }) => {
      return !!variantIds.length
    }).then(() => {
      return useRemoteQueryStep({
        entry_point: "variants",
        fields: productVariantsFields,
        variables: {
          id: variantIds,
          calculated_price: {
            context: pricingContext,
          },
        },
      })
    })

    validateVariantPricesStep({ variants })

    confirmVariantInventoryWorkflow.runAsStep({
      input: {
        sales_channel_id: salesChannel.id,
        variants,
        items: input.items!,
      },
    })

    const lineItems = transform({ input, variants }, prepareLineItems)

    validateLineItemPricesStep({ items: lineItems })

    return new WorkflowResponse(
      createOrderLineItemsStep({
        items: lineItems,
      }) satisfies OrderAddLineItemWorkflowOutput,
      {
        hooks: [setPricingContext] as const,
      }
    )
  }
)
