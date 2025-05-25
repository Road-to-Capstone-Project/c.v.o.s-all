/* Entity: Related Product */

export type ModuleRelatedProduct = {
    id: string;
    candidate_product_id: string,
    query_product_id: string,
    copurchase_frequency: number
};

export type ModuleCreateRelatedProduct = {
    candidate_product_id: string,
    query_product_id: string,
    copurchase_frequency: number
};

export type ModuleUpdateRelatedProduct = {
    id: string;
    copurchase_frequency?: number;
};