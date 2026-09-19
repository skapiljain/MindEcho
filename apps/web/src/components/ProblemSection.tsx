import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Brain, CheckCircle2, Clock, Sparkles, Zap, AlertTriangle, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard } from './GlassCard'

const memoryStages = [
  {
    id: 1,
    day: 'Day 1',
    label: 'Initial Study',
    icon: BookOpen,
    retention: '100%',
    badge: 'Fresh Recall',
    status: 'Optimal Memory',
    statusColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    desc: 'Concept is clear and fresh in your mind. Neural pathways are active.',
    floatingPills: [{ text: 'Fresh Recall', color: 'bg-emerald-500/20 text-emerald-300' }],
    activeText: 'Explaining out loud now reinforces 90% of memory connections.',
  },
  {
    id: 2,
    day: 'Day 5',
    label: 'Illusion of Competence',
    icon: Brain,
    retention: '68%',
    badge: 'Passive Trap',
    status: 'Deceptive Ease',
    statusColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    desc: 'You feel confident re-reading, but recall strength is already dropping rapidly.',
    floatingPills: [{ text: 'Passive Trap', color: 'bg-amber-500/20 text-amber-300' }],
    activeText: 'Without active recall, key details begin fading quietly.',
  },
  {
    id: 3,
    day: 'Day 10',
    label: 'Memory Fades',
    icon: AlertTriangle,
    retention: '35%',
    badge: 'Forgetting Curve Spike',
    status: 'Critical Decay',
    statusColor: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    desc: 'Subtle conceptual misconceptions form. Exams become stressful.',
    floatingPills: [{ text: 'Forgetting Spike', color: 'bg-orange-500/20 text-orange-300' }],
    activeText: 'LECTOR AI prompts active Feynman explanation at this exact decay point.',
  },
  {
    id: 4,
    day: 'Day 30',
    label: 'Total Memory Decay',
    icon: RotateCcw,
    retention: '12%',
    badge: 'Re-Study Required',
    status: 'Complete Reset',
    statusColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    desc: 'Forced to re-study entire chapters from scratch. Hours wasted repeatedly.',
    floatingPills: [{ text: 'Re-study Needed', color: 'bg-rose-500/20 text-rose-300' }],
    activeText: 'Re-reading notes 10 times gives zero long-term retention boost.',
  },
]

