import { model } from "@medusajs/framework/utils";

export const Review = model.define("review", {
  id: model.id({ prefix: "rev" }).primaryKey(),
  variant_sku: model.text(),
  customer_name: model.text(),
  title: model.text(),
  content: model.text(),
  rating: model.number().default(0),
});
