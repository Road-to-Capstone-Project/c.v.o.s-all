import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { trainRecommendationModelsWorkflow } from "src/workflows/product/workflows"


export default async function trainRecommendationModelsJob(container: MedusaContainer) {
    const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    logger.info("Starting train recommendation models job");
    await trainRecommendationModelsWorkflow(container)
        .run()
    logger.info("Finished train recommendation models job");

}

export const config = {
    name: "train-recommendation-models-job",
    schedule: "0 0 * * *",
}