import {
  ArrowLeft,
  BookOpen,
  Brain,
  Mic,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { GlassCard } from '../components/GlassCard'
import { Navbar } from '../components/Navbar'
import { ReadingProgress } from '../components/ui/reading-progress'
import { ShinyButton } from '../components/ui/shiny-button'
import { AuthenticatedAudioPlayer } from '../components/dashboard/AuthenticatedAudioPlayer'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import { useApi } from '../lib/api/client'
import { fetchNotes, reindexNoteEmbeddings } from '../lib/api/notes.api'
import { listEvaluations, type EvaluationDetail } from '../lib/api/evaluations.api'

export function NotionWorkspace() {
  const { isAuthenticated } = useAuth()
  const { notes, activeNoteId, setActiveNoteId, addNote, updateNote, deleteNote } = useNotes()
  const navigate = useNavigate()
  const scrollerRef = useRef<HTMLTextAreaElement>(null)

  const [search, setSearch] = useState('')
  const [semanticResults, setSemanticResults] = useState<typeof notes | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [noteEvaluations, setNoteEvaluations] = useState<EvaluationDetail[]>([])
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftSubject, setDraftSubject] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftRef = useRef({ title: '', content: '', subject: '' })

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null

  useEffect(() => {
    if (!activeNote) {
      setDraftTitle('')
      setDraftContent('')
      setDraftSubject('')
      return
    }

    setDraftTitle(activeNote.title)
    setDraftContent(activeNote.content)
    setDraftSubject(activeNote.subject)
    setSaveState('idle')
  }, [activeNote?.id])

  useEffect(() => {
    draftRef.current = {
      title: draftTitle,
      content: draftContent,
      subject: draftSubject,
    }
  }, [draftTitle, draftContent, draftSubject])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const flushSave = async (noteId: string) => {
    setSaveState('saving')
    try {
      await updateNote(noteId, draftRef.current)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  const scheduleSave = (noteId: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      void flushSave(noteId)
    }, 600)
  }

  const handleDraftChange = (
    patch: Partial<{ title: string; content: string; subject: string }>,
    noteId: string,
  ) => {
    if (patch.title !== undefined) setDraftTitle(patch.title)
    if (patch.content !== undefined) setDraftContent(patch.content)
    if (patch.subject !== undefined) setDraftSubject(patch.subject)

    draftRef.current = {
      title: patch.title ?? draftRef.current.title,
      content: patch.content ?? draftRef.current.content,
      subject: patch.subject ?? draftRef.current.subject,
    }

    if (!useApi) {
      void updateNote(noteId, draftRef.current)
      return
    }

    scheduleSave(noteId)
  }

  useEffect(() => {
    if (!useApi || !activeNoteId) {
      setNoteEvaluations([])
      return
    }

    listEvaluations()
      .then((items) => setNoteEvaluations(items.filter((item) => item.noteId === activeNoteId)))
      .catch(() => setNoteEvaluations([]))
  }, [activeNoteId])

  useEffect(() => {
    if (!useApi) return
    if (sessionStorage.getItem('memoroute_semantic_ready') === '1') return

    reindexNoteEmbeddings()
      .then(() => sessionStorage.setItem('memoroute_semantic_ready', '1'))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!useApi) {
      setSemanticResults(null)
      return
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    const trimmed = search.trim()
    if (trimmed.length < 2) {
      setSemanticResults(null)
      setSearching(false)
      return
    }

    setSearching(true)
    searchTimerRef.current = setTimeout(() => {
      fetchNotes({
        search: trimmed,
        searchMode: 'semantic',
        subject: selectedSubject === 'All' ? undefined : selectedSubject,
      })
        .then((results) => setSemanticResults(results))
        .catch(() => setSemanticResults([]))
        .finally(() => setSearching(false))
    }, 400)

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [search, selectedSubject])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const filteredNotes = (semanticResults ?? notes).filter((n) => {
    const matchesSearch =
      semanticResults !== null ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    const matchesSubject = selectedSubject === 'All' || n.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  // Create new note
  const handleCreateNewNote = async () => {
    const created = await addNote({
      title: 'Untitled Notion Note',
      subject: 'Computer Science',
      content: '# New Concept Notes\n\nStart typing your study notes here...',
      icon: 'note',
    })
    setActiveNoteId(created.id)
  }

  // Handle Feynman practice launch with selected note
  const handlePracticeNote = () => {
    if (!activeNote) return
    navigate(`/concept/new?noteId=${activeNote.id}&topic=${encodeURIComponent(activeNote.title)}`)
  }

  const wordCount = draftContent.split(/\s+/).filter(Boolean).length

  return (
    <div className="theme-page min-h-screen text-[#f5efe8]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6">
        {/* Top Header Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-[#e8c89b] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Subjects &amp; Stored Notes</span>
              <span className="rounded-full bg-[#e8c89b]/15 border border-[#e8c89b]/30 px-3 py-1 text-xs font-bold text-[#e8c89b]">
                {notes.length} Notes Stored
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNewNote}
              className="glass inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e8c89b]/15 hover:border-[#e8c89b]/40 hover:text-[#e8c89b]"
            >
              <Plus className="h-4 w-4 text-[#e8c89b]" />
              <span>+ Add Note</span>
            </button>

            {activeNote && (
              <ShinyButton
                label="Take Feynman Test"
                onClick={handlePracticeNote}
                accentColor="#e8c89b"
                accentSoftColor="#f5efe8"
                fillColor="#2b2421"
                cornerRadius={9999}
                className="px-5 py-2.5 text-xs font-bold"
              />
            )}
          </div>
        </div>

        {/* Workspace Layout: Left Notion Sidebar + Right Editor Canvas */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* ================= LEFT NOTION SIDEBAR ================= */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard dark className="p-5 border border-white/15 shadow-2xl">
              {/* Search Bar */}
              <div className="mb-4 glass flex items-center gap-2 rounded-xl px-3.5 py-2.5 border border-white/10">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by concept (different words OK)..."
                  className="w-full bg-transparent text-xs text-white placeholder:text-white/40 outline-none"
                />
              </div>
              {search.trim().length >= 2 && (
                <p className="mb-3 text-[10px] text-white/45">
                  {searching
                    ? 'Finding related concepts...'
                    : 'Semantic search matches meaning, not exact words.'}
                </p>
              )}

              {/* Subject Filter Pills */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {['All', 'Computer Science', 'Physics & Engineering', 'Biology & Medicine', 'Mathematics', 'General Studies'].map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition border ${
                      selectedSubject === subj
                        ? 'border-[#e8c89b] bg-[#e8c89b]/20 text-[#e8c89b]'
                        : 'border-white/10 glass text-white/60 hover:text-[#e8c89b] hover:border-[#e8c89b]/40'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>

              {/* Stored Notes List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredNotes.length === 0 ? (
                  <p className="py-8 text-center text-xs text-white/50">
                    No notes match your search. Click &ldquo;+ Add Note&rdquo; to add one!
                  </p>
                ) : (
                  filteredNotes.map((note) => {
                    const isActive = note.id === activeNote?.id
                    return (
                      <button
                        key={note.id}
                        onClick={() => setActiveNoteId(note.id)}
                        className={`w-full text-left rounded-2xl p-3.5 transition border ${
                          isActive
                            ? 'border-[#e8c89b]/60 bg-[#e8c89b]/15 shadow-lg'
                            : 'border-white/10 glass hover:bg-[#e8c89b]/15 hover:border-[#e8c89b]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 truncate">
                            <BookOpen className="h-4 w-4 text-[#e8c89b] shrink-0" />
                            <span className="text-xs font-bold text-white truncate">
                              {note.title}
                            </span>
                          </div>
                          {note.lectorScore && (
                            <span className="shrink-0 rounded-full bg-[#e8c89b]/20 border border-[#e8c89b]/40 px-2 py-0.5 text-[10px] font-bold text-[#e8c89b]">
                              {note.lectorScore} Score
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
                          <span className="truncate">{note.subject}</span>
                          <span>{note.practiceCount} Feynman Practices</span>
                        </div>
                        {note.similarity != null && (
                          <p className="mt-1 text-[10px] font-semibold text-[#e8c89b]/80">
                            Concept match {Math.round(note.similarity * 100)}%
                          </p>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </GlassCard>
          </div>

          {/* ================= RIGHT NOTION EDITOR CANVAS ================= */}
          <div className="lg:col-span-8">
            {activeNote ? (
              <GlassCard dark className="p-8 border border-white/15 shadow-2xl relative">
                {/* LECTOR Score & Practice Retention Banner */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8c89b]/20 border border-[#e8c89b]/40">
                      <Brain className="h-5 w-5 text-[#e8c89b]" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#e8c89b]">
                        LECTOR Retention Health
                      </span>
                      <p className="text-sm font-bold text-white">
                        {activeNote.retentionHealth}% Retention &bull; {activeNote.practiceCount} Practice Sessions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePracticeNote}
                      className="btn-glow inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-md"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>Practice Feynman Method</span>
                    </button>

                    <button
                      onClick={() => deleteNote(activeNote.id)}
                      title="Delete Note"
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Subject Category */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8c89b]/15 border border-[#e8c89b]/30">
                      <BookOpen className="h-5 w-5 text-[#e8c89b]" />
                    </div>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => handleDraftChange({ title: e.target.value }, activeNote.id)}
                      onBlur={() => void flushSave(activeNote.id)}
                      placeholder="Note Title..."
                      className="w-full bg-transparent text-2xl font-bold text-white outline-none border-b border-white/10 pb-2 focus:border-[#e8c89b]"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-white/50 font-semibold">Subject Category:</span>
                    <select
                      value={draftSubject}
                      onChange={(e) => handleDraftChange({ subject: e.target.value }, activeNote.id)}
                      className="glass rounded-xl border border-white/15 px-3 py-1.5 text-xs text-[#e8c89b] font-semibold outline-none"
                    >
                      <option value="Computer Science" className="bg-[#1e1917]">Computer Science</option>
                      <option value="Physics & Engineering" className="bg-[#1e1917]">Physics &amp; Engineering</option>
                      <option value="Biology & Medicine" className="bg-[#1e1917]">Biology &amp; Medicine</option>
                      <option value="Mathematics" className="bg-[#1e1917]">Mathematics</option>
                    </select>
                  </div>
                </div>

                {/* Reading Progress Component Bar */}
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#e8c89b]">
                    Live Reading Progress Indicator
                  </span>
                  <ReadingProgress scroller={scrollerRef} words={wordCount} />
                </div>

                {/* Main Notion Content Textarea */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                    <span className="font-semibold uppercase tracking-wider text-[#e8c89b]">
                      Notion Markdown Content
                    </span>
                    <span>
                      {wordCount} Words &bull; {draftContent.length} Chars
                      {useApi && saveState === 'saving' && ' • Saving…'}
                      {useApi && saveState === 'saved' && ' • Saved'}
                      {useApi && saveState === 'error' && ' • Save failed'}
                    </span>
                  </div>

                  <textarea
                    ref={scrollerRef}
                    rows={16}
                    value={draftContent}
                    onChange={(e) => handleDraftChange({ content: e.target.value }, activeNote.id)}
                    onBlur={() => void flushSave(activeNote.id)}
                    placeholder="Start typing your study notes here..."
                    className="glass w-full rounded-2xl border border-white/15 p-5 text-sm leading-relaxed text-white font-mono placeholder:text-white/30 outline-none focus:border-[#e8c89b]"
                  />
                </div>

                {useApi && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#e8c89b]">
                        Feynman Evaluation Timeline
                      </span>
                      <Link to="/evaluations" className="text-[10px] text-[#e8c89b] hover:underline">
                        View all →
                      </Link>
                    </div>
                    {noteEvaluations.length === 0 ? (
                      <p className="text-xs text-white/50">No evaluations for this note yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {noteEvaluations.slice(0, 5).map((item) => (
                          <div key={item.id} className="rounded-xl border border-white/10 p-3 text-xs">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-bold text-white">{item.lectorScore}/10</span>
                              <span className="text-white/50">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>
                            {item.transcript && (
                              <p className="line-clamp-2 text-white/70">{item.transcript}</p>
                            )}
                            {item.audioUrl && <AuthenticatedAudioPlayer evaluationId={item.id} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Bar */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-white/50">
                  <div className="flex items-center gap-4">
                    <span>Created: {activeNote.createdAt}</span>
                    <span>Updated: {activeNote.updatedAt}</span>
                  </div>

                  <ShinyButton
                    label="Practice Feynman Method with this Note"
                    onClick={handlePracticeNote}
                    accentColor="#e8c89b"
                    accentSoftColor="#f5efe8"
                    fillColor="#2b2421"
                    cornerRadius={9999}
                    className="px-6 py-3 text-xs font-bold"
                  />
                </div>
              </GlassCard>
            ) : (
              <GlassCard dark className="p-12 text-center border border-white/15">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-[#e8c89b]/50" />
                <h3 className="text-lg font-bold text-white">No Note Selected</h3>
                <p className="mt-2 text-xs text-white/50">
                  Select a note from the Notion sidebar or create a new note to start writing and practicing.
                </p>
                <button
                  onClick={handleCreateNewNote}
                  className="btn-glow mt-6 rounded-full px-6 py-2.5 text-xs font-bold"
                >
                  + Create New Note
                </button>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
