import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
    IReviewModuleService,
    ModuleCreateReview,
    ModuleReview,
} from "@starter/types";
import { REVIEW_MODULE } from "src/modules/review";

/*
  A step to create a review.
  
  This is being used in the create review workflow.
  The first function attempts to create the review, while the second function attempts to delete
  the created review if the workflow fails.
*/
export const createReviewStep = createStep(
    "create-review",
    async (input: ModuleCreateReview, { container }): Promise<StepResponse<ModuleReview, string>> => {
        const reviewModule = container.resolve<IReviewModuleService>(REVIEW_MODULE);

        const review = await reviewModule.createReviews(input);

        return new StepResponse(review, review.id);
    },
    async (reviewId: string, { container }) => {
        if (!reviewId) {
            return;
        }
        const reviewModule = container.resolve<IReviewModuleService>(REVIEW_MODULE);

        await reviewModule.deleteReviews([reviewId]);
    }
);
