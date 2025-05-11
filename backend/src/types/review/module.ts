/* Entity: Review */

export type ModuleReview = {
    id: string;
    variant_sku: string;
    title: string;
    content: string;
    rating: number;
    customer_name: string;
    product_id: string;
    customer_id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
};

export type ModuleCreateReview = {
    variant_sku: string;
    product_id: string;
    title: string;
    content: string;
    rating: number;
    customer_name: string;
    customer_id: string;
};