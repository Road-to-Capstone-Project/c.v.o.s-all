import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { ModuleCreateReview, ModuleReview } from "@starter/types";
import { createReviewStep } from "../steps/create-review";


/*
  A workflow that creates a review entity that manages the review lifecycle.
*/
export const createReviewWorkflow = createWorkflow(
    "create-review-workflow",
    function (input: ModuleCreateReview): WorkflowResponse<ModuleReview> {
        return new WorkflowResponse(createReviewStep(input));
    }
);