export function ProblemSection() {
  const [selectedStage, setSelectedStage] = useState(2)

  return (
    <section className="relative px-4 py-24 sm:px-6 overflow-hidden bg-[#1a1412]">
      {/* Background Grid Pattern & Ambient Glow */}
      <div className="absolute inset-0 bg-grid-lines opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[450px] w-[650px] rounded-full bg-[#e8c89b]/10 blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header Badge & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mb-16 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e8c89b]/30 bg-[#e8c89b]/10 px-4 py-1.5 backdrop-blur-md">
            <Clock className="h-4 w-4 text-[#e8c89b]" />
            <span className="text-xs font-bold tracking-wider text-[#e8c89b] uppercase">
              The Ebbinghaus Forgetting Curve Problem
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            You Study. You Forget. You Repeat.
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#f5efe8]/75 leading-relaxed">
            Passive reading creates the illusion of competence. Click any stage below to see how memory decays without LECTOR AI&apos;s active recall system.
          </p>
        </motion.div>

        {/* 4 Interactive Memory Curve Cards */}
        <div className="mb-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {memoryStages.map((stage, i) => {
            const isSelected = selectedStage === stage.id
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedStage(stage.id)}
                className="group relative cursor-pointer flex h-full flex-col"
              >
                {/* Floating Pill Badge over card (Reference image style) */}
                <div className="absolute -top-3.5 right-4 z-30 flex items-center gap-1.5">
                  <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold shadow-lg backdrop-blur-md transition group-hover:scale-105 ${stage.statusColor}`}>
                    {stage.badge}
                  </span>
                </div>

                <GlassCard
                  dark
                  className={`flex h-full flex-col justify-between p-6 transition-all duration-300 border ${
                    isSelected
                      ? 'border-[#e8c89b] bg-[#2a221f] shadow-2xl ring-2 ring-[#e8c89b]/40 scale-[1.02]'
                      : 'border-white/15 bg-[#1e1917]/90 hover:border-[#e8c89b]/50 hover:bg-[#251e1b]'
                  }`}
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full bg-[#e8c89b]/15 px-3 py-1 text-xs font-bold text-[#e8c89b]">
                        {stage.day}
                      </span>
                      <span className="text-xl font-bold text-white tracking-tight">
                        {stage.retention}
                      </span>
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition ${
                        isSelected
                          ? 'border-[#e8c89b] bg-[#e8c89b]/25 shadow-md'
                          : 'border-white/15 bg-white/5'
                      }`}>
                        <stage.icon className={`h-6 w-6 ${isSelected ? 'text-[#e8c89b]' : 'text-white/70'}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {stage.label}
                        </h3>
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-[#e8c89b]' : 'text-white/50'}`}>
                          {stage.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-[#f5efe8]/70 mb-4">
                      {stage.desc}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px]">
                    <span className="text-white/50">Recall Strength</span>
                    <span className="font-mono font-bold text-[#e8c89b]">{stage.retention}</span>
                  </div>
                </GlassCard>

                {/* Arrow Connector between steps */}
                {i < memoryStages.length - 1 && (
                  <div className="absolute top-1/2 -right-3.5 z-30 hidden -translate-y-1/2 lg:flex h-7 w-7 items-center justify-center rounded-full bg-[#251e1b] border border-[#e8c89b]/40 shadow-lg text-[#e8c89b]">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Selected Stage Detail Insight Bar */}
        <motion.div
          key={selectedStage}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 rounded-3xl border border-[#e8c89b]/30 bg-[#251e1b]/90 p-5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-3 text-xs sm:text-sm text-[#f5efe8]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8c89b]/20 text-[#e8c89b] font-bold">
              !
            </span>
            <p>
              <strong className="text-[#e8c89b]">{memoryStages[selectedStage - 1].day} Insight:</strong>{' '}
              {memoryStages[selectedStage - 1].activeText}
            </p>
          </div>
          <span className="text-xs font-semibold text-white/50 whitespace-nowrap">
            Click stages to preview memory state
          </span>
        </motion.div>

        {/* Dynamic AI Solution Showcase Banner (Reference image style) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] border border-[#e8c89b]/40 bg-gradient-to-r from-[#2b2421] via-[#201a18] to-[#171210] p-8 sm:p-12 shadow-2xl"
        >
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 backdrop-blur-md">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
                  The LECTOR AI Solution
                </span>
              </div>

              <h3 className="mb-4 text-2xl font-bold text-white sm:text-3xl leading-snug">
                What if your revision schedule could adapt to your actual understanding?
              </h3>

              <p className="mb-8 text-sm leading-relaxed text-[#f5efe8]/75 max-w-xl">
                MindEcho replaces static timers with dynamic Feynman active recall evaluations. Instead of guessing when to study, LECTOR AI spaces reviews at the exact moment before memory fades.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/workspace"
                  className="inline-flex items-center gap-2 rounded-full bg-[#e8c89b] px-6 py-3 text-xs font-bold text-[#1e1917] transition hover:bg-[#f5e4c6] shadow-lg"
                >
                  <Sparkles className="h-4 w-4" />
                  Try LECTOR AI Workspace
                </Link>

                <Link
                  to="/calendar"
                  className="glass inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-xs font-bold text-white transition hover:bg-[#e8c89b]/15 hover:border-[#e8c89b]/40 hover:text-[#e8c89b]"
                >
                  <Zap className="h-4 w-4 text-[#e8c89b]" />
                  Explore Adaptive Calendar
                </Link>
              </div>
            </div>

            {/* Right Interactive AI Preview Mockup (Reference Image floating cards style) */}
            <div className="lg:col-span-5 relative">
              {/* Floating Pill Badges */}
              <div className="absolute -top-4 -left-3 z-30">
                <span className="flex items-center gap-1.5 rounded-full border border-[#e8c89b]/50 bg-[#251e1b] px-3.5 py-1.5 text-[11px] font-bold text-[#e8c89b] shadow-xl backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" /> Feynman Evaluation Active
                </span>
              </div>

              <div className="absolute -bottom-3 -right-3 z-30">
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-[11px] font-bold text-emerald-300 shadow-xl backdrop-blur-md">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Interval: +7 Days Scheduled
                </span>
              </div>

              {/* Main AI Preview Card Container */}
              <div className="rounded-3xl border border-white/20 bg-[#1e1917] p-6 shadow-2xl relative z-10">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8c89b]/20 border border-[#e8c89b]/40">
                      <Brain className="h-4 w-4 text-[#e8c89b]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">LECTOR AI Analysis</h4>
                      <p className="text-[10px] text-white/50">Active Recall Stream</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    9.4 / 10 Score
                  </span>
                </div>

                <div className="mb-4 rounded-2xl bg-white/5 border border-white/10 p-3.5 text-xs text-white/90 leading-relaxed font-mono">
                  &ldquo;A Binary Search Tree yields sorted values in In-Order traversal because left children are smaller...&rdquo;
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/60">Factual Correctness</span>
                    <span className="font-bold text-emerald-400">96%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 w-[96%]" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-white/60">Explanation Clarity</span>
                    <span className="font-bold text-[#e8c89b]">92%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#e8c89b] w-[92%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default ProblemSection;
