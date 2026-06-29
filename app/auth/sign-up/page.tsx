'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createAuthClient } from '@neondatabase/auth/next'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, UserPlus } from 'lucide-react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { OctaVertexLoginFooter } from '@/components/brand/octavertex-brand'
import { APP_DISPLAY_NAME } from '@/lib/brand'

const authClient = createAuthClient()

const allowPublicSignup = process.env.NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP === 'true'

export default function SignUpPage() {
    const router = useRouter()
    const { isAuthenticated, user } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<'register' | 'verify'>('register')
    const [verifyEmail, setVerifyEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [isResending, setIsResending] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)

    useEffect(() => {
        if (isAuthenticated) {
            router.replace(user?.userKind === 'CLIENT' ? '/client' : '/')
        }
    }, [isAuthenticated, user?.userKind, router])

    useEffect(() => {
        if (resendCooldown <= 0) return
        const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
        return () => clearInterval(t)
    }, [resendCooldown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            const { error: upErr, data } = await authClient.signUp.email({
                email: email.trim().toLowerCase(),
                password,
                name: name.trim(),
            })
            if (upErr) {
                setError(upErr.message || 'Could not create account')
                return
            }
            const signedUpUser = data?.user
            if (signedUpUser && !signedUpUser.emailVerified) {
                setVerifyEmail(signedUpUser.email)
                setStep('verify')
                setOtp('')
                return
            }
            await fetch('/api/auth/session', { credentials: 'include' })
            router.replace('/')
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Sign up failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        const code = otp.replace(/\s/g, '')
        if (code.length < 4) {
            setError('Enter the verification code from your email.')
            return
        }
        setIsLoading(true)
        try {
            const { error: verErr } = await authClient.emailOtp.verifyEmail({
                email: verifyEmail,
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

    const handleResendOtp = async () => {
        setError('')
        setIsResending(true)
        try {
            const { error: sendErr } = await authClient.emailOtp.sendVerificationOtp({
                email: verifyEmail,
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
                        <CardTitle className="text-2xl">
                            {step === 'register' ? 'Create account' : 'Check your email'}
                        </CardTitle>
                        <CardDescription>
                            {step === 'register' ? (
                                <>
                                    Join {APP_DISPLAY_NAME}. Your profile is created on first sign-in; admins can assign
                                    roles in Team settings.
                                </>
                            ) : (
                                <>Enter the verification code we sent you to finish creating your account.</>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!allowPublicSignup ? (
                            <div className="space-y-4 text-center py-4">
                                <p className="text-sm text-muted-foreground">
                                    Public registration is disabled. Contact your workspace admin for an invite.
                                </p>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/auth/sign-in">Back to sign in</Link>
                                </Button>
                            </div>
                        ) : step === 'register' ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                </div>
                                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating…
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Sign up
                                        </>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    We sent a code to <span className="font-medium text-foreground">{verifyEmail}</span>.
                                    Enter it below to verify your account.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-otp">Verification code</Label>
                                    <InputOTP
                                        id="signup-otp"
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
                                <div className="text-center text-sm text-muted-foreground">
                                    <button
                                        type="button"
                                        className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                                        onClick={() => void handleResendOtp()}
                                        disabled={isResending || resendCooldown > 0}
                                    >
                                        {isResending
                                            ? 'Sending…'
                                            : resendCooldown > 0
                                              ? `Resend code (${resendCooldown}s)`
                                              : 'Resend code'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <p>
                            Already have an account?{' '}
                            <Link href="/auth/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
                                Sign in
                            </Link>
                        </p>
                        {step === 'register' ? (
                            <p>
                                Already have a verification code?{' '}
                                <Link
                                    href="/auth/email-otp/verify-email"
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    Enter code
                                </Link>
                            </p>
                        ) : (
                            <p>
                                <button
                                    type="button"
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                    onClick={() => {
                                        setStep('register')
                                        setError('')
                                        setOtp('')
                                    }}
                                >
                                    Back to sign-up form
                                </button>
                            </p>
                        )}
                        {step === 'register' ? (
                            <p className="text-center text-xs leading-relaxed sm:text-left">
                                By signing up, you agree to our{' '}
                                <Link href="/legal/terms" className="font-medium text-primary underline-offset-4 hover:underline">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link href="/legal/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                                    Privacy Policy
                                </Link>
                                .
                            </p>
                        ) : null}
                    </CardFooter>
                </Card>
            </div>
            <div className="relative z-10">
                <OctaVertexLoginFooter />
            </div>
        </div>
    )
}
