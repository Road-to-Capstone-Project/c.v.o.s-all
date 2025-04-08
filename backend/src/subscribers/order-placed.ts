import {
    type SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/framework"
import { sendOrderConfirmationWorkflow } from "../workflows/order/workflows/send-order-confirmation"

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {

    const logger = container.resolve("logger")

    logger.info("Sending order confirmation email...")

    await sendOrderConfirmationWorkflow(container)
        .run({
            input: {
                id: data.id,
            },
        })

    logger.info("Finished sending order confirmation email")
}

export const config: SubscriberConfig = {
    event: "order.placed",
}