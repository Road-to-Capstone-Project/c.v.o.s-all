import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import {
  Payment,
  PaymentCollection,
  PaymentProvider,
  PaymentSession,
  RefundReason,
  AccountHolder,
} from "@models"
import { default as schema } from "./schema"

export const joinerConfig = defineJoinerConfig(Modules.PAYMENT, {
  schema,
  models: [
    Payment,
    PaymentCollection,
    PaymentProvider,
    PaymentSession,
    RefundReason,
    AccountHolder,
  ],
  linkableKeys: {
    payment_id: Payment.name,
    payment_collection_id: PaymentCollection.name,
    payment_provider_id: PaymentProvider.name,
    refund_reason_id: RefundReason.name,
    account_holder_id: AccountHolder.name,
  },
  alias: [
    {
      name: ["payment_method", "payment_methods"],
      entity: "PaymentMethod",
      args: {
        methodSuffix: "PaymentMethods",
      },
    },
  ],
})
