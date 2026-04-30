"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { OctaVertexLoginFooter } from "@/components/brand/octavertex-brand"
import { APP_DISPLAY_NAME, OCTAVERTEX_LOGO_URL } from "@/lib/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Loader2,
  LogIn,
  GitBranch,
  Mail,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState("")
  const [showVerifyCta, setShowVerifyCta] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push(user?.userKind === "CLIENT" ? "/client" : "/")
    }
  }, [isAuthenticated, user?.userKind, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setShowVerifyCta(false)

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push(result.user?.userKind === "CLIENT" ? "/client" : "/")
      } else {
        const msg = result.error || "Invalid email or password"
        setShowVerifyCta(/verify|not verified/i.test(msg))
        setError(msg)
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  }

  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
        delay: 0.1
      }
    }
  }

  const featureIconWrap =
    "mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20"

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Ambient brand backdrop */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-40 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-[120px] dark:bg-primary/25" />
        <div className="absolute bottom-[-20%] left-[-15%] h-[28rem] w-[28rem] rounded-full bg-red-950/40 blur-[100px] dark:bg-red-950/50" />
        <div className="absolute top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/30 blur-[140px] dark:bg-white/[0.03]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,hsl(var(--background))_100%)] opacity-80 dark:opacity-100" />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="grid w-full max-w-6xl items-center gap-10 md:grid-cols-2 lg:gap-16">
          {/* Brand and feature section */}
          <motion.div
            className="hidden flex-col space-y-10 md:flex"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
          >
            <motion.div
              className="flex flex-wrap items-center gap-4"
              variants={logoVariants}
              initial="initial"
              animate="animate"
            >
              <Image
                src={OCTAVERTEX_LOGO_URL}
                alt="OctaVertex Media"
                width={200}
                height={52}
                className="h-11 w-auto object-contain object-left drop-shadow-sm"
                unoptimized
                priority
              />
              <div className="h-px w-12 bg-border sm:h-8 sm:w-px sm:bg-border" />
              <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {APP_DISPLAY_NAME}
              </div>
            </motion.div>

            <div className="space-y-5">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Internal &amp; client delivery
              </p>
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-5xl">
                Internal workspace for{" "}
                <span className="bg-gradient-to-r from-primary via-red-400 to-orange-200 bg-clip-text text-transparent">
                  OctaVertex Media
                </span>
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                Projects, tickets, meetings, and knowledge in one place — built
                for your team on{" "}
                <span className="font-medium text-foreground">
                  kanban.vertexcrm.in
                </span>
                .
              </p>
            </div>

            <motion.div
              className="grid grid-cols-2 gap-4 pt-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                {
                  icon: (
                    <div className={featureIconWrap}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  ),
                  title: "Secure documents",
                  desc: "Encryption and access controls for sensitive work",
                },
                {
                  icon: (
                    <div className={featureIconWrap}>
                      <Mail className="h-5 w-5" />
                    </div>
                  ),
                  title: "Smart notifications",
                  desc: "Alerts and summaries that keep everyone aligned",
                },
                {
                  icon: (
                    <div className={featureIconWrap}>
                      <GitBranch className="h-5 w-5" />
                    </div>
                  ),
                  title: "Transparent workflows",
                  desc: "Visual boards so status is always clear",
                },
                {
                  icon: (
                    <div className={featureIconWrap}>
                      <LogIn className="h-5 w-5" />
                    </div>
                  ),
                  title: "Fast onboarding",
                  desc: "Invite team and clients without friction",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="group rounded-2xl border border-border/60 bg-card/40 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/60 hover:shadow-md dark:bg-card/30"
                  variants={itemVariants}
                >
                  {feature.icon}
                  <h3 className="mb-1 font-semibold leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
            className="mx-auto w-full max-w-md md:max-w-none md:p-4"
          >
            <Card className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/75 shadow-2xl shadow-black/20 backdrop-blur-xl dark:border-white/10 dark:bg-card/50 dark:shadow-black/40">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                aria-hidden
              />
              <CardHeader className="space-y-3 pb-2 text-center sm:text-left">
                <div className="mb-2 flex flex-col items-center gap-2 md:hidden">
                  <Image
                    src={OCTAVERTEX_LOGO_URL}
                    alt="OctaVertex Media"
                    width={180}
                    height={48}
                    className="h-10 w-auto object-contain"
                    unoptimized
                    priority
                  />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {APP_DISPLAY_NAME}
                  </span>
                </div>

                <div className="hidden sm:block">
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Welcome back
                  </CardTitle>
                  <CardDescription className="text-base">
                    Sign in with your work email to continue
                  </CardDescription>
                </div>
                <div className="sm:hidden">
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Sign in
                  </CardTitle>
                  <CardDescription>
                    Enter your credentials to continue
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-6 pb-2 pt-0 sm:px-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <Alert
                      variant="destructive"
                      className="border-destructive/50 bg-destructive/10"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <span>{error}</span>
                        {showVerifyCta ? (
                          <span className="block text-foreground/90">
                            <Link
                              href={`/auth/email-otp/verify-email?email=${encodeURIComponent(email.trim())}`}
                              className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                              Enter the verification code from your email
                            </Link>
                          </span>
                        ) : null}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground/90"
                    >
                      Email
                    </Label>
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
                      className="h-11 border-border/80 bg-background/50 transition-colors focus-visible:border-primary/50 focus-visible:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground/90"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 border-border/80 bg-background/50 pr-10 transition-colors focus-visible:border-primary/50 focus-visible:ring-primary/20"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-0.5">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked as boolean)
                      }
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me for 30 days
                    </label>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 w-full font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-primary/35"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 px-6 pb-8 pt-2 sm:px-8">
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
                <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
                  By continuing, you agree to our{" "}
                  <Link
                    href="/legal/terms"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/legal/privacy"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
      <div className="relative z-10">
        <OctaVertexLoginFooter />
      </div>
    </div>
  )
}
