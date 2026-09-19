import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, Sparkles, Users } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { GlassCard } from './GlassCard'

const teamMembers = [
  {
    id: 1,
    name: 'Dr. Kapil Jain',
    role: 'AI Research Lead & Co-Founder',
    quote: 'Empowering human cognition through adaptive AI tutors that understand how we think.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    initials: 'KJ',
    badge: 'Cognitive AI',
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'Chief Cognitive Neuroscientist',
    quote: 'True learning happens when you actively explain concepts, not when you highlight notes.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    initials: 'SC',
    badge: 'Neuroscience',
  },
  {
    id: 3,
    name: 'Marcus Vance',
    role: 'Head of LECTOR AI Engineering',
    quote: 'We built LECTOR to measure conceptual nuance, clarity, and completeness in seconds.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    initials: 'MV',
    badge: 'LLM Systems',
  },
  {
    id: 4,
    name: 'Ananya Sharma',
    role: 'Lead UX & Product Designer',
    quote: 'Designing frictionless, calm learning spaces for deep focus, retention, and clarity.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    initials: 'AS',
    badge: 'Product UX',
  },
  {
    id: 5,
    name: 'David Miller',
    role: 'Memory Algorithm Lead',
    quote: 'Turning classic Ebbinghaus memory science into personalized dynamic daily schedules.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    initials: 'DM',
    badge: 'Retention Math',
  },
  {
    id: 6,
    name: 'Elena Rostova',
    role: 'Student Advocacy & Growth Lead',
    quote: 'Ensuring every curious learner retains knowledge for life, not just for exam day.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    initials: 'ER',
    badge: 'Growth & Care',
  },
]

export function AboutUsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Circular Next / Prev Handlers
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % teamMembers.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length)
  }

  // Circular Auto-play Timer (3.5s Interval)
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        nextSlide()
      }, 3500)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, currentIndex])

  // Drag Swipe Handler for Framer Motion
  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -40) {
      nextSlide()
    } else if (info.offset.x > 40) {
      prevSlide()
    }
  }

  // Calculate visible indices in circular wrap order
  const getMemberAt = (offset: number) => {
    const idx = (currentIndex + offset + teamMembers.length) % teamMembers.length
    return teamMembers[idx]
  }

  return (
    <section id="about-us" className="relative px-4 py-24 sm:px-6 bg-[#181311] overflow-hidden">
      {/* Background Grid Texture */}
      <div className="absolute inset-0 bg-grid-lines opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[650px] rounded-full bg-[#e8c89b]/10 blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e8c89b]/30 bg-[#e8c89b]/10 px-4 py-1.5 backdrop-blur-md">
            <Users className="h-4 w-4 text-[#e8c89b]" />
            <span className="text-xs font-bold tracking-wider text-[#e8c89b] uppercase">
              Meet Our Team
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            About Us &amp; The Minds Behind MindEcho
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#f5efe8]/75 leading-relaxed">
            Drag or click arrows to explore all 6 team leaders in a continuous circular loop.
          </p>
        </motion.div>

        {/* Circular Draggable Carousel Stage */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative mx-auto max-w-5xl"
        >
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 sm:-left-6 top-1/2 z-30 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#251e1b]/90 text-[#e8c89b] shadow-2xl backdrop-blur-xl transition hover:border-[#e8c89b] hover:bg-[#e8c89b] hover:text-[#1e1917]"
            aria-label="Previous Team Member"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute -right-4 sm:-right-6 top-1/2 z-30 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#251e1b]/90 text-[#e8c89b] shadow-2xl backdrop-blur-xl transition hover:border-[#e8c89b] hover:bg-[#e8c89b] hover:text-[#1e1917]"
            aria-label="Next Team Member"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Draggable Motion Container */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="cursor-grab active:cursor-grabbing py-6"
          >
            {/* Desktop 3-Card Circular Display Grid */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-6 items-center">
              {[-1, 0, 1].map((offset) => {
                const member = getMemberAt(offset)
                const isCenter = offset === 0
                return (
                  <motion.div
                    key={`${member.id}-${offset}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: isCenter ? 1 : 0.7,
                      scale: isCenter ? 1.04 : 0.93,
                      y: isCenter ? -6 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                    className="h-full"
                  >
                    <GlassCard
                      dark
                      className={`flex h-full flex-col justify-between p-7 text-left border transition-all duration-300 shadow-2xl relative ${
                        isCenter
                          ? 'border-[#e8c89b] bg-[#2a221f] ring-2 ring-[#e8c89b]/40 shadow-2xl'
                          : 'border-white/12 bg-[#1e1917]/85 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <div className="mb-6 flex items-center justify-between">
                          <div className="relative">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-20 w-20 rounded-2xl object-cover border-2 border-[#e8c89b]/40 shadow-md"
                            />
                            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#e8c89b] text-[10px] font-bold text-[#1e1917]">
                              {member.initials}
                            </div>
                          </div>

                          <span className="rounded-full bg-[#e8c89b]/15 border border-[#e8c89b]/30 px-3 py-1 text-[11px] font-bold text-[#e8c89b]">
                            {member.badge}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">
                          {member.name}
                        </h3>
                        <p className="text-xs font-semibold text-[#e8c89b] mb-4">
                          {member.role}
                        </p>

                        <div className="relative rounded-2xl bg-black/40 border border-white/10 p-4">
                          <Quote className="absolute top-2.5 left-2.5 h-4 w-4 text-[#e8c89b]/40" />
                          <p className="pl-4 text-xs italic leading-relaxed text-[#f5efe8]/90">
                            &ldquo;{member.quote}&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between text-xs text-[#e8c89b] font-bold border-t border-white/10 pt-3">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> LECTOR Team
                        </span>
                        <span>Member #{member.id}</span>
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })}
            </div>

            {/* Mobile Single Card Carousel Display */}
            <div className="sm:hidden px-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassCard dark className="p-6 border border-[#e8c89b] bg-[#2a221f] shadow-2xl">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="relative">
                        <img
                          src={teamMembers[currentIndex].avatar}
                          alt={teamMembers[currentIndex].name}
                          className="h-20 w-20 rounded-2xl object-cover border-2 border-[#e8c89b]/40"
                        />
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#e8c89b] text-[10px] font-bold text-[#1e1917]">
                          {teamMembers[currentIndex].initials}
                        </div>
                      </div>

                      <span className="rounded-full bg-[#e8c89b]/15 border border-[#e8c89b]/30 px-3 py-1 text-[11px] font-bold text-[#e8c89b]">
                        {teamMembers[currentIndex].badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">
                      {teamMembers[currentIndex].name}
                    </h3>
                    <p className="text-xs font-semibold text-[#e8c89b] mb-4">
                      {teamMembers[currentIndex].role}
                    </p>

                    <div className="relative rounded-2xl bg-black/40 border border-white/10 p-4">
                      <Quote className="absolute top-2.5 left-2.5 h-4 w-4 text-[#e8c89b]/40" />
                      <p className="pl-4 text-xs italic leading-relaxed text-[#f5efe8]/90">
                        &ldquo;{teamMembers[currentIndex].quote}&rdquo;
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Circular Navigation Dots */}
          <div className="mt-8 flex items-center justify-center gap-2.5">
            {teamMembers.map((member, idx) => (
              <button
                key={member.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? 'w-8 bg-[#e8c89b] shadow-md'
                    : 'w-2.5 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutUsSection;
