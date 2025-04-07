"use client"
import { MouseEventHandler, useActionState, useEffect, useState } from "react"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import { Checkbox, Text } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login, transferCart } from "@lib/data/customer"
import Button from "@modules/common/components/button"
import { Google } from "@medusajs/icons"
import { sdk } from "@lib/config"
import { getCacheTag, revalidateCustomerCache, setAuthToken } from "@lib/data/cookies"


type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const [code, setCode] = useState<string | null>(null)
  const [state, setState] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    const state = urlParams.get("state")
    setCode(code)
    setState(state)
    if (code) {
      sdk.auth.callback(
        "customer",
        "custom-google",
        {
          code: code,
          state: state
        }
      ).then(async (token) => {
        setAuthToken(token as string)
        const cacheTag = await getCacheTag("customers")
        await revalidateCustomerCache(cacheTag)
        await transferCart()
      })
    }
  }, [])


  const loginWithGoogle = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/google`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }).then((res) => res.json())

      if (result.location) {
        // redirect to Google for authentication
        window.location.href = result.location
        return
      }

    } catch (error) {
      console.error("Error during login with Google:", error)
    }
  }

  return (
    <div
      className="max-w-sm w-full h-full flex flex-col justify-center gap-6 my-auto"
      data-testid="login-page"
    >
      <Text className="text-4xl text-neutral-950 text-left">
        Log in for faster
        <br />
        checkout.
      </Text>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
          <div className="flex flex-col gap-2 w-full border-b border-neutral-200 my-6" />
          <div className="flex items-center gap-2">
            <Checkbox name="remember_me" data-testid="remember-me-checkbox" />
            <Text className="text-neutral-950 text-base-regular">
              Remember me
            </Text>
          </div>
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <div className="flex flex-col gap-2">
          <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
            Log in
          </SubmitButton>
          <Button data-testid="sign-in-button" className="w-full" onClick={loginWithGoogle}>
            <Text className="text-neutral-950 text-base-regular">
              Log in with</Text>
            <Google className="w-4 h-4 mr-2" />
            <Text className="text-neutral-950 text-base-regular">
              Google</Text>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
            className="w-full h-10"
            data-testid="register-button"
          >
            Register
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Login
