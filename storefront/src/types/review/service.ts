import { BaseFilterable } from "@medusajs/types";

export interface ModuleReviewFilters extends BaseFilterable<ModuleReviewFilters> {
    product_id: string;
}