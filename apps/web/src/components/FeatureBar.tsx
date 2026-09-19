import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Mic,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { GlassCard } from './GlassCard'

const featurePillars = [
  {
    id: 'explain',
    icon: Users,
    badge: 'Feynman Active Recall',
    title: 'Explain Concepts',
    desc: 'Using your own simple words for deeper conceptual understanding and long-term neural encoding.',
    color: 'border-[#e8c89b]/40 bg-[#e8c89b]/10 text-[#e8c89b]',
    mockup: {
      type: 'voice',
      title: 'Feynman Explanation Studio',
      snippet: '“In-Order traversal visits left subtree, root node, then right subtree in ascending order...”',
      tag: 'Voice & Text Active',
    },
  },
  {
    id: 'lector',
    icon: FileText,
    badge: 'Semantic Analysis',
    title: 'LECTOR LLM Scores',
    desc: 'Checks correctness, clarity, and concept completeness in real-time with actionable feedback.',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    mockup: {
      type: 'scores',
      scores: [
        { label: 'Correctness', value: '96%' },
        { label: 'Clarity', value: '92%' },
        { label: 'Completeness', value: '94%' },
      ],
      tag: 'Instant Feedback',
    },
  },
  {
    id: 'scheduling',
    icon: Shield,
    badge: 'Dynamic Decay Modeling',
    title: 'Smart Scheduling',
    desc: 'Calculates your individual retention decay curve, scheduling reviews at the exact right moment.',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    mockup: {
      type: 'schedule',
      nextReview: 'In 4 Days',
      retentionHealth: '94% Retention',
      tag: 'Spaced Repetition Engine',
    },
  },
  {
    id: 'perform',
    icon: Trophy,
    badge: 'Accelerated Revision',
    title: 'Perform Better',
    desc: 'Be completely ready for exams, vivas, and competitive tests with compressed revision targets.',
    color: 'border-[#e8c89b]/40 bg-[#e8c89b]/10 text-[#e8c89b]',
    mockup: {
      type: 'exam',
      countdown: '7 Days Left Until Exam',
      priority: 'High Priority Queue',
      tag: 'Exam Mode Active',
    },
  },
]

export function FeatureBar() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section id="features" className="relative z-10 px-4 py-20 sm:px-6 overflow-hidden bg-[#181311]">
      {/* Background Grid Texture */}
      <div className="absolute inset-0 bg-grid-lines opacity-50 pointer-events-none" />
      <div className="absolute top-1/3 right-10 h-96 w-96 rounded-full bg-[#e8c89b]/10 blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mb-16 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e8c89b]/30 bg-[#e8c89b]/10 px-4 py-1.5 backdrop-blur-md">
            <Cpu className="h-4 w-4 text-[#e8c89b]" />
            <span className="text-xs font-bold tracking-wider text-[#e8c89b] uppercase">
              Core Platform Capabilities
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Client-Ready AI Assistance for Active Learning
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#f5efe8]/75 leading-relaxed">
            Automate revision intervals, evaluate open-ended explanations, and conquer exams without burnout.
          </p>
        </motion.div>

        {/* 4 Feature Pillars Grid (Matching reference image floating UI card layout) */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 items-stretch mb-16">
          {featurePillars.map((item, i) => {
            const isActive = activeTab === i
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveTab(i)}
                className="group relative cursor-pointer flex h-full flex-col"
              >
                {/* Floating Badge Pill over card top */}
                <div className="absolute -top-3.5 right-4 z-30 flex items-center gap-1">
                  <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold shadow-xl backdrop-blur-md transition group-hover:scale-105 ${item.color}`}>
                    {item.badge}
                  </span>
                </div>

                <GlassCard
                  dark
                  className={`flex h-full flex-col justify-between p-6 transition-all duration-300 border ${
                    isActive
                      ? 'border-[#e8c89b] bg-[#2a221f] shadow-2xl ring-2 ring-[#e8c89b]/40 scale-[1.02]'
                      : 'border-white/15 bg-[#1e1917]/90 hover:border-[#e8c89b]/50 hover:bg-[#251e1b]'
                  }`}
                >
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8c89b]/15 border border-[#e8c89b]/30 shadow-md">
                      <item.icon className="h-6 w-6 text-[#e8c89b]" />
                    </div>

                    <h3 className="mb-2 text-lg font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[#f5efe8]/70 mb-5">
                      {item.desc}
                    </p>
                  </div>

                  {/* Micro UI Preview Mockup Inside Card */}
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 text-xs">
                    {item.mockup.type === 'voice' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-[#e8c89b] font-bold flex items-center gap-1">
                            <Mic className="h-3 w-3" /> Voice Record
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-300">
                            Active Speech
                          </span>
                        </div>
                        <p className="text-[11px] text-white/80 font-mono italic truncate">
                          {item.mockup.snippet}
                        </p>
                      </div>
                    )}

                    {item.mockup.type === 'scores' && (
                      <div className="space-y-1.5">
                        {item.mockup.scores?.map((sc) => (
                          <div key={sc.label} className="flex items-center justify-between text-[11px]">
                            <span className="text-white/60">{sc.label}</span>
                            <span className="font-bold text-emerald-400">{sc.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.mockup.type === 'schedule' && (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Next Scheduled:</span>
                          <span className="font-bold text-[#e8c89b]">{item.mockup.nextReview}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Health Gauge:</span>
                          <span className="font-bold text-emerald-400">{item.mockup.retentionHealth}</span>
                        </div>
                      </div>
                    )}

                    {item.mockup.type === 'exam' && (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#e8c89b] font-bold">{item.mockup.countdown}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/60">
                          <span>Queue: {item.mockup.priority}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function WhyUsSection() {
  const points = [
    {
      icon: Clock,
      title: 'Adaptive Scheduling',
      desc: 'Review intervals adapt continuously to your actual comprehension score, not fixed static timers.',
    },
    {
      icon: Shield,
      title: 'LECTOR Evaluation',
      desc: 'Open-ended explanations evaluated objectively for correctness, clarity, and concept completeness.',
    },
    {
      icon: Trophy,
      title: 'Exam Mode',
      desc: 'Dynamically prioritize weak topics based on retention strength and time remaining before your exam.',
    },
  ]

  return (
    <section id="why-us" className="relative px-4 py-20 sm:px-6 bg-[#1e1917]">
      <div className="mx-auto max-w-7xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mb-14"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e8c89b]/30 bg-[#e8c89b]/10 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-[#e8c89b]" />
            <span className="text-xs font-bold tracking-wider text-[#e8c89b] uppercase">
              Proven Memory Advantage
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Why MindEcho Outperforms Flashcards &amp; Static Notes
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[#f5efe8]/75">
            Designed ground-up on cognitive neuroscience to convert short-term study into permanent recall.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-3">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <GlassCard dark className="p-8 text-left border border-white/15 shadow-2xl h-full flex flex-col justify-between">
                <div>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8c89b]/15 border border-[#e8c89b]/30">
                    <p.icon className="h-7 w-7 text-[#e8c89b]" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-[#f5efe8]/70">{p.desc}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#e8c89b]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Integrated in LECTOR AI
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
