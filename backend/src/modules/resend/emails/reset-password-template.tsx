import { Button, Link, Section, Text, Img, Hr } from '@react-email/components'
import { Base } from './base'

/**
 * The key for the ResetPasswordTemplate, used to identify it
 */
export const RESET_PASSWORD_TEMPLATE = 'reset-password-template'

/**
 * The props for the ResetPasswordTemplate template
 */
export interface ResetPasswordTemplateProps {
    /**
     * The link that the user can click to accept the invitation
     */
    resetLink: string
    /**
     * The preview text for the email, appears next to the subject
     * in mail providers like Gmail
     */
    preview?: string
}

/**
 * Type guard for checking if the data is of type ResetPasswordTemplateProps
 * @param data - The data to check
 */
export const isResetPasswordData = (data: any): data is ResetPasswordTemplateProps =>
    typeof data.resetLink === 'string' && (typeof data.preview === 'string' || !data.preview)

/**
 * The ResetPasswordTemplate template component built with react-email
 */
export const ResetPasswordTemplate = ({
    resetLink,
    preview = `Your password change request have been approved!`,
}: ResetPasswordTemplateProps) => {
    return (
        <Base preview={preview}>
            <Section className="text-center">
                <Text className="text-black text-[14px] leading-[24px]">
                    Please follow our instructions below to change your password.
                </Text>
                <Section className="mt-4 mb-[32px]">
                    <Button
                        className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline px-5 py-3"
                        href={resetLink}
                    >
                        Change your password
                    </Button>
                </Section>
                <Text className="text-black text-[14px] leading-[24px]">
                    or copy and paste this URL into your browser:
                </Text>
                <Text style={{
                    maxWidth: '100%',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word'
                }}>
                    <Link
                        href={resetLink}
                        className="text-blue-600 no-underline"
                    >
                        {resetLink}
                    </Link>
                </Text>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
                If you were not expecting this password change email, you can ignore this email, as the
                reset link will expire in 24 hours. If you are concerned about your account's safety,
                please reply to this email to get in touch with us.
            </Text>
        </Base>
    )
}

ResetPasswordTemplate.PreviewProps = {
    resetLink: 'https://mywebsite.com/app/resetPassword?token=abc123ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
} as ResetPasswordTemplateProps

export default ResetPasswordTemplate
