import {
  createFindParams
} from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";


export type GetRecommendedProducListParamsType = z.infer<typeof GetRecommendedProducListParams>;
export const GetRecommendedProducListParams = createFindParams({
  offset: 0,
}).merge(
  z
    .object({
      recommendation_type: z.string().optional(),
    })
    .strict()
);;