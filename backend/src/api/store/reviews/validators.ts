import {
  createFindParams
} from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";


export type GetReviewParamsType = z.infer<typeof GetReviewParams>;
export const GetReviewParams = createFindParams({
  limit: 15,
  offset: 0,
}).merge(
  z
    .object({
      product_id: z.string().optional(),
    })
    .strict()
);

export type StoreCreateReviewType = z.infer<typeof StoreCreateReview>;
export const StoreCreateReview = z
  .object({
    variant_sku: z.string(),
    product_id: z.string(),
    title: z.string(),
    content: z.string(),
    rating: z.number().min(1).max(5),
  })
  .strict();