export const reviewFields = [
  "id",
  "content",
  "variant_sku",
  "customer_name",
  "title",
  "rating",
  "created_at",
  "updated_at",
  "deleted_at",
];

export const listReviewsTransformQueryConfig = {
  defaults: reviewFields,
  isList: true,
};
