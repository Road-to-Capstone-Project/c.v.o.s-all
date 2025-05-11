import { createStep } from "@medusajs/framework/workflows-sdk";
import { REVIEW_MODULE } from "src/modules/review";

export const trainRecommendationModelsStep = createStep(
    "train-recommendation-models",
    async () => {
        const url = process.env.RECOMMENDATION_ENGINE_URL
        const response = await fetch(`${url}/train-recommendation-models`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
            throw new Error(`Failed to call training API because ${response.body}`);
        }
        return;
    }
);
