import { listRecommendedProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import ProductPreview from "@modules/products/components/product-preview"

export default async function RecommendedProductRail({
    countryCode,
    region,
}: {
    countryCode: string,
    region: HttpTypes.StoreRegion
}) {
    if (!region) {
        return null
    }

    const queryParams: HttpTypes.StoreProductParams & {
        tags?: string[]
    } = {
        fields: "*variants,*variants.calculated_price,*variants.inventory_quantity"
    }
    if (region?.id) {
        queryParams.region_id = region.id
    }
    queryParams.is_giftcard = false
    queryParams.limit = 4

    const products = await listRecommendedProducts({
        queryParams,
        countryCode,
    }).then(({ response }) => {
        return response.products
    })




    return (
        <div className="content-container py-12 small:py-24 bg-neutral-100">
            <div className="flex justify-between mb-8">
                <Text className="text-base">Featured</Text>
            </div>
            <ul className="grid grid-cols-1 small:grid-cols-4 gap-x-3 gap-y-3 small:gap-y-36">
                {products &&
                    products.map((product) => (
                        <li key={product.id}>
                            <ProductPreview product={product} region={region} isFeatured />
                        </li>
                    ))}
            </ul>
        </div>
    )
}
