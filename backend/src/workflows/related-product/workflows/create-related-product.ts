import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { ModuleCreateRelatedProduct, ModuleRelatedProduct } from "@starter/types";
import { createRelatedProductStep } from "../steps/create-related-product";


/*
  A workflow that creates a RelatedProduct entity that manages the RelatedProduct lifecycle.
*/
export const createRelatedProductWorkflow = createWorkflow(
  "create-related-product-workflow",
  function (input: ModuleCreateRelatedProduct): WorkflowResponse<ModuleRelatedProduct> {
    return new WorkflowResponse(createRelatedProductStep(input));
  }
);
