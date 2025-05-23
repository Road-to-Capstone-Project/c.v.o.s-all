import {
  FulfillmentWorkflow,
  OrderChangeDTO,
  OrderDTO,
  OrderPreviewDTO,
  OrderReturnItemDTO,
  ReturnDTO,
} from "@medusajs/framework/types"
import {
  ChangeActionType,
  MedusaError,
  Modules,
  OrderChangeStatus,
  OrderWorkflowEvents,
  ReturnStatus,
} from "@medusajs/framework/utils"
import {
  WorkflowResponse,
  createStep,
  createWorkflow,
  parallelize,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  emitEventStep,
  useRemoteQueryStep,
} from "../../../common"
import { createReturnFulfillmentWorkflow } from "../../../fulfillment/workflows/create-return-fulfillment"
import { previewOrderChangeStep, updateReturnsStep } from "../../steps"
import { confirmOrderChanges } from "../../steps/confirm-order-changes"
import { createReturnItemsFromActionsStep } from "../../steps/return/create-return-items-from-actions"
import {
  throwIfIsCancelled,
  throwIfOrderChangeIsNotActive,
} from "../../utils/order-validation"
import { createOrUpdateOrderPaymentCollectionWorkflow } from "../create-or-update-order-payment-collection"

/**
 * The data to validate that a return request can be confirmed.
 */
export type ConfirmReturnRequestValidationStepInput = {
  /**
   * The order's details.
   */
  order: OrderDTO
  /**
   * The order return's details.
   */
  orderReturn: ReturnDTO
  /**
   * The order change's details.
   */
  orderChange: OrderChangeDTO
}

/**
 * This step validates that a return request can be confirmed.
 * If the order or return is canceled or the order change is not active, the step will throw an error.
 *
 * :::note
 *
 * You can retrieve an order, order change, and return details using [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query),
 * or [useQueryGraphStep](https://docs.medusajs.com/resources/references/medusa-workflows/steps/useQueryGraphStep).
 *
 * :::
 *
 * @example
 * const data = confirmReturnRequestValidationStep({
 *   order: {
 *     id: "order_123",
 *     // other order details...
 *   },
 *   orderReturn: {
 *     id: "return_123",
 *     // other order return details...
 *   },
 *   orderChange: {
 *     id: "orch_123",
 *     // other order change details...
 *   }
 * })
 */
export const confirmReturnRequestValidationStep = createStep(
  "validate-confirm-return-request",
  async function ({
    order,
    orderChange,
    orderReturn,
  }: ConfirmReturnRequestValidationStepInput) {
    throwIfIsCancelled(order, "Order")
    throwIfIsCancelled(orderReturn, "Return")
    throwIfOrderChangeIsNotActive({ orderChange })
  }
)

/**
 * This step confirms that a requested return has at least one item
 */
