import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
    IReviewModuleService,
    ModuleCreateReview,
    ModuleReview,
} from "@starter/types";
import { REVIEW_MODULE } from "../../../modules/review";

/*
  A step to create reviews.
  
  This is being used in the create reviews workflow.
  The first function attempts to create reviews, while the second function attempts to delete
  created reviews if the workflow fails.
*/
export const createReviewsStep = createStep(
    "create-reviews",
    async (
        input: ModuleCreateReview[],
        { container }
    ): Promise<StepResponse<ModuleReview[], string[]>> => {
        const reviewModule = container.resolve<IReviewModuleService>(REVIEW_MODULE);

        const reviews = await reviewModule.createReviews(input);

        return new StepResponse(
            reviews,
            reviews.map((review) => review.id)
        );
    },
    async (reviewIds: string[], { container }) => {
        const reviewModule = container.resolve<IReviewModuleService>(REVIEW_MODULE);

        await reviewModule.deleteReviews(reviewIds);
    }
);
