import { model } from "@medusajs/framework/utils";

export const RelatedProduct = model.define("related_product", {
    id: model.id({ prefix: "repr" }).primaryKey(),
    candidate_product_id: model.text(),
    query_product_id: model.text(),
    copurchase_frequency: model.number().default(1)
});