import { MiddlewareRoute } from "@medusajs/medusa";
import { storeCartsMiddlewares } from "./carts/middlewares";
import { storeCompaniesMiddlewares } from "./companies/middlewares";
import { storeFreeShippingMiddlewares } from "./free-shipping/middlewares";
import { storeQuotesMiddlewares } from "./quotes/middlewares";
import { storeReviewsMiddlewares } from "./reviews/middlewares";
import { storeRecommendedProducListMiddlewares } from "./recommended-products/middlewares";

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeReviewsMiddlewares,
  ...storeRecommendedProducListMiddlewares,
  ...storeCartsMiddlewares,
  ...storeCompaniesMiddlewares,
  ...storeQuotesMiddlewares,
  ...storeFreeShippingMiddlewares,
];
