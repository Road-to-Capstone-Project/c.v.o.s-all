import {
    Logger,
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/medusa"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function resetPasswordTokenHandler({
    event: { data: {
        entity_id: email,
        token,
        actor_type,
    } },
    container,
}: SubscriberArgs<{ entity_id: string, token: string, actor_type: string }>) {
    const notificationModuleService = container.resolve(
        Modules.NOTIFICATION
    )
    const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER);

    const urlPrefix = actor_type === "customer" ?
        process.env.PUBLIC_MEDUSA_STOREFRONT_URL :
        process.env.PUBLIC_MEDUSA_BACKEND_URL

    try {
        const resetLink = `${urlPrefix}/account/profile?token=${token}&email=${email}`
        await notificationModuleService.createNotifications({
            to: email,
            channel: "email",
            template: "reset-password-template",
            data: {
                // a URL to a frontend application
                resetLink: resetLink,
            },
        })
        logger.info(`Reset link is ${resetLink}`)
    } catch (error) {
        logger.error(error)
    }
}

export const config: SubscriberConfig = {
    event: "auth.password_reset",
}