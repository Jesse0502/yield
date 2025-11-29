"use client"

import { useEffect, useState, MouseEvent } from "react"
import { motion, useScroll, useSpring, useMotionTemplate, useMotionValue } from "framer-motion"
import {
  ArrowRight, 
  Mail, 
  Search, 
  Shield, 
  Clock, 
  Zap,
  Database,
  Sparkles,
  Cpu,
  Network
} from "lucide-react"
import Link from "next/link"
import { useAppSelector } from "@/lib/store/hooks"

// --- Components ---

function BackgroundGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <motion.div 
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#C586C0]/20 blur-[120px] rounded-full mix-blend-screen"
      />
      <motion.div 
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-screen"
      />
    </div>
  )
}

function SpotlightCard({ children, className = "", spotlightColor = "rgba(197, 134, 192, 0.15)" }: { children: React.ReactNode; className?: string; spotlightColor?: string }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className={`group relative border border-white/10 bg-white/5 overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}

function GlitchText({ text }: { text: string }) {
  return (
    <div className="relative inline-block group cursor-default">
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-[#C586C0] opacity-0 group-hover:opacity-70 group-hover:translate-x-[2px] group-hover:skew-x-12 transition-all duration-100 select-none">
        {text}
      </span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-cyan-500 opacity-0 group-hover:opacity-70 group-hover:-translate-x-[2px] group-hover:-skew-x-12 transition-all duration-100 select-none">
        {text}
      </span>
    </div>
  )
}

// --- Helper Functions ---

function getLineColor(input: string | undefined | null) {
  const line = typeof input === "string" ? input : ""
  const normalized = line.toLowerCase()

  if (normalized.includes("error")) return "text-red-400"
  if (line.includes("SUCCESS")) return "text-green-400"
  if (normalized.includes("warning")) return "text-yellow-400"
  if (line.startsWith(">")) return "text-[#C586C0]"
  return "text-gray-300"
}

// --- Main Page ---

export default function LandingPage() {
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const user = useAppSelector((state) => state.auth.user)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    const lines = [
      "> Initializing yield core...",
      "> Connecting to neural interface...",
      "> [SUCCESS] Neural link established.",
      "> Analyzing 14,203 emails...",
      "> Found priority: Invoice #9923 from Acme Corp.",
      "> Action: Scheduling payment reminder [Tue 9AM].",
      "> Contextualizing: 'Project Titan' kickoff notes...",
      "> Storing memory: 'User prefers dark mode for presentations'.",
      "> Indexing new file: Q4_Financials.pdf...",
      "> [READY] Awaiting input.",
    ]

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < lines.length) {
        setTerminalLines((prev) => {
          const newLines = [...prev, lines[currentIndex]]
          return newLines.slice(-8) // Keep last 8 lines
        })
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0D17] text-white selection:bg-[#C586C0]/30 selection:text-white overflow-hidden font-sans">
      <BackgroundGrid />
      
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C586C0] to-cyan-500 transform origin-left z-50"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 md:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-cyan-500 animate-pulse">&gt;</span>
          <h1 className="text-xl font-mono font-bold text-white tracking-tight">
            <GlitchText text="yield" />
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors font-mono"
          >
            // LOGIN
          </Link>
          <Link
            href={user ? "/chat" : "/login"}
            className="group relative px-6 py-2 bg-white/5 border border-white/10 rounded-lg overflow-hidden transition-all hover:border-[#C586C0]/50 hover:shadow-[0_0_20px_rgba(197,134,192,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#C586C0]/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 text-sm font-mono font-medium text-white group-hover:text-[#C586C0] transition-colors">
              {user ? "DASHBOARD" : "START_REMEMBERING"}
            </span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-20 md:pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          
          
          <h1 className="text-6xl md:text-8xl font-mono font-bold mb-8 tracking-tight leading-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C586C0] to-cyan-500">Memory Layer</span><br />
            For Your Digital Life.
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop digging. <span className="text-white font-medium">Yield</span> proactively organizes your emails, chats, and files into a searchable Second Brain.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/chat" : "/login"}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#C586C0] rounded-lg text-white font-mono font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(197,134,192,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
              <span>INITIALIZE_YIELD</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="#"
              className="px-8 py-4 rounded-lg text-gray-400 font-mono text-sm hover:text-white border border-transparent hover:border-white/10 transition-all"
            >
              READ_DOCUMENTATION
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How it Works - Animated Pipeline */}
      <section className="relative z-10 py-32 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4">Processing Pipeline</h2>
            <p className="text-gray-400">From raw data to actionable insight in milliseconds.</p>
          </motion.div>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-white/10 -translate-y-1/2 z-0">
              <motion.div 
                className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#C586C0] to-transparent blur-[1px]"
                animate={{ left: ["-33%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {[
              { icon: Network, title: "Ingestion", desc: "Email, Chat, Files", color: "text-gray-400" },
              { icon: Cpu, title: "Processing", desc: "LLM Extraction", color: "text-[#C586C0]" },
              { icon: Database, title: "Storage", desc: "Vector Embeddings", color: "text-cyan-500" },
              { icon: Sparkles, title: "Recall", desc: "Proactive Context", color: "text-white" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 flex flex-col items-center bg-[#0B0D17] p-6 rounded-2xl border border-white/10 w-full md:w-64"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>
                <h3 className="text-lg font-mono font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 font-mono">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-32">
        <h2 className="text-3xl md:text-4xl font-mono font-bold text-center mb-16">System Capabilities</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SpotlightCard className="md:col-span-2 p-8">
            <Mail className="w-12 h-12 text-[#C586C0] mb-6" />
            <h3 className="text-2xl font-mono font-bold mb-3">Smart Inbox Zero</h3>
            <p className="text-gray-400 leading-relaxed">
              Yield acts as a firewall for your attention. It reads your emails, understands context, and only notifies you about what truly matters.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-8" spotlightColor="rgba(6, 182, 212, 0.15)">
            <Search className="w-10 h-10 text-cyan-500 mb-6" />
            <h3 className="text-xl font-mono font-bold mb-3">Vector Search</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              "What was that invoice from last week?" Find answers, not just keywords.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-8" spotlightColor="rgba(6, 182, 212, 0.15)">
            <Shield className="w-10 h-10 text-cyan-500 mb-6" />
            <h3 className="text-xl font-mono font-bold mb-3">Encrypted Core</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your memories are yours. Encrypted at rest, never trained on without consent.
            </p>
          </SpotlightCard>

          <SpotlightCard className="md:col-span-3 p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <Clock className="w-12 h-12 text-[#C586C0] mb-6" />
              <h3 className="text-2xl font-mono font-bold mb-3">Time Travel</h3>
              <p className="text-gray-400 leading-relaxed max-w-xl">
                Yield remembers so you don't have to. It automatically schedules follow-ups and resurfaces information exactly when you need it.
              </p>
            </div>
            {/* Visual decoration for wide card */}
            <div className="w-full md:w-1/3 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-lg border border-white/5 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.05),transparent)] animate-skew-scroll" />
              <span className="font-mono text-xs text-gray-600">SCHEDULED_TASK_DAEMON</span>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* Terminal Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pb-32">
        <div className="rounded-xl bg-[#0F1117] border border-white/10 shadow-2xl overflow-hidden">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="text-xs font-mono text-gray-500">yield_core — zsh — 80x24</div>
            <div className="w-10" />
          </div>
          
          {/* Terminal Body */}
          <div className="p-6 font-mono text-sm h-80 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F1117]/50 pointer-events-none z-10" />
            <div className="space-y-2">
              {terminalLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3"
                >
                  <span className="text-gray-600 select-none">{(i + 1).toString().padStart(2, '0')}</span>
                  <span className={getLineColor(line)}>
                    {line}
                  </span>
                </motion.div>
              ))}
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-2 h-4 bg-cyan-500 ml-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0B0D17]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-500 font-mono">
            // © 2024 YIELD_SYSTEMS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-8 text-xs font-mono text-gray-500">
             <Link href="#" className="hover:text-[#C586C0] transition-colors">GITHUB</Link>
             <Link href="#" className="hover:text-[#C586C0] transition-colors">TWITTER</Link>
             <Link href="#" className="hover:text-[#C586C0] transition-colors">STATUS</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
