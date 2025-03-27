"use client"

import { getCacheTag, setAuthToken } from "@lib/data/cookies"
import { transferCart } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { track } from "@vercel/analytics/server"
import { useSession } from "next-auth/react"
import { revalidateTag } from "next/cache"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { decodeToken } from "react-jwt"

export default function GoogleCallback() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer>()
  const [code, setCode] = useState<string | null>(null)
  const [state, setState] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    const state = urlParams.get("state")
    setCode(code)
    setState(state)
  }, [])

  // Send the code to your backend to get the token
  const sendCallback = async () => {
    const { token } = await fetch(
      `http://localhost:9000/auth/customer/google/callback?code=${code}&state=${state}`,
      {
        credentials: "include",
        method: "POST",
      }
    ).then((res) => res.json())

    if (!token) {
      alert("Authentication Failed")
      return
    }

    return token
  }

  const splitName = (name?: string) => {
    if (!name) {
      return { first_name: "", last_name: "" } // or handle it another way
    }

    const names = name.split(" ")
    return {
      first_name: names[0] || "",
      last_name: names.slice(1).join(" ") || "",
    }
  }

  // Create a new customer
  const createCustomer = async (
    token: string,
    email: string,
    first_name: string,
    last_name: string
  ) => {
    await fetch(`http://localhost:9000/store/customers`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-publishable-api-key":
          "pk_77effd0f2574e95bd7ee5ef8c420569d428130e533a8b112e7734611dfd777ef",
      },
      body: JSON.stringify({
        email: email,
        first_name: first_name,
        last_name: last_name,
      }),
    }).then((res) => res.json())
  }

  // Refresh token if necessary
  const refreshToken = async (token: string) => {
    const result = await fetch(`http://localhost:9000/auth/token/refresh`, {
      credentials: "include",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json())

    return result.token
  }

  // Validate the callback and handle customer creation or token refresh
  const validateCallback = async () => {
    let token = await sendCallback()

    if (!token) {
      return
    }

    const shouldCreateCustomer =
      (decodeToken(token) as { actor_id: string }).actor_id === ""

    if (shouldCreateCustomer) {
      const { first_name, last_name } = splitName(session?.user?.name as string)
      await createCustomer(
        token,
        session?.user?.email as string,
        first_name,
        last_name
      )

      token = await refreshToken(token)
    }
    setAuthToken(token as string)

    await transferCart()

    // Use token to send authenticated requests
    // const { customer: customerData } = await fetch(
    //   `http://localhost:9000/store/customers/me`,
    //   {
    //     credentials: "include",
    //     method: "GET",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${token}`,
    //       "x-publishable-api-key":
    //         "pk_c0a85c0e1426da5892cffc0fb9c9758f1d04af162b198c8e5425842896925470",
    //     },
    //   }
    // ).then((res) => res.json())

    // setCustomer(customerData)
    setLoading(false)
    // console.log("Customer data:", customerData)
    router.push("/account")
  }

  useEffect(() => {
    if (!loading || !code || !state || !session) {
      return
    }
    validateCallback()
  }, [loading, code, state, session])
}
