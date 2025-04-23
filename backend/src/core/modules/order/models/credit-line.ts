import { model } from "@medusajs/framework/utils"
import { Order } from "./order"

const OrderCreditLine_ = model
  .define("OrderCreditLine", {
    id: model.id({ prefix: "ordcl" }).primaryKey(),
    order: model.belongsTo(() => Order, {
      mappedBy: "credit_lines",
    }),
    reference: model.text().nullable(),
    reference_id: model.text().nullable(),
    amount: model.bigNumber(),
    raw_amount: model.json(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_order_credit_line_order_id",
      on: ["order_id"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_credit_line_deleted_at",
      on: ["deleted_at"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
  ])

export const OrderCreditLine = OrderCreditLine_
