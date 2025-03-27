import type {
    SubscriberArgs,
    SubscriberConfig,
} from "@medusajs/framework"
import { sendCustomerRegistrationWorkflow } from "src/workflows/order/workflows/send-registered-user-confirmation"

export default async function userPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    await sendCustomerRegistrationWorkflow(container)
        .run({
            input: {
                customerId: data.id,
            },
        })
}

export const config: SubscriberConfig = {
    event: "customer.created",
}