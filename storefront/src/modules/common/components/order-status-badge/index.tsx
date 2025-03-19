import { HttpTypes } from "@medusajs/types"
import { StatusBadge } from "@medusajs/ui"

const orderStatusList = {
    "authorized-not_fulfilled": ['blue', 'Pending'],
    "captured": ['green', 'Payment captured'],
    "canceled": ['red', 'Canceled'],
    "delivered": ['purple', 'Delivered'],
    "shipped": ['orange', 'Shipping'],
}

const OrderStatusBadge = ({ order }: { order: HttpTypes.StoreOrder }) => {
    const [orderStatusColor, orderStatus] = `${order.payment_status}-${order.fulfillment_status}` === 'authorized-not_fulfilled' ? orderStatusList['authorized-not_fulfilled'] : order.fulfillment_status === 'delivered' ? orderStatusList['delivered'] : order.payment_status === 'canceled' ? orderStatusList['canceled'] : order.fulfillment_status === 'shipped' ? orderStatusList['shipped'] : orderStatusList['captured']

    return (
        <>
            <StatusBadge className="flex flex-row" color={orderStatusColor}>{orderStatus}</StatusBadge>
        </>
    )
}

export default OrderStatusBadge
