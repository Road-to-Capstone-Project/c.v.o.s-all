import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import OrderStatusBadge from "@modules/common/components/order-status-badge"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  const createdAt = new Date(order.created_at)

  return (
    <>
      <div className="flex justify-between items-center">
        <Heading level="h3">
          Details
        </Heading>
        <OrderStatusBadge order={order} />
      </div>

      <div className="text-sm text-ui-fg-subtle overflow-auto mt-2">
        <div className="flex justify-between">
          <Text>Order Number</Text>
          <Text>#{order.display_id}</Text>
        </div>

        <div className="flex justify-between mb-2">
          <Text>Order Date</Text>
          <Text>
            {" "}
            {createdAt.getDate()}-{createdAt.getMonth()}-
            {createdAt.getFullYear()}
          </Text>
        </div>

        <Text>
          We have sent the order confirmation details to{" "}
          <span className="font-semibold">{order.email}</span>.
        </Text>
      </div>
    </>
  )
}

export default OrderDetails
