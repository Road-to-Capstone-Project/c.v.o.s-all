import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { ModuleQuote, ModuleRelatedProduct, ModuleUpdateQuote, ModuleUpdateRelatedProduct } from "@starter/types";
import { updateRelatedProductStep } from "../steps/update-related-product";


/*
  A workflow that updates a quote. 
*/
export const updateRelatedProductsWorkflow = createWorkflow(
    "update-related-product-workflow",
    function (input: ModuleUpdateRelatedProduct[]): WorkflowResponse<ModuleRelatedProduct[]> {
        return new WorkflowResponse(updateRelatedProductStep(input));
    }
);