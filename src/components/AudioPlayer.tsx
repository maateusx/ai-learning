import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import type { Section } from '../data/sections'
import type { SpeechPlayer } from '../hooks/useSpeech'
import type { UIStrings } from '../hooks/useLanguage'

interface AudioPlayerProps {
  player: SpeechPlayer
  sections: Section[]
  t: UIStrings
}

const RATES = [0.75, 1, 1.1, 1.25, 1.5, 2]

export function AudioPlayer({ player, sections, t }: AudioPlayerProps) {
  if (player.currentIndex === null) return null

  const section = sections[player.currentIndex]
  const isFirst = player.currentIndex === 0
  const isLast = player.currentIndex === sections.length - 1

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:left-72">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-linear"
          style={{ width: `${player.progress * 100}%` }}
        />
      </div>

      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={player.prev}
              disabled={isFirst}
              title={t.prevSection}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={player.toggle}
              title={player.state === 'playing' ? t.pause : t.resume}
              className="p-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors cursor-pointer"
            >
              {player.state === 'playing' ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>

            <button
              onClick={player.next}
              disabled={isLast}
              title={t.nextSection}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Section title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {section.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.sectionOf(player.currentIndex + 1, sections.length)}
            </p>
          </div>

          {/* Speed control */}
          <select
            value={player.rate}
            onChange={(e) => player.setRate(Number(e.target.value))}
            title={t.speed}
            className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800
              text-gray-700 dark:text-gray-300 border-none cursor-pointer"
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>

          {/* Close */}
          <button
            onClick={player.stop}
            title={t.closePlayer}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
