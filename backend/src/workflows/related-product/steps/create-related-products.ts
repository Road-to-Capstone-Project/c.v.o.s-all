import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
    IRelatedProductModuleService,
    ModuleCreateRelatedProduct,
    ModuleRelatedProduct,
} from "@starter/types";
import { RELATED_PRODUCT_MODULE } from "../../../modules/related-product";

/*
  A step to create related products.
  
  This is being used in the create related products workflow.
  The first function attempts to create related products, while the second function attempts to delete
  created related products if the workflow fails.
*/
export const createRelatedProductsStep = createStep(
    "create-related-products",
    async (
        input: ModuleCreateRelatedProduct[],
        { container }
    ): Promise<StepResponse<ModuleRelatedProduct[], string[]>> => {
        const relatedProductModule = container.resolve<IRelatedProductModuleService>(RELATED_PRODUCT_MODULE);

        const relatedProducts = await relatedProductModule.createRelatedProducts(input);

        return new StepResponse(
            relatedProducts,
            relatedProducts.map((RelatedProduct) => RelatedProduct.id)
        );
    },
    async (relatedProductIds: string[], { container }) => {
        const relatedProductModule = container.resolve<IRelatedProductModuleService>(RELATED_PRODUCT_MODULE);

        await relatedProductModule.deleteRelatedProducts(relatedProductIds);
    }
);