const confirmIfReturnItemsArePresent = createStep(
  "confirm-if-return-items-are-present",
  async function ({ returnItems }: { returnItems: OrderReturnItemDTO[] }) {
    if (returnItems.length > 0) {
      return
    }

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Order return request should have at least 1 item`
    )
  }
)

function prepareFulfillmentData({
  order,
  items,
  returnShippingOption,
}: {
  order: OrderDTO
  items: any[]
  returnShippingOption: {
    id: string
    provider_id: string
    service_zone: {
      fulfillment_set: {
        location?: {
          id: string
          address: Record<string, any>
        }
      }
    }
  }
}) {
  const orderItemsMap = new Map<string, Required<OrderDTO>["items"][0]>(
    order.items!.map((i) => [i.id, i])
  )
  const fulfillmentItems = items.map((i) => {
    const orderItem = orderItemsMap.get(i.item_id)!
    return {
      line_item_id: i.item_id,
      quantity: i.quantity,
      return_quantity: i.quantity,
      title: orderItem.variant_title ?? orderItem.title,
      sku: orderItem.variant_sku || "",
      barcode: orderItem.variant_barcode || "",
    } as FulfillmentWorkflow.CreateFulfillmentItemWorkflowDTO
  })

  const locationId =
    returnShippingOption.service_zone.fulfillment_set.location?.id!

  // delivery address is the stock location address
  const address =
    returnShippingOption.service_zone.fulfillment_set.location?.address ?? {}

  delete address.id

  return {
    input: {
      location_id: locationId,
      provider_id: returnShippingOption.provider_id,
      shipping_option_id: returnShippingOption.id,
      items: fulfillmentItems,
      delivery_address: address,
      order: order,
    },
  }
}

function extractReturnShippingOptionId({ orderPreview, orderReturn }) {
  for (const shippingMethod of orderPreview.shipping_methods ?? []) {
    const modifiedShippingMethod_ = shippingMethod as any
    if (!modifiedShippingMethod_.actions) {
      continue
    }

    const methodAction = modifiedShippingMethod_.actions.find((action) => {
      return (
        action.action === ChangeActionType.SHIPPING_ADD &&
        action.return_id === orderReturn.id
      )
    })

    if (methodAction) {
      return modifiedShippingMethod_.shipping_option_id
    }
  }

  return null
}

function getUpdateReturnData({ orderReturn }: { orderReturn: { id: string } }) {
  return transform({ orderReturn }, ({ orderReturn }) => {
    return [
      {
        id: orderReturn.id,
        status: ReturnStatus.REQUESTED,
        requested_at: new Date(),
      },
    ]
  })
}

/**
 * The details of confirming a return request.
 */
export type ConfirmReturnRequestWorkflowInput = {
  /**
   * The ID of the return to confirm its request.
   */
  return_id: string
  /**
   * The ID of the user confirming the return request.
   */
  confirmed_by?: string
}

export const confirmReturnRequestWorkflowId = "confirm-return-request"
/**
 * This workflow confirms a return request. It's used by the
 * [Confirm Return Request Admin API Route](https://docs.medusajs.com/api/admin#returns_postreturnsidrequest).
 *
 * You can use this workflow within your customizations or your own custom workflows, allowing you to confirm a return request
 * in your custom flow.
 *
 * @example
 * const { result } = await confirmReturnRequestWorkflow(container)
 * .run({
 *   input: {
 *     return_id: "return_123",
 *   }
 * })
 *
 * @summary
 *
 * Confirm a return request.
 */
export const confirmReturnRequestWorkflow = createWorkflow(
  confirmReturnRequestWorkflowId,
  function (
    input: ConfirmReturnRequestWorkflowInput
  ): WorkflowResponse<OrderPreviewDTO> {
    const orderReturn: ReturnDTO = useRemoteQueryStep({
      entry_point: "return",
      fields: ["id", "status", "order_id", "location_id", "canceled_at"],
      variables: { id: input.return_id },
      list: false,
      throw_if_key_not_found: true,
    })

    const order: OrderDTO = useRemoteQueryStep({
      entry_point: "orders",
      fields: [
        "id",
        "version",
        "canceled_at",
        "items.id",
        "items.title",
        "items.variant_title",
        "items.variant_sku",
        "items.variant_barcode",
      ],
      variables: { id: orderReturn.order_id },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "order-query" })

    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: [
        "id",
        "status",
        "actions.id",
        "actions.action",
        "actions.details",
        "actions.reference",
        "actions.reference_id",
        "actions.internal_note",
      ],
      variables: {
        filters: {
          order_id: orderReturn.order_id,
          return_id: orderReturn.id,
          status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
        },
      },
      list: false,
    }).config({ name: "order-change-query" })

    const returnItemActions = transform({ orderChange }, (data) => {
      return data.orderChange.actions.filter(
        (act) => act.action === ChangeActionType.RETURN_ITEM
      )
    })

    confirmReturnRequestValidationStep({ order, orderReturn, orderChange })

    const orderPreview = previewOrderChangeStep(order.id)

    const createdReturnItems = createReturnItemsFromActionsStep({
      returnId: orderReturn.id,
      changes: returnItemActions,
    })

    confirmIfReturnItemsArePresent({ returnItems: createdReturnItems })

    const returnShippingOptionId = transform(
      { orderPreview, orderReturn },
      extractReturnShippingOptionId
    )

    when({ returnShippingOptionId }, ({ returnShippingOptionId }) => {
      return !!returnShippingOptionId
    }).then(() => {
      const returnShippingOption = useRemoteQueryStep({
        entry_point: "shipping_options",
        fields: [
          "id",
          "provider_id",
          "service_zone.fulfillment_set.location.id",
          "service_zone.fulfillment_set.location.address.*",
        ],
        variables: {
          id: returnShippingOptionId,
        },
        list: false,
      }).config({ name: "return-shipping-option" })

      const fulfillmentData = transform(
        { order, items: createdReturnItems, returnShippingOption },
        prepareFulfillmentData
      )

      const returnFulfillment =
        createReturnFulfillmentWorkflow.runAsStep(fulfillmentData)

      const link = transform(
        { orderReturn, fulfillment: returnFulfillment },
        (data) => {
          return [
            {
              [Modules.ORDER]: { return_id: data.orderReturn.id },
              [Modules.FULFILLMENT]: { fulfillment_id: data.fulfillment.id },
            },
          ]
        }
      )

      createRemoteLinkStep(link)
    })

    const updateReturnData = getUpdateReturnData({ orderReturn })

    parallelize(
      updateReturnsStep(updateReturnData),
      confirmOrderChanges({
        changes: [orderChange],
        orderId: order.id,
        confirmed_by: input.confirmed_by,
      }),
      emitEventStep({
        eventName: OrderWorkflowEvents.RETURN_REQUESTED,
        data: {
          order_id: order.id,
          return_id: orderReturn.id,
        },
      })
    )

    createOrUpdateOrderPaymentCollectionWorkflow.runAsStep({
      input: {
        order_id: order.id,
      },
    })

    return new WorkflowResponse(orderPreview)
  }
)
