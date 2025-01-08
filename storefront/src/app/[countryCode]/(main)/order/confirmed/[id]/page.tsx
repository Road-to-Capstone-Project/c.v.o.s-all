import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { B2BOrder } from "types/global"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = (await retrieveOrder(params.id).catch(() => null)) as B2BOrder

  if (!order) {
    return notFound()
  }

  return <OrderCompletedTemplate order={order} />
}