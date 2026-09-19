import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Upload,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { GlassCard } from '../components/GlassCard'
import { Navbar } from '../components/Navbar'
import { ShinyButton } from '../components/ui/shiny-button'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useApi } from '../lib/api/client'
import { AuthenticatedAudioPlayer } from '../components/dashboard/AuthenticatedAudioPlayer'
import {
  submitTextEvaluation,
  submitVoiceEvaluation,
  type FeynmanEvaluationResponse,
  type PracticeQuestion,
  type RetentionImpact,
  type SubConceptScore,
} from '../lib/api/evaluations.api'
import {
  addPracticeQuestion,
  generatePracticeQuestions,
  updatePracticeQuestion,
} from '../lib/api/notes.api'

export function NewConcept() {
  const { isAuthenticated } = useAuth()
  const { notes, addNote, applyEvaluationResult } = useNotes()
  const { voiceEnabled } = useSubscription()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Stepper state: 1 = Upload, 2 = Record/Explain, 3 = Evaluation
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: Concept & Notes state
  const [selectedNoteId, setSelectedNoteId] = useState<string>('')
  const [topicName, setTopicName] = useState('')
  const [subject, setSubject] = useState('Computer Science')
  const [notesText, setNotesText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    size: string
  } | null>(null)

  // Evaluation result state
  const [evalResult, setEvalResult] = useState<{
    score: number
    correctness: number
    clarity: number
    completeness: number
  }>({
    score: 9.2,
    correctness: 94,
    clarity: 90,
    completeness: 92,
  })

  // Check URL query parameters for pre-selected note
  useEffect(() => {
    const paramNoteId = searchParams.get('noteId')
    const paramTopic = searchParams.get('topic')

    if (paramNoteId) {
      const found = notes.find((n) => n.id === paramNoteId)
      if (found) {
        setSelectedNoteId(found.id)
        setTopicName(found.title)
        setSubject(found.subject)
        setNotesText(found.content)
        setPracticeQuestions(found.practiceQuestions ?? [])
      }
    } else if (paramTopic) {
      setTopicName(paramTopic)
    }
  }, [searchParams, notes])

  // Handle dropdown selection of stored Notion note
  const handleSelectNotionNote = (noteId: string) => {
    setSelectedNoteId(noteId)
    if (!noteId) return

    const note = notes.find((n) => n.id === noteId)
    if (note) {
      setTopicName(note.title)
      setSubject(note.subject)
      setNotesText(note.content)
      setPracticeQuestions(note.practiceQuestions ?? [])
    }
  }

  const selectActiveQuestion = (questions: PracticeQuestion[], preferredId?: string) => {
    const adopted = questions.filter((item) => item.adopted)
    const pool = adopted.length > 0 ? adopted : questions
    const next =
      pool.find((item) => item.id === preferredId) ??
      pool.find((item) => !item.score) ??
      pool[0]

    if (next) {
      setActiveQuestionId(next.id)
      setLectorQuestion(next.question)
    }
  }

  const loadPracticeQuestions = async (noteId: string, append = false) => {
    if (!useApi) {
      const fallback: PracticeQuestion[] = [
        {
          id: 'pq-local-1',
          question: `Explain the core idea of "${topicName || 'this topic'}" in simple words.`,
          adopted: true,
          source: 'ai',
        },
        {
          id: 'pq-local-2',
          question: `What is the most important application of "${topicName || 'this topic'}"?`,
          adopted: true,
          source: 'ai',
        },
        {
          id: 'pq-local-3',
          question: `What mistake do beginners often make about "${topicName || 'this topic'}"?`,
          adopted: true,
          source: 'ai',
        },
      ]
      setPracticeQuestions(fallback)
      selectActiveQuestion(fallback)
      return
    }

    setIsGeneratingQuestions(true)
    try {
      const note = await generatePracticeQuestions(noteId, {
        count: append ? 2 : 4,
        append,
      })
      setPracticeQuestions(note.practiceQuestions ?? [])
      selectActiveQuestion(note.practiceQuestions ?? [], activeQuestionId)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to generate questions')
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  // Step 2: Voice & Text Explanation state
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice')
  const [textExplanation, setTextExplanation] = useState('')

  useEffect(() => {
    if (!voiceEnabled && inputMode === 'voice') {
      setInputMode('text')
    }
  }, [voiceEnabled, inputMode])

  // MediaRecorder Voice Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lectorQuestion, setLectorQuestion] = useState('')
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([])
  const [activeQuestionId, setActiveQuestionId] = useState('')
  const [customQuestionInput, setCustomQuestionInput] = useState('')
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [evaluationTranscript, setEvaluationTranscript] = useState<string | null>(null)
  const [evaluationId, setEvaluationId] = useState<string | null>(null)
  const [subConcepts, setSubConcepts] = useState<SubConceptScore[]>([])
  const [misconceptions, setMisconceptions] = useState<string[]>([])
  const [nextPrompt, setNextPrompt] = useState('')
  const [retentionImpact, setRetentionImpact] = useState<RetentionImpact | null>(null)
  const [isProceeding, setIsProceeding] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [feedbackDetails, setFeedbackDetails] = useState<{
    strengths: string[]
    missingConcepts: string[]
    improvementTip: string
  }>({
    strengths: ['Great job explaining the core mechanism clearly.'],
    missingConcepts: [],
    improvementTip: 'Keep practicing active recall in your own words.',
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeKB = (file.size / 1024).toFixed(1)
    setUploadedFile({ name: file.name, size: `${sizeKB} KB` })

    if (!topicName) {
      setTopicName(file.name.replace(/\.[^/.]+$/, ''))
    }

    const textLike = /\.(txt|md|markdown)$/i.test(file.name)
    if (textLike) {
      const text = await file.text()
      setNotesText(text)
    } else {
      setNotesText(
        `# ${file.name}\n\nUploaded file: ${file.name} (${sizeKB} KB).\nPaste or type the key concepts from this file below before practicing.`,
      )
    }
  }

  // Step 1 Submit -> create/link note, then proceed to Step 2
  const handleProceedToQuestion = async () => {
    if (!topicName && !uploadedFile && !notesText) {
      alert('Please enter a topic name or upload notes to proceed.')
      return
    }

    setIsProceeding(true)
    setSubmitError(null)

    try {
      let noteId = selectedNoteId

      if (useApi) {
        if (!noteId && notesText.trim()) {
          const created = await addNote({
            title: topicName || 'Practice Session',
            subject,
            icon: 'brain',
            content: notesText,
          })
          noteId = created.id
          setSelectedNoteId(created.id)
        }

        if (!noteId) {
          alert('Select an existing note or paste notes content to create one.')
          return
        }
      } else if (!noteId) {
        noteId = 'note-1'
        setSelectedNoteId(noteId)
      }

      await loadPracticeQuestions(noteId, false)
      setStep(2)
    } finally {
      setIsProceeding(false)
    }
  }

  const handleGenerateMoreQuestions = async () => {
    if (!selectedNoteId) return
    await loadPracticeQuestions(selectedNoteId, true)
  }

  const handleAddCustomQuestion = async () => {
    const trimmed = customQuestionInput.trim()
    if (!selectedNoteId || trimmed.length < 8) return

    if (!useApi) {
      const next: PracticeQuestion = {
        id: `pq-local-${Date.now()}`,
        question: trimmed,
        adopted: true,
        source: 'user',
      }
      const updated = [...practiceQuestions, next]
      setPracticeQuestions(updated)
      selectActiveQuestion(updated, next.id)
      setCustomQuestionInput('')
      return
    }

    try {
      const note = await addPracticeQuestion(selectedNoteId, trimmed)
      setPracticeQuestions(note.practiceQuestions ?? [])
      selectActiveQuestion(note.practiceQuestions ?? [])
      setCustomQuestionInput('')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add question')
    }
  }

  const handleToggleQuestionAdopted = async (question: PracticeQuestion) => {
    if (!selectedNoteId || !useApi) {
      const updated = practiceQuestions.map((item) =>
        item.id === question.id ? { ...item, adopted: !item.adopted } : item,
      )
      setPracticeQuestions(updated)
      return
    }

    try {
      const note = await updatePracticeQuestion(selectedNoteId, question.id, {
        adopted: !question.adopted,
      })
      setPracticeQuestions(note.practiceQuestions ?? [])
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update question')
    }
  }

  // Real Browser Microphone Recording Controls
  const startRecording = async () => {
    setMicError(null)
    setAudioUrl(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        // Stop track streams
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch (err) {
      console.error(err)
      setMicError(
        'Microphone access denied or unavailable. You can also type your explanation in the Text tab!',
      )
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const applyEvaluationToUi = async (res: FeynmanEvaluationResponse, mode: 'voice' | 'text') => {
    setEvalResult({
      score: res.lectorScore,
      correctness: res.correctness,
      clarity: res.clarity,
      completeness: res.completeness,
    })
    setFeedbackDetails({
      strengths: res.feedback.strengths || [],
      missingConcepts: res.feedback.missingConcepts || [],
      improvementTip: res.feedback.improvementTip || 'Keep practicing active recall.',
    })
    setSubConcepts(res.subConcepts || [])
    setMisconceptions(res.misconceptions || [])
    setNextPrompt(res.nextPrompt || '')
    setRetentionImpact(res.retentionImpact || null)
    setEvaluationTranscript(res.transcript || (mode === 'text' ? textExplanation : null))
    setEvaluationId(res.evaluationId)
    if (res.practiceQuestions?.length) {
      setPracticeQuestions(res.practiceQuestions)
    }
    setLectorQuestion(res.nextPrompt || lectorQuestion)
    await applyEvaluationResult(res, mode)
  }

  // Step 2 Submit -> LECTOR evaluation
  const handleSubmitExplanation = async () => {
    if (inputMode === 'voice' && !audioUrl && recordingTime === 0) {
      alert('Please record your voice explanation or switch to text mode.')
      return
    }
    if (inputMode === 'text' && !textExplanation.trim()) {
      alert('Please enter your written explanation.')
      return
    }
    if (!activeQuestionId) {
      alert('Select a practice question first.')
      return
    }

    const noteId = selectedNoteId || (useApi ? '' : 'note-1')
    if (!noteId) {
      alert('Please link this practice session to a note first.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      if (useApi) {
        const res =
          inputMode === 'text'
            ? await submitTextEvaluation({
                noteId,
                explanationText: textExplanation,
                questionId: activeQuestionId,
              })
            : await submitVoiceEvaluation({
                noteId,
                audioBlob: new Blob(audioChunksRef.current, { type: 'audio/webm' }),
                questionId: activeQuestionId,
              })

        await applyEvaluationToUi(res, inputMode)
        setStep(3)
        return
      }

      setSubmitError('Enable VITE_USE_API=true and run the LECTOR API for real evaluations.')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Evaluation failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="theme-page min-h-screen text-[#f5efe8]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#e8c89b] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center sm:text-left"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#e8c89b]/30 bg-[#e8c89b]/10 px-3.5 py-1 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#e8c89b]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#e8c89b]">
              LECTOR Active Learning
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start New Concept Studio
          </h1>
          <p className="mt-2 text-sm text-[#f5efe8]/70">
            Upload your study notes, answer LECTOR AI prompts out loud, and calibrate your retention curve.
          </p>
        </motion.div>

        {/* Stepper Progress Indicator */}
        <div className="mb-10 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              step === 1
                ? 'bg-[#e8c89b] text-[#1e1917] shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>1. Upload Notes</span>
          </button>

          <button
            onClick={() => step > 1 && setStep(2)}
            disabled={step < 2}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              step === 2
                ? 'bg-[#e8c89b] text-[#1e1917] shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>2. Voice/Text Explain</span>
          </button>

          <button
            onClick={() => step > 2 && setStep(3)}
            disabled={step < 3}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              step === 3
                ? 'bg-[#e8c89b] text-[#1e1917] shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>3. LECTOR Evaluation</span>
          </button>
        </div>

        {/* ================= STEP 1: UPLOAD NOTES & CONCEPT INFO ================= */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <GlassCard dark className="p-8 border border-white/15 shadow-2xl">
              <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#e8c89b]" />
                Step 1: Enter Topic &amp; Upload Study Material
              </h2>

              <div className="space-y-5">
                {/* Select Notion Note Dropdown */}
                {notes.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#e8c89b]">
                      Select from Stored Notion Workspace Notes
                    </label>
                    <select
                      value={selectedNoteId}
                      onChange={(e) => handleSelectNotionNote(e.target.value)}
                      className="glass w-full rounded-2xl border border-white/15 px-4 py-3 text-sm text-[#e8c89b] font-semibold outline-none focus:border-[#e8c89b]"
                    >
                      <option value="" className="bg-[#1e1917] text-white">
                        -- Or enter a custom concept topic below --
                      </option>
                      {notes.map((n) => (
                        <option key={n.id} value={n.id} className="bg-[#1e1917] text-white">
                          {n.icon} {n.title} ({n.subject})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#e8c89b]">
                    Subject / Domain
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="glass w-full rounded-2xl border border-white/15 px-4 py-3 text-sm text-white outline-none focus:border-[#e8c89b]"
                  >
                    <option value="Computer Science" className="bg-[#1e1917]">
                      Computer Science
                    </option>
                    <option value="Physics & Engineering" className="bg-[#1e1917]">
                      Physics &amp; Engineering
                    </option>
                    <option value="Biology & Medicine" className="bg-[#1e1917]">
                      Biology &amp; Medicine
                    </option>
                    <option value="Mathematics" className="bg-[#1e1917]">
                      Mathematics
                    </option>
                    <option value="General Studies" className="bg-[#1e1917]">
                      General Studies
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#e8c89b]">
                    Concept / Topic Title
                  </label>
                  <input
                    type="text"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="e.g. Binary Search Trees & Traversal"
                    className="glass w-full rounded-2xl border border-white/15 px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#e8c89b]"
                  />
                </div>

                {/* File Dropzone */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#e8c89b]">
                    Upload Study Notes / PDF / TXT
                  </label>
                  <div className="relative glass flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 p-8 text-center transition hover:border-[#e8c89b]/60">
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx,.md"
                      onChange={handleFileUpload}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8c89b]/15 border border-[#e8c89b]/30">
                      <Upload className="h-6 w-6 text-[#e8c89b]" />
                    </div>
                    {uploadedFile ? (
                      <div className="flex items-center gap-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 text-xs font-semibold text-emerald-300">
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {uploadedFile.name} ({uploadedFile.size})</span>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="hover:underline text-white/60"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-white">
                          Click or Drag &amp; Drop notes file here
                        </p>
                        <p className="mt-1 text-xs text-white/50">
                          Supports PDF, TXT, DOCX, Markdown (Max 25MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Or Paste Notes */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#e8c89b]">
                    Or Paste Concept Notes / Summary Directly
                  </label>
                  <textarea
                    rows={4}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Paste textbook summary or bullet points here..."
                    className="glass w-full rounded-2xl border border-white/15 px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#e8c89b]"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <ShinyButton
                    label={isProceeding ? 'Preparing…' : 'Generate LECTOR AI Questions →'}
                    onClick={handleProceedToQuestion}
                    disabled={isProceeding}
                    accentColor="#e8c89b"
                    accentSoftColor="#f5efe8"
                    fillColor="#2b2421"
                    cornerRadius={9999}
                    className="px-6 py-3.5 text-sm font-semibold"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ================= STEP 2: LECTOR AI QUESTION & VOICE/TEXT RECORDING ================= */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <GlassCard dark className="p-8 border border-white/15 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <span className="rounded-full bg-[#e8c89b]/15 border border-[#e8c89b]/30 px-3 py-1 text-xs font-bold text-[#e8c89b]">
                  Topic: {topicName || 'Binary Search Trees'}
                </span>
                <span className="text-xs text-white/50">{subject}</span>
              </div>

              {/* LECTOR AI Practice Question Set */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#e8c89b]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e8c89b]">
                      LECTOR Practice Questions ({practiceQuestions.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleGenerateMoreQuestions()}
                    disabled={isGeneratingQuestions || !selectedNoteId}
                    className="rounded-full border border-[#e8c89b]/30 px-3 py-1 text-[11px] font-semibold text-[#e8c89b] hover:bg-[#e8c89b]/10 disabled:opacity-50"
                  >
                    {isGeneratingQuestions ? 'Generating…' : '+ Add more AI questions'}
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {practiceQuestions.map((item) => {
                    const isActive = item.id === activeQuestionId
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectActiveQuestion(practiceQuestions, item.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isActive
                            ? 'border-[#e8c89b]/60 bg-[#e8c89b]/15'
                            : 'border-white/10 bg-white/5 hover:border-[#e8c89b]/30'
                        } ${!item.adopted ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-white leading-relaxed">
                            &ldquo;{item.question}&rdquo;
                          </p>
                          {item.score != null && (
                            <span className="shrink-0 rounded-full bg-[#e8c89b]/20 px-2 py-0.5 text-[10px] font-bold text-[#e8c89b]">
                              {item.score.toFixed(1)}/10
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
                          <span>{item.source === 'user' ? 'Your question' : 'AI question'}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleToggleQuestionAdopted(item)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.stopPropagation()
                                void handleToggleQuestionAdopted(item)
                              }
                            }}
                            className="font-semibold text-[#e8c89b] hover:underline"
                          >
                            {item.adopted ? 'Adopted' : 'Adopt question'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    value={customQuestionInput}
                    onChange={(event) => setCustomQuestionInput(event.target.value)}
                    placeholder="Add your own practice question..."
                    className="glass flex-1 rounded-xl border border-white/15 px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#e8c89b]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddCustomQuestion()}
                    className="rounded-xl border border-[#e8c89b]/30 px-3 py-2 text-[11px] font-semibold text-[#e8c89b] hover:bg-[#e8c89b]/10"
                  >
                    Add
                  </button>
                </div>

                {lectorQuestion && (
                  <div className="rounded-2xl border border-[#e8c89b]/30 bg-[#e8c89b]/10 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#e8c89b]">
                      Active question
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">&ldquo;{lectorQuestion}&rdquo;</p>
                  </div>
                )}
              </div>

              {!voiceEnabled && useApi && (
                <p className="mb-4 text-xs text-amber-300">
                  Voice evaluations require a Pro plan.{' '}
                  <Link to="/llm-payment" className="underline text-[#e8c89b]">
                    Upgrade here
                  </Link>{' '}
                  or use text mode.
                </p>
              )}
              <div className="mb-6 flex gap-3">
                <button
                  onClick={() => voiceEnabled && setInputMode('voice')}
                  disabled={!voiceEnabled}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition border ${
                    inputMode === 'voice'
                      ? 'border-[#e8c89b] bg-[#e8c89b]/20 text-[#e8c89b]'
                      : 'border-white/10 glass text-white/60 hover:text-white'
                  } ${!voiceEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Mic className="h-4 w-4" />
                  <span>Voice Recording {voiceEnabled ? '' : '(Pro plan)'}</span>
                </button>

                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition border ${
                    inputMode === 'text'
                      ? 'border-[#e8c89b] bg-[#e8c89b]/20 text-[#e8c89b]'
                      : 'border-white/10 glass text-white/60 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Text Explanation</span>
                </button>
              </div>

              {/* Voice Recorder UI */}
              {inputMode === 'voice' && (
                <div className="space-y-6">
                  <div className="glass flex flex-col items-center justify-center rounded-2xl border border-white/15 p-8 text-center">
                    {micError && (
                      <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-medium text-rose-300">
                        {micError}
                      </div>
                    )}

                    {/* Recording Visualizer Wave */}
                    <div className="mb-6 flex items-center justify-center gap-1.5 h-16">
                      {isRecording ? (
                        [...Array(12)].map((_, i) => (
                          <motion.span
                            key={i}
                            animate={{ height: ['12px', '48px', '16px'] }}
                            transition={{
                              duration: 0.6 + (i % 3) * 0.2,
                              repeat: Infinity,
                              repeatType: 'reverse',
                            }}
                            className="w-1.5 rounded-full bg-[#e8c89b]"
                          />
                        ))
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8c89b]/15 border border-[#e8c89b]/30">
                          <Mic className="h-8 w-8 text-[#e8c89b]" />
                        </div>
                      )}
                    </div>

                    {/* Timer Counter */}
                    <div className="mb-6 text-2xl font-mono font-bold text-white">
                      {formatTime(recordingTime)}
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="btn-glow flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold shadow-lg"
                        >
                          <Mic className="h-4 w-4" />
                          <span>{audioUrl ? 'Re-record Voice' : 'Start Recording'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-rose-500"
                        >
                          <Square className="h-4 w-4 fill-white" />
                          <span>Stop Recording</span>
                        </button>
                      )}
                    </div>

                    {/* Audio Playback Element */}
                    {audioUrl && (
                      <div className="mt-6 w-full max-w-md">
                        <p className="mb-2 text-xs font-semibold text-[#e8c89b]">
                          Recording Playback Preview:
                        </p>
                        <audio src={audioUrl} controls className="w-full" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Text Input Mode */}
              {inputMode === 'text' && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#e8c89b]">
                    Type Your Feynman Explanation
                  </label>
                  <textarea
                    rows={6}
                    value={textExplanation}
                    onChange={(e) => setTextExplanation(e.target.value)}
                    placeholder="Explain the topic as if teaching a classmate..."
                    className="glass w-full rounded-2xl border border-white/15 px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#e8c89b]"
                  />
                </div>
              )}

              {submitError && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-200">
                  {submitError}
                </div>
              )}

              <div className="mt-8 flex justify-between items-center border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-white/60 hover:text-white"
                >
                  ← Edit Topic Notes
                </button>

                <ShinyButton
                  label={isSubmitting ? "Evaluating Explanation..." : "Submit for LECTOR AI Evaluation →"}
                  onClick={handleSubmitExplanation}
                  disabled={isSubmitting}
                  accentColor="#e8c89b"
                  accentSoftColor="#f5efe8"
                  fillColor="#2b2421"
                  cornerRadius={9999}
                  className="px-6 py-3.5 text-sm font-semibold"
                />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ================= STEP 3: LECTOR EVALUATION RESULT ================= */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <GlassCard dark className="p-8 border border-white/15 shadow-2xl">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8c89b]/20 border border-[#e8c89b]/40 shadow-xl">
                  <Brain className="h-8 w-8 text-[#e8c89b]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#e8c89b]">
                  LECTOR Evaluation Complete
                </span>
                <h2 className="mt-1 text-3xl font-bold text-white">
                  Score: {evalResult.score} / 10 ({evalResult.score >= 9.0 ? 'Strong Understanding' : 'Good Progress'})
                </h2>
              </div>

              {/* Sub-scores Grid */}
              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="glass rounded-2xl border border-white/15 p-5 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Correctness
                  </span>
                  <p className="mt-2 text-2xl font-bold text-white">{evalResult.correctness}%</p>
                  <p className="mt-1 text-[11px] text-white/60">Factual accuracy &amp; logic</p>
                </div>

                <div className="glass rounded-2xl border border-white/15 p-5 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e8c89b]">
                    Clarity
                  </span>
                  <p className="mt-2 text-2xl font-bold text-white">{evalResult.clarity}%</p>
                  <p className="mt-1 text-[11px] text-white/60">Explanation structure</p>
                </div>

                <div className="glass rounded-2xl border border-white/15 p-5 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Completeness
                  </span>
                  <p className="mt-2 text-2xl font-bold text-white">{evalResult.completeness}%</p>
                  <p className="mt-1 text-[11px] text-white/60">Key sub-concept coverage</p>
                </div>
              </div>

              {subConcepts.length > 0 && (
                <div className="mb-8 rounded-2xl border border-white/15 bg-white/5 p-6">
                  <h3 className="mb-3 text-sm font-bold text-white">Sub-concept Coverage</h3>
                  <div className="space-y-2">
                    {subConcepts.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs"
                      >
                        <span className={item.covered ? 'text-emerald-300' : 'text-amber-300'}>
                          {item.covered ? '✓' : '○'} {item.name}
                        </span>
                        <span className="font-mono text-white/70">{item.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {misconceptions.length > 0 && (
                <div className="mb-8 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6">
                  <h3 className="mb-2 text-sm font-bold text-rose-200">Detected Misconceptions</h3>
                  <ul className="space-y-1 text-xs text-rose-100/90">
                    {misconceptions.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluationTranscript && (
                <div className="mb-8 rounded-2xl border border-white/15 bg-white/5 p-6">
                  <h3 className="mb-2 text-sm font-bold text-white">Your Explanation</h3>
                  <p className="text-xs leading-relaxed text-white/75 whitespace-pre-wrap">{evaluationTranscript}</p>
                  {evaluationId && inputMode === 'voice' && useApi && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold text-[#e8c89b]">Stored Voice Answer</p>
                      <AuthenticatedAudioPlayer evaluationId={evaluationId} />
                    </div>
                  )}
                </div>
              )}

              {retentionImpact && (
                <div className="mb-8 rounded-2xl border border-[#e8c89b]/20 bg-[#e8c89b]/10 p-6">
                  <h3 className="mb-1 text-sm font-bold text-[#e8c89b]">Adaptive Review Impact</h3>
                  <p className="text-xs text-white/80">
                    Next review suggested in <strong>{retentionImpact.intervalDays} day(s)</strong>.{' '}
                    {retentionImpact.reason}
                  </p>
                </div>
              )}

              {practiceQuestions.length > 0 && (
                <div className="mb-8 rounded-2xl border border-white/15 bg-white/5 p-6">
                  <h3 className="mb-3 text-sm font-bold text-white">Question Scores</h3>
                  <div className="space-y-2">
                    {practiceQuestions.filter((item) => item.adopted).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-xs"
                      >
                        <span className="text-white/80">{item.question}</span>
                        <span className="shrink-0 font-mono font-bold text-[#e8c89b]">
                          {item.score != null ? `${item.score.toFixed(1)}/10` : 'Not scored yet'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nextPrompt && (
                <div className="mb-8 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-6">
                  <h3 className="mb-2 text-sm font-bold text-blue-200">Next LECTOR Prompt</h3>
                  <p className="text-xs text-white/85">&ldquo;{nextPrompt}&rdquo;</p>
                </div>
              )}

              {/* AI Feedback Box */}
              <div className="mb-8 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md">
                <h3 className="mb-3 text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#e8c89b]" />
                  LECTOR AI Feedback Summary:
                </h3>
                <ul className="space-y-2 text-xs leading-relaxed text-[#f5efe8]/80">
                  {feedbackDetails.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                  {feedbackDetails.missingConcepts.map((m, idx) => (
                    <li key={`m-${idx}`} className="flex items-start gap-2 text-amber-300">
                      <Clock className="mt-0.5 h-4 w-4 text-amber-400 shrink-0" />
                      <span>Missing Concept: {m}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 text-[#e8c89b] shrink-0" />
                    <span><strong>Recommendation:</strong> {feedbackDetails.improvementTip}</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-4 justify-between items-center border-t border-white/10 pt-6">
                <button
                  onClick={() => {
                    setStep(1)
                    setAudioUrl(null)
                    setRecordingTime(0)
                  }}
                  className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-[#e8c89b]/15 hover:border-[#e8c89b]/40 hover:text-[#e8c89b]"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Practice Another Concept</span>
                </button>

                <ShinyButton
                  label="Go to Dashboard →"
                  onClick={() => navigate('/dashboard')}
                  accentColor="#e8c89b"
                  accentSoftColor="#f5efe8"
                  fillColor="#2b2421"
                  cornerRadius={9999}
                  className="px-6 py-3 text-xs font-bold"
                />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </main>
    </div>
  )
}
