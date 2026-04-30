import { redirect } from 'next/navigation'

/** Legacy URL; Neon middleware skips `/auth/email-otp/*` but not this path. */
export default async function LegacyVerifyEmailRedirect({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  const base = '/auth/email-otp/verify-email'
  redirect(email ? `${base}?email=${encodeURIComponent(email)}` : base)
}
