import {
    type SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, ModuleRegistrationName } from "@medusajs/framework/utils";
import { IFulfillmentModuleService, MedusaContainer, ProductVariantDTO } from "@medusajs/framework/types";
import { createRelatedProductsWorkflow, updateRelatedProductsWorkflow, } from "src/workflows/related-product/workflows";
import { ModuleCreateRelatedProduct, ModuleUpdateRelatedProduct } from "@starter/types";

async function upsertCopurchaseRecord(
    queryProductId: string | undefined,
    candidateProductId: string | undefined,
    container: MedusaContainer
) {
    const query = container.resolve("query");
    const logger = container.resolve("logger")
    try {
        const {
            data: [relatedProductsItem],
        } = await query.graph(
            {
                entity: "related_product",
                filters: {
                    query_product_id: queryProductId,
                    candidate_product_id: candidateProductId
                },
                fields: ['*'],
            },
            { throwIfKeyNotFound: true }
        );
        if (relatedProductsItem) {
            // Update workflow here
            await updateRelatedProductsWorkflow(
                container
            ).run({
                input: [{ id: relatedProductsItem.id, copurchase_frequency: (relatedProductsItem.copurchase_frequency + 1) }] as ModuleUpdateRelatedProduct[],
            });
            logger.info(`Incremented counter for copurchase: query=${queryProductId}, candidate=${candidateProductId}`);
        } else {
            // Create workflow here
            await createRelatedProductsWorkflow(
                container
            ).run({
                input: [{
                    query_product_id: queryProductId,
                    candidate_product_id: candidateProductId, copurchase_frequency: 1
                }] as ModuleCreateRelatedProduct[],
            });
            logger.info(`Created new copurchase record: query=${queryProductId}, candidate=${candidateProductId}`);
        }
    } catch (error) {
        logger.error(`Error upserting copurchase record for query=${queryProductId}, candidate=${candidateProductId}: ${error.message || error}`);
    }
}


export default async function deliveryCreatedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const logger = container.resolve("logger")
    const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(
        ModuleRegistrationName.FULFILLMENT
    );
    const productModuleService = container.resolve(ModuleRegistrationName.PRODUCT)

    let productVariants: ProductVariantDTO[];

    logger.info(`Retrieving fulfillment record for delivery ID: ${data.id}`);
    const [fulfillmentRecord] = await fulfillmentModuleService.listFulfillments({ id: data.id }, { relations: ["items"], });
    productVariants = await productModuleService.listProductVariants({ sku: fulfillmentRecord.items.map((item) => item.sku) }, { select: ["product_id"] })

    const productIds = [...new Set(productVariants.map((variant) => variant.product_id?.toString()))];

    if (productIds.length < 2) {
        logger.info("Order contains less than two distinct products. Skipping copurchase frequency update.");
    } else {
        logger.info(`Updating copurchase frequency for product IDs: ${productIds.join(", ")}`);
        for (let i = 0; i < productIds.length; i++) {
            for (let j = i + 1; j < productIds.length; j++) {
                const productIdA = productIds[i];
                const productIdB = productIds[j];

                // Update for A -> B
                await upsertCopurchaseRecord(productIdA, productIdB, container);
                // Update for B -> A
                await upsertCopurchaseRecord(productIdB, productIdA, container);
            }
        }
        logger.info("Finished updating copurchase frequency.");
    }
}

export const config: SubscriberConfig = {
    event: "delivery.created",
}