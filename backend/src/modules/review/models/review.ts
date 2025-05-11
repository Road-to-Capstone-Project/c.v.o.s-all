import { model } from "@medusajs/framework/utils";

export const Review = model.define("review", {
  id: model.id({ prefix: "rev" }).primaryKey(),
  variant_sku: model.text(),
  customer_name: model.text(),
  customer_id: model.text(),
  product_id: model.text(),
  title: model.text(),
  content: model.text(),
  rating: model.float().default(0),
});
