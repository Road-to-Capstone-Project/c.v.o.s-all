"use client"

import { signup } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { Checkbox, Label } from "@medusajs/ui"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState, useState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  regions: HttpTypes.StoreRegion[]
}

const Register = ({ setCurrentView, regions }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const countryNames = regions
    .map((region) =>
      region.countries?.map((country) => country?.display_name || country?.name)
    )
    .flat()
    .filter((country) => country !== undefined)

  const currencies = regions.map((region) => region.currency_code)

  return (
    <div
      className="max-w-sm flex flex-col items-start gap-2 my-8"
      data-testid="register-page"
    >
      <div className="text-4xl text-neutral-950 text-left mb-4">
        Create your
        <br />
        personal account.
      </div>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-4">
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
            className="bg-white"
          />
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
            className="bg-white"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
            className="bg-white"
          />
          <Input
            label="Password"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
            className="bg-white"
          />
        </div>
        <div className="border-b border-neutral-200 my-6" />
        <ErrorMessage error={message} data-testid="register-error" />
        <div className="flex items-center gap-2">
          <Checkbox
            name="terms"
            id="terms-checkbox"
            data-testid="terms-checkbox"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(!!checked)}
          ></Checkbox>
          <Label
            id="terms-label"
            className="flex items-center text-ui-fg-base !text-xs hover:cursor-pointer !transform-none"
            htmlFor="terms-checkbox"
            data-testid="terms-label"
          >
            I agree to the terms and conditions.
          </Label>
        </div>
        <SubmitButton
          className="w-full mt-6"
          data-testid="register-button"
          disabled={!termsAccepted}
        >
          Register
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.LOG_IN)}
          className="underline"
        >
          Log in
        </button>
        .
      </span>
    </div>
  )
}

export default Register
