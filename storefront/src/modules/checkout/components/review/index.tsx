"use client"

import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PaymentButton from "../payment-button"
import { ExclamationCircle } from "@medusajs/icons"
import Button from "@modules/common/components/button"

const Review = ({
  cart,
  spendLimitExceeded,
}: {
  cart: any
  spendLimitExceeded: boolean
}) => {
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-start gap-x-1 w-full">
        <Text className="txt-xsmall text-neutral-500 mb-1">
          By Completing this order, I agree to C.V.O.S&apos;s{" "}
          <LocalizedClientLink
            href="/terms-of-sale"
            className="hover:text-neutral-800"
            target="_blank"
          >
            Terms of Sale ↗
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/privacy-policy"
            className="hover:text-neutral-800"
            target="_blank"
          >
            Privacy Policy ↗
          </LocalizedClientLink>
        </Text>
      </div>
      {spendLimitExceeded ? (
        <>
          <div className="flex items-center gap-x-2 bg-neutral-100 p-3 rounded-md shadow-borders-base">
            <ExclamationCircle className="text-orange-500 w-fit overflow-visible" />
            <p className="text-neutral-950 text-xs">
              This order exceeds your spending limit.
              <br />
              Please contact your manager for approval.
            </p>
          </div>
          <Button className="w-full h-10 rounded-full shadow-none" disabled>
            Place Order
          </Button>
        </>
      ) : (
        <PaymentButton cart={cart} data-testid="submit-order-button" />
      )}
    </div>
  )
}

export default Review
