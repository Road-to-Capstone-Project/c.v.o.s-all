"use client"

import { changePassword, requestPasswordChange } from "@lib/data/customer"
import { clx, Container, Text, toast } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Button from "@modules/common/components/button"
import Input from "@modules/common/components/input"
import { useSearchParams } from "next/navigation"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { B2BCustomer } from "types/global"

// TODO: 
const SecurityCard = ({ customer }: { customer: B2BCustomer }) => {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams?.get("token"))
  const [email, setEmail] = useState(searchParams?.get("email"))
  const [message, formAction, isPending] = useActionState(handleChangePassword, null)
  const { pending } = useFormStatus()


  function handleRequestPasswordChange(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault()
    requestPasswordChange(customer.email).then((res) => {
      toast.success("Password change requested. Please check your email to get the reset link.")
    }
    ).catch((err) => {
      toast.error("Error requesting password change. Please try again.")
    }
    )
  }

  async function handleChangePassword(_currentState: unknown, formData: FormData): Promise<any> {
    const newPassword = formData.get("new_password") as string
    const newPasswordAgain = formData.get("password_again") as string
    if (newPassword !== newPasswordAgain) {
      toast.error("Passwords do not match.")
      return 'Passwords do not match.'
    }
    changePassword(newPassword, token as string)
      .then((res) => {
        toast.success("Password changed.")
      }
      ).catch((err) => {
        toast.error("Error changing password. Please try again.")
      }
      )
    setToken(null)
    setEmail(null)
  }

  return (
    <div className="h-fit">
      <Container className="p-0 overflow-hidden">
        <form
          className={clx(
            "grid grid-rows-2 gap-4 border-b border-neutral-200 overflow-hidden transition-all duration-300 ease-in-out",
            {
              "max-h-[244px] opacity-100 p-4": token && email,
              "max-h-0 opacity-0": !token || !email,
            }
          )}
          action={formAction}
        >
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">New Password</Text>
            <Input
              label="Your new password"
              name="new_password"
              type="password"
              required
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">New Password Again</Text>
            <Input
              name="password_again"
              type="password"
              required
              label="Your new password again" />
          </div>
          <div className="flex items-center justify-end gap-2 bg-neutral-50 p-4">
            <Button
              variant="secondary"
              onClick={() => { setToken(null); setEmail(null) }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton
              className="py-[6px] text-sm font-normal"
              disabled={isPending}
            >
              Save
            </SubmitButton>
          </div>
        </form>
        <div className={
          clx("grid grid-cols-2 gap-4 border-b border-neutral-200", {
            "max-h-[244px] opacity-100 p-4": !token || !email,
            "max-h-0 opacity-0": token && email,
          })
        }>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Password</Text>
            <Text className=" text-neutral-500">***************</Text>
          </div>
          <div className="flex items-center justify-end gap-2 p-4">
            <Button variant="secondary" onClick={handleRequestPasswordChange}>
              Request Password Change
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default SecurityCard
