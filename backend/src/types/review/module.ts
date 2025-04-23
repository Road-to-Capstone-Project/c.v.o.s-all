/* Entity: Review */

export type ModuleReview = {
    id: string;
    variant_sku: string;
    title: string;
    content: string;
    rating: number;
    customer_name: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
};

export type ModuleCreateReview = {
    variant_sku: string;
    title: string;
    content: string;
    rating: number;
    customer_name: string;
};