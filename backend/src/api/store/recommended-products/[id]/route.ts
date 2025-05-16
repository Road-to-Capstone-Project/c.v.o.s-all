import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { RemoteQueryFunction, StoreProductListResponse } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import { GetRecommendedProducListParamsType } from "../validators";

export const GET = async (
    req: MedusaRequest<GetRecommendedProducListParamsType>,
    res: MedusaResponse<{ recommended_product_ids: string[] }>
) => {
    const query = req.scope.resolve<RemoteQueryFunction>(
        ContainerRegistrationKeys.QUERY
    );
    const { limit } = req.validatedQuery;
    const { id } = req.params;
    const url = process.env.RECOMMENDATION_ENGINE_URL
    const response = await fetch(`${url}/p2p-recommend?product_id=${id}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
        throw new Error(`Failed to call training API because ${JSON.stringify(response.json())}`);
    }

    const products = (await response.json()).product_ids as string[]

    res.json({ recommended_product_ids: products });
}
