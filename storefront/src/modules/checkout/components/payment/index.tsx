"use client"
import { RadioGroup } from "@headlessui/react"
import { paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { Cash, CheckCircleSolid, CreditCard, GlobeEuropeSolid } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"
import Button from "@modules/common/components/button"
import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { StripePaymentElementChangeEvent } from "@stripe/stripe-js"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripeComplete, setStripeComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const availableInternalPaymentMethods = ["cod", "stripe"]
  const [selectedIntenalPaymentMethod, setSelectedInternalPaymentMethod] = useState<string>(activeSession?.provider_id === 'pp_stripe_stripe' ? availableInternalPaymentMethods[1] : availableInternalPaymentMethods[0])

  const isOpen = searchParams.get("step") === "payment"

  const stripeReady = useContext(StripeContext)
  const stripe = stripeReady ? useStripe() : null
  const elements = stripeReady ? useElements() : null
  const paidByGiftcard = cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#424270",
          "::placeholder": {
            color: "rgb(107 114 128)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover transition-all duration-300 ease-in-out",
      },
    }
  }, [])

  const initStripe = async () => {
    try {
      await initiatePaymentSession(cart, {
        provider_id: "pp_stripe_stripe",
      })
    } catch (err) {
      console.error("Failed to initialize Stripe session:", err)
      setError("Failed to initialize payment. Please try again.")
    }
  }

  const initDefaultPayment = async () => {
    try {
      await initiatePaymentSession(cart, {
        provider_id: "pp_system_default"
      })
    } catch (err) {
      console.error("Failed to initialize Default session:", err)
      setError("Failed to initialize payment. Please try again.")
    }
  }

  useEffect(() => {
    if (!activeSession || (isOpen && selectedIntenalPaymentMethod === "cod")) {
      initDefaultPayment()
    }
  }, [cart, isOpen, activeSession])

  const handlePaymentMethodChange = async (value: any) => {
    if (value === "cod") {
      initDefaultPayment()
    }
    else if (value === "stripe") {
      initStripe()
    }
    setSelectedInternalPaymentMethod(value)
  }

  const handlePaymentElementChange = async (
    event: StripePaymentElementChangeEvent
  ) => {
    // Catches the selected payment method and sets it to state
    if (event.value.type) {
      setSelectedPaymentMethod(event.value.type)
    }

    // Sets stripeComplete on form completion
    setStripeComplete(event.complete)

    // Clears any errors on successful completion
    if (event.complete) {
      setError(null)
    }
  }

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (selectedIntenalPaymentMethod === "stripe") {
        // Check if the necessary context is ready
        if (!stripe || !elements) {
          setError("Payment processing not ready. Please try again.")
          return
        }

        // Submit the payment method details
        await elements.submit().catch((err) => {
          console.error(err)
          setError(err.message || "An error occurred with the payment")
          return
        })
      }


      // Navigate to the final checkout step
      router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <Container>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-row items-center justify-between w-full">
          <Heading
            level="h2"
            className={clx("flex flex-row text-xl gap-x-2 items-center", {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            })}
          >
            Payment Method
            {!isOpen && paymentReady && <CheckCircleSolid />}
          </Heading>
          {!isOpen && paymentReady && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-payment-button"
              >
                Edit
              </button>
            </Text>
          )}
        </div>
        {(isOpen || (cart && paymentReady && activeSession)) && <Divider />}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard &&
            availablePaymentMethods?.length &&
            (
              <>
                <RadioGroup value={selectedIntenalPaymentMethod} onChange={handlePaymentMethodChange}>
                  {availableInternalPaymentMethods?.map((option) => {
                    return (
                      <>
                        <RadioGroup.Option
                          key={option}
                          value={option}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "flex items-center justify-between text-small-regular cursor-pointer py-2",
                            {
                              "border-ui-border-interactive":
                                option === selectedPaymentMethod,
                            }
                          )}
                        >
                          <div className="flex flex-row items-center gap-x-1">
                            <Radio
                              checked={option === selectedIntenalPaymentMethod}
                            />
                            {option === "cod" ? <Cash /> : <GlobeEuropeSolid />}
                            <span className="text-base-regular">{option === "cod" ? "Cash On Delivery" : "Online Payment"}</span>
                          </div>
                        </RadioGroup.Option>
                        <Divider />
                      </>
                    )
                  })}
                </RadioGroup>
                {selectedIntenalPaymentMethod === "stripe" && stripeReady ? (<div className="mt-5 transition-all duration-150 ease-in-out">
                  <PaymentElement
                    onChange={handlePaymentElementChange}
                    options={{
                      layout: { type: "accordion", radios: true },
                    }}
                  />
                </div>) : null}
              </>
            )}
          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <div className="flex flex-col gap-y-2 items-end">
            <ErrorMessage
              error={error}
              data-testid="payment-method-error-message"
            />

            <Button
              size="large"
              className="mt-6"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={
                selectedIntenalPaymentMethod !== "cod" &&
                (!stripeComplete ||
                  !stripe ||
                  !elements ||
                  (!selectedPaymentMethod && !paidByGiftcard))
              }
              data-testid="submit-payment-button"
            >
              Next step
            </Button>
          </div>
        </div>
        <div className={isOpen ? "hidden" : "block"}>
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-row w-1/3 gap-1 justify-start items-center">
              {paymentInfoMap[activeSession?.provider_id]?.icon}
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                {paymentInfoMap[activeSession?.provider_id]?.title}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default Payment
