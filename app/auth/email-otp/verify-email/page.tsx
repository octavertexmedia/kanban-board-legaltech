'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createAuthClient } from '@neondatabase/auth/next'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Loader2, Mail } from 'lucide-react'
import { OctaVertexLoginFooter } from '@/components/brand/octavertex-brand'
import { APP_DISPLAY_NAME } from '@/lib/brand'

const authClient = createAuthClient()

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    const q = searchParams.get('email')?.trim().toLowerCase()
    if (q) setEmail(q)
  }, [searchParams])

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated) {
      router.replace(user?.userKind === 'CLIENT' ? '/client' : '/')
    }
  }, [authLoading, isAuthenticated, user?.userKind, router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim().toLowerCase()
    const code = otp.replace(/\s/g, '')
    if (!trimmed) {
      setError('Enter your email address.')
      return
    }
    if (code.length < 4) {
      setError('Enter the verification code from your email.')
      return
    }
    setIsLoading(true)
    try {
      const { error: verErr } = await authClient.emailOtp.verifyEmail({
        email: trimmed,
        otp: code,
      })
      if (verErr) {
        setError(verErr.message || 'Invalid or expired code.')
        return
      }
      await fetch('/api/auth/session', { credentials: 'include' })
      router.replace('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Enter your email address first.')
      return
    }
    setError('')
    setIsResending(true)
    try {
      const { error: sendErr } = await authClient.emailOtp.sendVerificationOtp({
        email: trimmed,
        type: 'email-verification',
      })
      if (sendErr) {
        setError(sendErr.message || 'Could not resend code.')
        return
      }
      setResendCooldown(60)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resend code.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-[120px] dark:bg-primary/25" />
        <div className="absolute bottom-[-20%] left-[-15%] h-[28rem] w-[28rem] rounded-full bg-red-950/40 blur-[100px] dark:bg-red-950/50" />
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              Enter the code we sent you for {APP_DISPLAY_NAME}. Codes expire after a few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-email">Email</Label>
                <Input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <InputOTP
                  id="otp"
                  maxLength={8}
                  value={otp}
                  onChange={(v) => setOtp(v)}
                  containerClassName="justify-center sm:justify-start"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Verify and continue
                  </>
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                onClick={() => void handleResend()}
                disabled={isResending || resendCooldown > 0}
              >
                {isResending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend code (${resendCooldown}s)`
                    : 'Resend code'}
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              <Link href="/auth/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <div className="relative z-10">
        <OctaVertexLoginFooter />
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  )
}
