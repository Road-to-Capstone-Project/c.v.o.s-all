import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button, clx, Container, StatusBadge } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useMemo } from "react"
import CalendarIcon from "../../../common/icons/calendar"
import DocumentIcon from "../../../common/icons/document"
import OrderStatusBadge from "@modules/common/components/order-status-badge"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const orderStatusList = {
  "authorized-not_fulfilled": ['blue', 'Pending'],
  "captured": ['green', 'Payment captured'],
  "canceled": ['red', 'Canceled'],
  "delivered": ['purple', 'Delivered'],
  "shipped": ['orange', 'Shipping'],
}

const OrderCard = ({ order }: OrderCardProps) => {
  const createdAt = new Date(order.created_at)
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])
  const [orderStatusColor, orderStatus] = `${order.payment_status}-${order.fulfillment_status}` === 'authorized-not_fulfilled' ? orderStatusList['authorized-not_fulfilled'] : order.fulfillment_status === 'delivered' ? orderStatusList['delivered'] : order.payment_status === 'canceled' ? orderStatusList['canceled'] : order.fulfillment_status === 'shipped' ? orderStatusList['shipped'] : orderStatusList['captured']


  return (
    <>
      <Container className="bg-white flex small:flex-row flex-col p-4 rounded-md small:justify-between small:items-center gap-y-2 items-start">
        <div className="flex gap-x-4 items-center pl-3">
          <div className="flex">
            {order.items?.slice(0, 3).map((i, index) => {
              const numItems = order.items?.length ?? 0

              return (
                <div
                  key={i.id}
                  className={clx(
                    "block w-7 h-7 border border-white bg-neutral-100 p-2 bg-cover bg-center rounded-md ml-[-5px]",
                    {
                      "-rotate-3": index === 0 && numItems > 1,
                      "rotate-0": index === 0 && numItems === 1,
                      "rotate-3":
                        (index === 1 && numItems === 2) ||
                        (index === 2 && numItems > 2),
                    }
                  )}
                >
                  <Image
                    src={i.thumbnail!}
                    alt={i.title}
                    className={clx("h-full w-full object-cover object-center", {
                      "-rotate-3": index === 0 && numItems > 1,
                      "rotate-0": index === 0 && numItems === 1,
                      "rotate-3":
                        (index === 1 && numItems === 2) ||
                        (index === 2 && numItems > 2),
                    })}
                    draggable={false}
                    quality={50}
                    width={20}
                    height={20}
                  />
                </div>
              )
            })}
          </div>

          <div
            className="flex pr-2 text-small-regular items-center"
            data-testid="order-created-at"
          >
            <CalendarIcon className="inline-block mr-1" />
            {createdAt.getDate()}-{createdAt.getMonth()}-
            {createdAt.getFullYear()}
          </div>

          <div className="flex items-center text-small-regular">
            <DocumentIcon className="inline-block mr-1" />
            <span data-testid="order-display-id">#{order.display_id}</span>
          </div>
          <div className="flex items-center text-small-regular">
            {/* <StatusBadge className="flex flex-row" color={orderStatusColor}>{orderStatus}</StatusBadge> */}
            <OrderStatusBadge order={order} />
          </div>
        </div>

        <div className="flex gap-x-4 small:divide-x divide-gray-200 small:justify-normal justify-between w-full small:w-auto">
          <div className="flex items-center text-small-regular text-ui-fg-base">
            <span className="px-2" data-testid="order-amount">
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
              })}
            </span>
            {"·"}
            <span className="px-2">{`${numberOfLines} ${numberOfLines > 1 ? "items" : "item"
              }`}</span>
          </div>

          <div className="flex items-center gap-x-2 pl-4">
            {/* <Button
              data-testid="card-details-link"
              variant="secondary"
              className="rounded-full text-xs"
            >
              Export to PDF
            </Button> */}
            <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
              <Button
                data-testid="card-details-link"
                variant="secondary"
                className="rounded-full text-xs"
              >
                Details
              </Button>
            </LocalizedClientLink>
          </div>
        </div>
      </Container>
    </>
  )
}

export default OrderCard
