"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2, ArrowLeft, MailCheck } from "lucide-react"

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate API call to send reset email
        setTimeout(() => {
            setIsLoading(false)
            setIsSubmitted(true)
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                <Card className="border-none shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto flex items-center gap-2 mb-6">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                                <span className="text-lg font-bold text-white">CK</span>
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                        <CardDescription>
                            {isSubmitted
                                ? "Check your email for a reset link"
                                : "Enter your email and we'll send you a link to reset your password"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {isSubmitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center space-y-4 py-6"
                            >
                                <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <MailCheck className="h-8 w-8" />
                                </div>
                                <p className="text-center text-sm text-muted-foreground">
                                    We have sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folders.
                                </p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        disabled={isLoading}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending link...
                                        </>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-center border-t p-6">
                        <Link
                            href="/login"
                            className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign in
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
