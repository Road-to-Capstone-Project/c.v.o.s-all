import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import {
  GetReviewParams,
  StoreCreateReview,
} from "./validators";
import { listReviewsTransformQueryConfig } from "./query-config";


export const storeReviewsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["DELETE", "POST", "PATCH", "PUT", "OPTIONS"],
    matcher: "/store/reviews*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/reviews",
    middlewares: [
      validateAndTransformQuery(GetReviewParams, listReviewsTransformQueryConfig),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/reviews",
    middlewares: [
      validateAndTransformBody(StoreCreateReview),
    ],
  },
];
