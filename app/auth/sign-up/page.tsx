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
import { Loader2, UserPlus } from 'lucide-react'
import { OctaVertexLoginFooter } from '@/components/brand/octavertex-brand'
import { APP_DISPLAY_NAME } from '@/lib/brand'

const authClient = createAuthClient()

export default function SignUpPage() {
    const router = useRouter()
    const { isAuthenticated, user } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            router.replace(user?.userKind === 'CLIENT' ? '/client' : '/')
        }
    }, [isAuthenticated, user?.userKind, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            const { error: upErr } = await authClient.signUp.email({
                email: email.trim().toLowerCase(),
                password,
                name: name.trim(),
            })
            if (upErr) {
                setError(upErr.message || 'Could not create account')
                return
            }
            router.replace('/')
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Sign up failed')
        } finally {
            setIsLoading(false)
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
                        <CardTitle className="text-2xl">Create account</CardTitle>
                        <CardDescription>
                            Join {APP_DISPLAY_NAME}. Your profile is created on first sign-in; admins can assign roles in
                            Team settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <p>
                            Already have an account?{' '}
                            <Link href="/auth/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
                                Sign in
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
