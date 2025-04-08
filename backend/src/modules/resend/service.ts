import {
    AbstractNotificationProviderService,
    MedusaError,
} from "@medusajs/framework/utils"
import {
    Logger,
    ProviderSendNotificationDTO,
    ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import {
    CreateEmailOptions,
    Resend,
} from "resend"

import { orderPlacedEmail } from "./emails/order-placed"
import { newUserRegistrationEmail } from "./emails/user-created"
import ResetPasswordTemplate from "./emails/reset-password-template"


type ResendOptions = {
    api_key: string
    from: string
    html_templates?: Record<string, {
        subject?: string
        content: string
    }>
}

type InjectedDependencies = {
    logger: Logger
}

enum Templates {
    ORDER_PLACED = "order-placed",
    CREATED_USER = "user-created",
    RESET_PASSWORD = "reset-password-template",
}

const templates: { [key in Templates]?: (props: unknown) => React.ReactNode } = {
    [Templates.ORDER_PLACED]: orderPlacedEmail,
    [Templates.CREATED_USER]: newUserRegistrationEmail,
    [Templates.RESET_PASSWORD]: ResetPasswordTemplate,
}




class ResendNotificationProviderService extends AbstractNotificationProviderService {
    static identifier = "notification-resend"
    private resendClient: Resend
    private options: ResendOptions
    private logger: Logger
    constructor(
        { logger }: InjectedDependencies,
        options: ResendOptions
    ) {
        super()
        this.resendClient = new Resend(options.api_key)
        this.options = options
        this.logger = logger
    }
    static validateOptions(options: Record<any, any>) {
        if (!options.api_key) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Option `api_key` is required in the provider's options."
            )
        }
        if (!options.from) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Option `from` is required in the provider's options."
            )
        }
    }
    getTemplate(template: Templates) {
        if (this.options.html_templates?.[template]) {
            return this.options.html_templates[template].content
        }
        const allowedTemplates = Object.keys(templates)

        if (!allowedTemplates.includes(template)) {
            return null
        }

        return templates[template]
    }

    getTemplateSubject(template: Templates) {
        if (this.options.html_templates?.[template]?.subject) {
            return this.options.html_templates[template].subject
        }
        switch (template) {
            case Templates.ORDER_PLACED:
                return "Order Confirmation"
            case Templates.CREATED_USER:
                return "Welcome to C.V.O.S"
            case Templates.RESET_PASSWORD:
                return "C.V.O.S Reset Password Approval"
            default:
                return "New Email"
        }
    }
    async send(
        notification: ProviderSendNotificationDTO
    ): Promise<ProviderSendNotificationResultsDTO> {
        const template = this.getTemplate(notification.template as Templates)

        if (!template) {
            this.logger.error(`Couldn't find an email template for ${notification.template}. The valid options are ${Object.values(Templates)}`)
            return {}
        }

        const emailOptions: CreateEmailOptions = {
            from: this.options.from,
            to: [notification.to],
            subject: this.getTemplateSubject(notification.template as Templates),
            html: "",
        }

        if (typeof template === "string") {
            emailOptions.html = template
        } else {
            emailOptions.react = template(notification.data)
            delete (emailOptions as { html?: string }).html;
        }

        const { data, error } = await this.resendClient.emails.send(emailOptions)

        if (error) {
            this.logger.error(`Failed to send email`, error)
            return {}
        }

        if (!data) {
            this.logger.error(`Failed to send email, no data returned`)
            return {}
        }
        return { id: data.id }
    }


}

export default ResendNotificationProviderService