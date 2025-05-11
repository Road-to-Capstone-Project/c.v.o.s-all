import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { trainRecommendationModelsStep } from "../steps/train-recommendation-models";

/*
  A workflow that triggers the training of recommendation models.
*/
export const trainRecommendationModelsWorkflow = createWorkflow(
  "train-recommendation-models-workflow",
  function (): WorkflowResponse<void> {
    trainRecommendationModelsStep();
    return new WorkflowResponse<void>(undefined);
  }
);