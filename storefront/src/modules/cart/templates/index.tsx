"use client"

import { useCart } from "@lib/context/cart-context"
import { checkSpendingLimit } from "@lib/util/check-spending-limit"
import { Heading } from "@medusajs/ui"
import { useMemo } from "react"
import { B2BCustomer } from "types/global"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import ItemsTemplate from "./items"
import Summary from "./summary"

const CartTemplate = ({ customer }: { customer: B2BCustomer | null }) => {
  const { cart } = useCart()

  // const spendLimitExceeded = useMemo(
  //   () => checkSpendingLimit(cart, customer),
  //   [cart, customer]
  // )
  const spendLimitExceeded = false

  const totalItems = useMemo(
    () => cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0,
    [cart?.items]
  )

  return (
    <div className="small:py-12 py-6 bg-neutral-100">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div>
            <div className="flex flex-col py-6 gap-y-6">
              <div className="pb-3 flex items-center">
                <Heading className="text-neutral-950">
                  You have {totalItems} items in your cart
                </Heading>
              </div>
              <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-2">
                <div className="flex flex-col gap-y-2">
                  {!customer && <SignInPrompt />}
                  <ItemsTemplate cart={cart} />
                </div>
                <div className="relative">
                  <div className="flex flex-col gap-y-8 sticky top-20">
                    {cart && cart.region && (
                      <Summary
                        customer={customer}
                        spendLimitExceeded={spendLimitExceeded}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
