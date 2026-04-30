"use client"

import { PageShell } from "@/components/layout/page-shell"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ProjectsOverview } from "@/components/dashboard/projects-overview"
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings"
import { RecentKnowledgeArticles } from "@/components/dashboard/recent-knowledge-articles"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export default function HomePage() {
  const { user, isLoading, isAuthenticated, isClientUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/sign-in')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isLoading && isAuthenticated && isClientUser) {
      router.replace('/client')
    }
  }, [isLoading, isAuthenticated, isClientUser, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <PageShell>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="relative overflow-hidden rounded-3xl border border-border/50 shadow-xl shadow-black/5 p-8 md:p-10 isolation-auto bg-[url('/bg-premium.png')] bg-cover bg-center bg-no-repeat">
          {/* Dark overlay to ensure text readability */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />

          {/* Subtle grid pattern background over the image */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Glowing gradients */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">Legal Team Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-foreground">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">{firstName}</span> 👋
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Streamline your legal team's workflow with powerful project management,
              knowledge sharing, and collaboration tools.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-[400px]">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur transition-opacity opacity-0 group-hover:opacity-100" />
                  <div className="relative">
                    <GlobalSearch />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-lg px-4 py-2 font-medium">
                <span className="text-muted-foreground text-sm">Role:</span>
                <span className="text-sm capitalize text-foreground">{user?.role?.toLowerCase() || 'Member'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Analytics Charts */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <DashboardCharts />
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <QuickActions />
          </motion.div>
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <ProjectsOverview />
          </motion.div>
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <RecentKnowledgeArticles />
          </motion.div>
        </div>
        <div className="space-y-6">
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <UpcomingMeetings />
          </motion.div>
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <ActivityFeed />
          </motion.div>
        </div>
      </div>
    </PageShell>
  )
}
