import { sdk } from "@lib/config"
import {
    ReviewFilterParams,
    StoreReviewsResponse,
    StoreCreateReview,
    StoreReviewResponse,
} from "@starter/types"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "@lib/data/cookies"
import { revalidateTag } from "next/cache"

export const listReviewsWithSort = async (query?: ReviewFilterParams) => {
    const headers = {
        ...(await getAuthHeaders()),
    }

    const next = {
        ...(await getCacheOptions("reviews")),
    }

    return sdk.client.fetch<StoreReviewsResponse>(
        `/store/reviews?order=-updated_at`,
        {
            method: "GET",
            query,
            headers,
            next,
        }
    )
}

export const createReview = async (_currentState: unknown, formData: FormData) => {
    const headers = {
        ...(await getAuthHeaders()),
    }
    let networkMessage
    const data: StoreCreateReview = {
        variant_sku: formData.get("variant_sku") as string,
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        rating: Number(formData.get("rating")),
    }
    try {
        const { review } = await sdk.client.fetch<StoreReviewResponse>(
            `/store/reviews`,
            {
                method: "POST",
                body: data,
                headers,
            }
        )
        const cacheTag = await getCacheTag("reviews")
        revalidateTag(cacheTag)
        networkMessage = "ok"
    }
    catch (error: any) {
        networkMessage = error.toString()
    }
    return networkMessage

}