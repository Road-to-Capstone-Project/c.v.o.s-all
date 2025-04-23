/* Entity: Review */

export type ModuleReview = {
    id: string;
    variant_sku: string;
    customer_name: string;
    title: string;
    content: string;
    rating: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};