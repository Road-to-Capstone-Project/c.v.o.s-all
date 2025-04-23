import {
    Context,
    IModuleService,
} from "@medusajs/types";
import {
    ModuleCreateReview,
    ModuleReview,
} from "./module";

/**
 * The main service interface for the Review Module.
 */
export interface IReviewModuleService extends IModuleService {

    createReviews(
        data: ModuleCreateReview,
        sharedContext?: Context
    ): Promise<ModuleReview>;

    createReviews(
        data: ModuleCreateReview[],
        sharedContext?: Context
    ): Promise<ModuleReview[]>;

    deleteReviews(ids: string[], sharedContext?: Context): Promise<void>;
}
