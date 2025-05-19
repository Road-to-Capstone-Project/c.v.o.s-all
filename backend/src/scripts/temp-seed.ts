import { Logger } from "@medusajs/medusa";
import { ModuleCreateReview } from "@starter/types";
import {
    ExecArgs,
} from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    ModuleRegistrationName,
} from "@medusajs/framework/utils";
import { createReviewsWorkflow } from "src/workflows/review/workflows";
export default async function seedDemoData({ container }: ExecArgs) {
    const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const productModuleService = container.resolve(ModuleRegistrationName.PRODUCT)
    const customerModuleService = container.resolve(ModuleRegistrationName.CUSTOMER)
}