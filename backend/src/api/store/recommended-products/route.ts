import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { RemoteQueryFunction, StoreProductListResponse } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { GetRecommendedProducListParamsType } from "./validators";

export const GET = async (
    req: AuthenticatedMedusaRequest<GetRecommendedProducListParamsType>,
    res: MedusaResponse<StoreProductListResponse>
) => {
    const query = req.scope.resolve<RemoteQueryFunction>(
        ContainerRegistrationKeys.QUERY
    );
    const { recommendation_type, limit } = req.validatedQuery;
    if (!recommendation_type) {
        throw new Error(`Recommendation type is required`);
    }
    else if (recommendation_type === 'c2p') {
        const { data: [customer] } = await query.graph({
            entity: "customer",
            fields: ["id"],
            filters: {
                id: req.auth_context.actor_id as string,
            },
        })
        const url = process.env.RECOMMENDATION_ENGINE_URL
        const response = await fetch(`${url}/c2p-recommend?customer_id=${customer.id}?limit=${limit}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) {
            throw new Error(`Failed to call training API because ${response.body}`);
        }
        const { data: products, metadata } = await query.graph({
            entity: "product",
            fields: ["*"],
            filters: {
                id: (await response.json()).product_ids as string[],
            },
            pagination: {
                ...req.remoteQueryConfig.pagination
            },
        });


        res.json({
            products,
            count: metadata!.count,
            offset: metadata!.skip,
            limit: metadata!.take,
        });
    }

}