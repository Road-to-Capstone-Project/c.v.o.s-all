import type {
    SubscriberArgs,
    SubscriberConfig,
} from "@medusajs/framework"
import { sendCustomerRegistrationWorkflow } from "src/workflows/order/workflows/send-registered-user-confirmation"

export default async function userPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const logger = container.resolve("logger")
    logger.info("Sending customer signup confirmation email...")
    await sendCustomerRegistrationWorkflow(container)
        .run({
            input: {
                customerId: data.id,
            },
        })
    logger.info("Finished sending customer signup confirmation email")
}

export const config: SubscriberConfig = {
    event: "customer.created",
}