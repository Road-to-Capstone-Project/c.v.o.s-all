import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { ModuleCreateReview, ModuleReview } from "@starter/types";
import { createReviewsStep } from "../steps/create-reviews";


/*
  A workflow that creates mutiple reviews entity that manages the review lifecycle.
*/
export const createReviewsWorkflow = createWorkflow(
    "create-reviews-workflow",
    function (input: ModuleCreateReview[]): WorkflowResponse<ModuleReview[]> {
        return new WorkflowResponse(createReviewsStep(input));
    }
);
