import { Volume2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Section as SectionType } from '../data/sections'
import type { UIStrings } from '../hooks/useLanguage'

interface SectionProps {
  section: SectionType
  isPlaying: boolean
  onPlay: () => void
  t: UIStrings
}

export function Section({ section, isPlaying, onPlay, t }: SectionProps) {
  return (
    <section id={section.id} className="scroll-mt-8 py-12 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={onPlay}
          title={t.listenSection}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer
            ${isPlaying
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
        >
          <Volume2 size={16} />
          {isPlaying ? t.playing : t.listen}
        </button>
      </div>
      <article className="prose prose-gray dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.markdown}
        </ReactMarkdown>
      </article>
    </section>
  )
}
