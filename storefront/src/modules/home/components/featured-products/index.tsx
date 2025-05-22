import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import ProductRail from "@modules/home/components/featured-products/product-rail"
import RecommendedProductRail from "./recommended-product-rail"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export default async function FeaturedProducts({
  countryCode,
}: {
  countryCode: string
}) {
  const customer = await retrieveCustomer()
  const customerOrderCount = customer ? (await listOrders()).filter((order) => order.fulfillment_status === "delivered").length : 0;
  const { collections } = await listCollections({
    limit: "3",
    fields: "*products",
  })
  const region = await getRegion(countryCode)

  if (!collections || !region) {
    return null
  }

  return (
    <ul className="flex flex-col gap-x-6 bg-neutral-100">
      {customer && customerOrderCount > 0 && <li key={"featured"}><RecommendedProductRail countryCode={countryCode} region={region} /></li>}
      {collections.map((collection) => (
        <li key={collection.id}>
          <ProductRail collection={collection} region={region} />
        </li>
      ))}
    </ul>
  )
}
