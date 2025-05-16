import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
    IRelatedProductModuleService,
    ModuleCreateRelatedProduct,
    ModuleRelatedProduct,
} from "@starter/types";
import { RELATED_PRODUCT_MODULE } from "../../../modules/related-product";

/*
  A step to create a related product.
  
  This is being used in the create related product workflow.
  The first function attempts to create the related product, while the second function attempts to delete
  created related product if the workflow fails.
*/
export const createRelatedProductStep = createStep(
    "create-related-product",
    async (
        input: ModuleCreateRelatedProduct,
        { container }
    ): Promise<StepResponse<ModuleRelatedProduct, string>> => {
        const relatedProductModule = container.resolve<IRelatedProductModuleService>(RELATED_PRODUCT_MODULE);

        const relatedProduct = await relatedProductModule.createRelatedProducts(input);

        return new StepResponse(
            relatedProduct,
            relatedProduct.id
        );
    },
    async (relatedProductId: string, { container }) => {
        if (!relatedProductId) {
            return;
        }
        const reviewModule = container.resolve<IRelatedProductModuleService>(RELATED_PRODUCT_MODULE);

        await reviewModule.deleteRelatedProducts([relatedProductId]);
    }
);
