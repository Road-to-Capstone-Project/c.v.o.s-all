import {
  authenticate,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { GetRecommendedProducListParams } from "./validators";
import { listRecommendedProductsTransformQueryConfig } from "./query-config";


export const storeRecommendedProducListMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/recommended-products",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(GetRecommendedProducListParams, listRecommendedProductsTransformQueryConfig),
    ],
  },
];
