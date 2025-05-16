import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { ModuleCreateRelatedProduct, ModuleRelatedProduct } from "@starter/types";
import { createRelatedProductsStep } from "../steps/create-related-products";


/*
  A workflow that creates mutiple RelatedProducts entity that manages the RelatedProduct lifecycle.
*/
export const createRelatedProductsWorkflow = createWorkflow(
  "create-related-products-workflow",
  function (input: ModuleCreateRelatedProduct[]): WorkflowResponse<ModuleRelatedProduct[]> {
    return new WorkflowResponse(createRelatedProductsStep(input));
  }
);
