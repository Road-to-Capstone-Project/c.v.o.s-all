import { placeOrder, retrieveCart } from "@lib/data/cart"
import { NextRequest, NextResponse } from "next/server"

type Params = Promise<{ cartId: string }>

export async function GET(req: NextRequest, { params }: { params: Params }) {
    const { cartId } = await params
    const { origin, searchParams } = req.nextUrl

    const paymentIntent = searchParams.get("payment_intent")
    const paymentIntentClientSecret = searchParams.get(
        "payment_intent_client_secret"
    )
    const redirectStatus = searchParams.get("redirect_status") || ""
    const countryCode = searchParams.get("country_code")

    const cart = await retrieveCart(cartId)

    if (!cart) {
        return NextResponse.redirect(`${origin}/${countryCode}`)
    }

    const paymentSession = cart.payment_collection?.payment_sessions?.find(
        (payment) => payment.data.id === paymentIntent
    )

    if (
        !paymentSession ||
        paymentSession.data.client_secret !== paymentIntentClientSecret ||
        !["pending", "succeeded"].includes(redirectStatus) ||
        !["pending", "authorized"].includes(paymentSession.status)
    ) {
        return NextResponse.redirect(
            `${origin}/${countryCode}/cart?step=review&error=payment_failed`
        )
    }

    const order = await placeOrder(cartId)

    if (!order) {
        return NextResponse.redirect(
            `${origin}/${countryCode}/cart?step=review&error=order_failed`
        )
    }

    return NextResponse.redirect(
        `${origin}/${countryCode}/order/${order.id}/confirmed`
    )
}