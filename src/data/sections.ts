import type { Language } from '../hooks/useLanguage'

export interface Section {
  id: string
  title: string
  markdown: string
}

const ptModules = import.meta.glob<string>('../content/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const enModules = import.meta.glob<string>('../content/en/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const esModules = import.meta.glob<string>('../content/es/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const modulesByLang: Record<Language, Record<string, string>> = {
  'pt-br': ptModules,
  en: enModules,
  es: esModules,
}

function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

function fileNameToId(path: string): string {
  return path.split('/').pop()!.replace('.md', '')
}

const ORDER: string[] = [
  'introducao',
  'ia-e-modelos',
  'universo-dos-vetores',
  'chunking',
  'busca-vetorial',
  'busca-palavra-chave',
  'busca-hibrida',
  'reciprocal-rank-fusion',
  'cross-encoders',
  'tecnicas-avancadas-busca',
  'metricas-qualidade',
  'rag',
  'rag-hibrida',
]

function buildSections(modules: Record<string, string>, fallback: string): Section[] {
  return Object.entries(modules)
    .filter(([path]) => !path.includes('_template'))
    .map(([path, markdown]) => ({
      id: fileNameToId(path),
      title: extractTitle(markdown, fallback),
      markdown,
    }))
    .sort((a, b) => {
      const ai = ORDER.indexOf(a.id)
      const bi = ORDER.indexOf(b.id)
      return (ai === -1 ? ORDER.length : ai) - (bi === -1 ? ORDER.length : bi)
    })
}

const cache: Partial<Record<Language, Section[]>> = {}

export function getSections(language: Language, noTitleFallback = 'Sem título'): Section[] {
  if (!cache[language]) {
    cache[language] = buildSections(modulesByLang[language], noTitleFallback)
  }
  return cache[language]!
}

// Default export for backward compatibility
export const sections = buildSections(ptModules, 'Sem título')
