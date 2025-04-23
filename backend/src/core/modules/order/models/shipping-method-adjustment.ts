import { model } from "@medusajs/framework/utils"
import { OrderShippingMethod } from "./shipping-method"

const _OrderShippingMethodAdjustment = model
  .define(
    {
      tableName: "order_shipping_method_adjustment",
      name: "OrderShippingMethodAdjustment",
    },
    {
      id: model.id({ prefix: "ordsmadj" }).primaryKey(),
      description: model.text().nullable(),
      promotion_id: model.text().nullable(),
      code: model.text().nullable(),
      amount: model.bigNumber(),
      provider_id: model.text().nullable(),
      shipping_method: model.belongsTo<() => typeof OrderShippingMethod>(
        () => OrderShippingMethod,
        {
          mappedBy: "adjustments",
        }
      ),
    }
  )
  .indexes([
    {
      name: "IDX_order_shipping_method_adjustment_shipping_method_id",
      on: ["shipping_method_id"],
      unique: false,
    },
  ])

export const OrderShippingMethodAdjustment = _OrderShippingMethodAdjustment
