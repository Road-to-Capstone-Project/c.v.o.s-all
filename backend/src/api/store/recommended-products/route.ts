import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { RemoteQueryFunction, StoreProductListResponse } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import { GetRecommendedProducListParamsType } from "./validators";


export const GET = async (
    req: AuthenticatedMedusaRequest<GetRecommendedProducListParamsType>,
    res: MedusaResponse<{ recommended_product_ids: string[] }>
) => {
    const query = req.scope.resolve<RemoteQueryFunction>(
        ContainerRegistrationKeys.QUERY
    );
    const { limit } = req.validatedQuery;
    const { data: [customer] } = await query.graph({
        entity: "customer",
        fields: ["id"],
        filters: {
            id: req.auth_context.actor_id as string,
        },
    })
    const url = process.env.RECOMMENDATION_ENGINE_URL
    const response = await fetch(`${url}/c2p-recommend?customer_id=${customer.id}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
        throw new Error(`Failed to call training API because ${JSON.stringify(response.json())}`);
    }
    const products = (await response.json()).product_ids as string[]


    res.json({ recommended_product_ids: products });
}
