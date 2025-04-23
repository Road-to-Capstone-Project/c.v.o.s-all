import { model } from "@medusajs/framework/utils"
import { OrderLineItem } from "./line-item"

const _OrderLineItemAdjustment = model
  .define("OrderLineItemAdjustment", {
    id: model.id({ prefix: "ordliadj" }).primaryKey(),
    description: model.text().nullable(),
    promotion_id: model.text().nullable(),
    code: model.text().nullable(),
    amount: model.bigNumber(),
    provider_id: model.text().nullable(),
    item: model.belongsTo<() => typeof OrderLineItem>(() => OrderLineItem, {
      mappedBy: "adjustments",
    }),
  })
  .indexes([
    {
      name: "IDX_order_order_line_item_adjustment_item_id",
      on: ["item_id"],
      unique: false,
    },
  ])

export const OrderLineItemAdjustment = _OrderLineItemAdjustment
