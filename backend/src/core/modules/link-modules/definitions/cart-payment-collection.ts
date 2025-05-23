import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { LINKS, Modules } from "@medusajs/framework/utils"

export const CartPaymentCollection: ModuleJoinerConfig = {
  serviceName: LINKS.CartPaymentCollection,
  isLink: true,
  databaseConfig: {
    tableName: "cart_payment_collection",
    idPrefix: "capaycol",
  },
  alias: [
    {
      name: ["cart_payment_collection", "cart_payment_collections"],
      entity: "LinkCartPaymentCollection",
    },
  ],
  primaryKeys: ["id", "cart_id", "payment_collection_id"],
  relationships: [
    {
      serviceName: Modules.CART,
      entity: "Cart",
      primaryKey: "id",
      foreignKey: "cart_id",
      alias: "cart",
      args: {
        methodSuffix: "Carts",
      },
    },
    {
      serviceName: Modules.PAYMENT,
      entity: "PaymentCollection",
      primaryKey: "id",
      foreignKey: "payment_collection_id",
      alias: "payment_collection",
      args: {
        methodSuffix: "PaymentCollections",
      },
      hasMany: true,
    },
  ],
  extends: [
    {
      serviceName: Modules.CART,
      entity: "Cart",
      fieldAlias: {
        payment_collection: "payment_collection_link.payment_collection",
      },
      relationship: {
        serviceName: LINKS.CartPaymentCollection,
        primaryKey: "cart_id",
        foreignKey: "id",
        alias: "payment_collection_link",
      },
    },
    {
      serviceName: Modules.PAYMENT,
      entity: "PaymentCollection",
      fieldAlias: {
        cart: "cart_link.cart",
      },
      relationship: {
        serviceName: LINKS.CartPaymentCollection,
        primaryKey: "payment_collection_id",
        foreignKey: "id",
        alias: "cart_link",
      },
    },
  ],
}
