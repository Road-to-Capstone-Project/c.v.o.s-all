/* Filters */

import { FindParams, PaginatedResponse } from "@medusajs/types";
import { ModuleReviewFilters } from "./service";
import { QueryReview } from "./query";

export interface ReviewFilterParams extends FindParams, ModuleReviewFilters { }

export type StoreReviewsResponse = PaginatedResponse<{
    reviews: QueryReview[];
}>;

export type StoreReviewResponse = {
    review: QueryReview;
};

export type StoreCreateReview = {
    title: string;
    product_id: string;
    content?: string | null;
    variant_sku: string;
    rating: number;
};