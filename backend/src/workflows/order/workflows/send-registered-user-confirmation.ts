import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { sendNotificationStep } from "../steps/send-notification"

type WorkflowInput = {
    customerId: string
}

export const sendCustomerRegistrationWorkflow = createWorkflow(
    "send-customer-registration",
    ({ customerId }: WorkflowInput) => {
        // Fetch customer data using customerId
        // @ts-ignore
        const { data: customers } = useQueryGraphStep({
            entity: "customer",  // Change to "customer" instead of "user"
            fields: [
                "id",
                "email",
                "first_name",
                "last_name",
                "created_at",
            ],
            filters: {
                id: customerId,  // Fetch customer by customerId
            },
        })

        // Check if the customer data exists and contains the required fields
        if (!customers || customers.length === 0) {
            throw new Error(`Customer with id ${customerId} not found`);
        }

        const customer = customers[0];

        // Check if the essential fields like first_name are present
        if (!customer.first_name || !customer.email) {
            throw new Error("Missing required customer fields: first_name or email");
        }

        // Send the registration notification email to the customer
        const notification = sendNotificationStep([{
            to: customer.email ?? "",  // Use customer's email
            channel: "email",
            template: "user-created",  // Use the customer-registered template
            data: {
                customer,  // Pass customer data
            },
        }])

        return new WorkflowResponse(notification)
    }
)
