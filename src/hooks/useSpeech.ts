import { useCallback, useEffect, useRef, useState } from 'react'
import type { Section } from '../data/sections'

export type SpeechState = 'idle' | 'playing' | 'paused'

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/:?-+:?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export interface SpeechPlayer {
  state: SpeechState
  currentIndex: number | null
  progress: number
  rate: number
  play: (index: number) => void
  toggle: () => void
  stop: () => void
  next: () => void
  prev: () => void
  setRate: (rate: number) => void
}

export function useSpeech(sections: Section[], speechLang = 'pt-BR'): SpeechPlayer {
  const [state, setState] = useState<SpeechState>('idle')
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [rate, setRateState] = useState(1.1)

  const rateRef = useRef(rate)
  const sectionsRef = useRef(sections)
  const currentIndexRef = useRef(currentIndex)
  const totalCharsRef = useRef(0)
  const lastCharIndexRef = useRef(0)
  const autoAdvanceRef = useRef(true)
  const utteranceIdRef = useRef(0)
  const speechLangRef = useRef(speechLang)

  useEffect(() => { rateRef.current = rate }, [rate])
  useEffect(() => { sectionsRef.current = sections }, [sections])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { speechLangRef.current = speechLang }, [speechLang])

  // Stop playback when language changes
  useEffect(() => {
    if (currentIndexRef.current !== null) {
      window.speechSynthesis.cancel()
      setState('idle')
      setCurrentIndex(null)
      setProgress(0)
    }
  }, [speechLang])

  const speakSection = useCallback((index: number, fromChar = 0) => {
    // Bump ID so callbacks from the previous utterance are ignored
    const id = ++utteranceIdRef.current
    window.speechSynthesis.cancel()

    const section = sectionsRef.current[index]
    if (!section) return

    const fullText = stripMarkdown(section.markdown)
    totalCharsRef.current = fullText.length
    lastCharIndexRef.current = fromChar

    const text = fromChar > 0 ? fullText.slice(fromChar) : fullText
    const charOffset = fromChar

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechLangRef.current
    utterance.rate = rateRef.current

    utterance.onboundary = (e) => {
      if (id !== utteranceIdRef.current) return
      const absoluteChar = charOffset + e.charIndex
      lastCharIndexRef.current = absoluteChar
      if (totalCharsRef.current > 0) {
        setProgress(absoluteChar / totalCharsRef.current)
      }
    }

    utterance.onend = () => {
      if (id !== utteranceIdRef.current) return
      setProgress(1)
      lastCharIndexRef.current = 0
      const idx = currentIndexRef.current
      if (idx !== null && autoAdvanceRef.current && idx < sectionsRef.current.length - 1) {
        const nextIdx = idx + 1
        setCurrentIndex(nextIdx)
        setProgress(0)
        setTimeout(() => speakSection(nextIdx), 600)
      } else {
        setState('idle')
        setCurrentIndex(null)
        setProgress(0)
      }
    }

    utterance.onerror = () => {
      if (id !== utteranceIdRef.current) return
      setState('idle')
      setCurrentIndex(null)
      setProgress(0)
      lastCharIndexRef.current = 0
    }

    setCurrentIndex(index)
    setState('playing')
    if (fromChar === 0) setProgress(0)
    window.speechSynthesis.speak(utterance)
  }, [])

  const play = useCallback((index: number) => {
    autoAdvanceRef.current = true
    speakSection(index)
  }, [speakSection])

  const toggle = useCallback(() => {
    if (state === 'playing') {
      window.speechSynthesis.pause()
      setState('paused')
    } else if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
    }
  }, [state])

  const stop = useCallback(() => {
    autoAdvanceRef.current = false
    window.speechSynthesis.cancel()
    setState('idle')
    setCurrentIndex(null)
    setProgress(0)
  }, [])

  const next = useCallback(() => {
    if (currentIndex !== null && currentIndex < sections.length - 1) {
      autoAdvanceRef.current = true
      speakSection(currentIndex + 1)
    }
  }, [currentIndex, sections.length, speakSection])

  const prev = useCallback(() => {
    if (currentIndex !== null && currentIndex > 0) {
      autoAdvanceRef.current = true
      speakSection(currentIndex - 1)
    }
  }, [currentIndex, speakSection])

  const setRate = useCallback((r: number) => {
    setRateState(r)
    rateRef.current = r
    // If currently playing, resume from current position with new rate
    if (currentIndexRef.current !== null && state !== 'idle') {
      speakSection(currentIndexRef.current, lastCharIndexRef.current)
    }
  }, [state, speakSection])

  useEffect(() => {
    return () => { window.speechSynthesis.cancel() }
  }, [])

  return { state, currentIndex, progress, rate, play, toggle, stop, next, prev, setRate }
}
