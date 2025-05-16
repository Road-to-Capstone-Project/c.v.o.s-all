import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { Logger, RemoteQueryFunction } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { StoreReviewsResponse } from "@starter/types";
import { GetReviewParamsType, StoreCreateReviewType } from "./validators";
import { createReviewWorkflow } from "src/workflows/review/workflows";

export const GET = async (
  req: MedusaRequest<GetReviewParamsType>,
  res: MedusaResponse<StoreReviewsResponse>
) => {

  const query = req.scope.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  );

  const { product_id } = req.query;
  const { data: [product] } = await query.graph({
    entity: "product",
    fields: ["variants.sku"],
    filters: {
      id: product_id as string,
    },
  })
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${product_id} was not found`
    )
  }
  const variantSkus = product.variants.map(variant => variant.sku)

  const { data: reviews, metadata } = await query.graph({
    entity: "review",
    fields: ["*"],
    filters: {
      variant_sku: variantSkus as string[],
    },
    pagination: {
      ...req.remoteQueryConfig.pagination
    },
  });

  res.json({
    reviews,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });


};

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateReviewType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: [customer] } = await query.graph({
    entity: "customer",
    fields: ["first_name", "last_name", "id"],
    filters: {
      id: req.auth_context.actor_id as string,
    },
  })
  const { result: createdReview } = await createReviewWorkflow.run({
    input: { customer_name: `${customer.first_name} ${customer.last_name}`, customer_id: customer.id, ...req.validatedBody }, container: req.scope,
  });

  const {
    data: [review],
  } = await query.graph(
    {
      entity: "review",
      fields: ["*"],
      filters: { id: createdReview.id },
    },
    { throwIfKeyNotFound: true }
  );

  res.status(201).json({ review });

}

