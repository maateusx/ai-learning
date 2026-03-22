import { useCallback, useEffect, useState } from 'react'

export type Language = 'pt-br' | 'en' | 'es'

export interface LanguageOption {
  code: Language
  label: string
  flag: string
  speechLang: string
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'pt-br', label: 'Português', flag: '🇧🇷', speechLang: 'pt-BR' },
  { code: 'en', label: 'English', flag: '🇺🇸', speechLang: 'en-US' },
  { code: 'es', label: 'Español', flag: '🇪🇸', speechLang: 'es-ES' },
]

const UI_STRINGS = {
  'pt-br': {
    siteTitle: 'Estudos de IA',
    siteSubtitle: 'Documentação pessoal sobre Inteligência Artificial',
    search: 'Buscar...',
    lightMode: 'Modo claro',
    darkMode: 'Modo escuro',
    listen: 'Escutar',
    playing: 'Reproduzindo...',
    listenSection: 'Escutar seção',
    prevSection: 'Seção anterior',
    nextSection: 'Próxima seção',
    pause: 'Pausar',
    resume: 'Continuar',
    speed: 'Velocidade',
    closePlayer: 'Fechar player',
    sectionOf: (current: number, total: number) => `Seção ${current} de ${total}`,
    noTitle: 'Sem título',
    language: 'Idioma',
  },
  en: {
    siteTitle: 'AI Studies',
    siteSubtitle: 'Personal documentation on Artificial Intelligence',
    search: 'Search...',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    listen: 'Listen',
    playing: 'Playing...',
    listenSection: 'Listen to section',
    prevSection: 'Previous section',
    nextSection: 'Next section',
    pause: 'Pause',
    resume: 'Resume',
    speed: 'Speed',
    closePlayer: 'Close player',
    sectionOf: (current: number, total: number) => `Section ${current} of ${total}`,
    noTitle: 'Untitled',
    language: 'Language',
  },
  es: {
    siteTitle: 'Estudios de IA',
    siteSubtitle: 'Documentación personal sobre Inteligencia Artificial',
    search: 'Buscar...',
    lightMode: 'Modo claro',
    darkMode: 'Modo oscuro',
    listen: 'Escuchar',
    playing: 'Reproduciendo...',
    listenSection: 'Escuchar sección',
    prevSection: 'Sección anterior',
    nextSection: 'Siguiente sección',
    pause: 'Pausar',
    resume: 'Continuar',
    speed: 'Velocidad',
    closePlayer: 'Cerrar reproductor',
    sectionOf: (current: number, total: number) => `Sección ${current} de ${total}`,
    noTitle: 'Sin título',
    language: 'Idioma',
  },
}

export type UIStrings = {
  siteTitle: string
  siteSubtitle: string
  search: string
  lightMode: string
  darkMode: string
  listen: string
  playing: string
  listenSection: string
  prevSection: string
  nextSection: string
  pause: string
  resume: string
  speed: string
  closePlayer: string
  sectionOf: (current: number, total: number) => string
  noTitle: string
  language: string
}

function detectLanguage(): Language {
  const saved = localStorage.getItem('language') as Language | null
  if (saved && ['pt-br', 'en', 'es'].includes(saved)) return saved
  return 'pt-br'
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(detectLanguage)

  useEffect(() => {
    localStorage.setItem('language', language)
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
  }, [])

  const t = UI_STRINGS[language]
  const speechLang = LANGUAGES.find((l) => l.code === language)!.speechLang

  return { language, setLanguage, t, speechLang }
}
