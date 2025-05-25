import {
    convertItemResponseToUpdateRequest,
    getSelectsAndRelationsFromObjectArray,
} from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { IRelatedProductModuleService, ModuleUpdateRelatedProduct } from "@starter/types";
import { QUOTE_MODULE } from "../../../modules/quote";
import { RELATED_PRODUCT_MODULE } from "src/modules/related-product";

/*
  A step to update single related product pairs.
  
  The first function attempts to update the related product pairs, while the second function attempts to revert the update.
  The first function is also in charge of preparing the data to be reverted in the second function.
*/
export const updateRelatedProductStep = createStep(
    "update-related-product",
    async (data: ModuleUpdateRelatedProduct[], { container }) => {
        const relatedProductModule = container.resolve<IRelatedProductModuleService>(RELATED_PRODUCT_MODULE);

        const dataBeforeUpdate = await relatedProductModule.listRelatedProducts(
            { id: data.map((d) => d.id) }
        )

        const updatedRelatedProducts = await relatedProductModule.updateRelatedProducts(data);

        return new StepResponse(updatedRelatedProducts, {
            dataBeforeUpdate,
        });
    },
    async (revertInput, { container }) => {
        if (!revertInput) {
            return;
        }
        const relatedProductModule = container.resolve<IRelatedProductModuleService>(RELATED_PRODUCT_MODULE);

        const { dataBeforeUpdate } = revertInput;

        await relatedProductModule.updateRelatedProducts(dataBeforeUpdate
        );
    }
);
