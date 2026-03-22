import { Sidebar } from './components/Sidebar'
import { Section } from './components/Section'
import { AudioPlayer } from './components/AudioPlayer'
import { getSections } from './data/sections'
import { useTheme } from './hooks/useTheme'
import { useSpeech } from './hooks/useSpeech'
import { useLanguage } from './hooks/useLanguage'

function App() {
  const { theme, toggle } = useTheme()
  const { language, setLanguage, t, speechLang } = useLanguage()
  const sections = getSections(language, t.noTitle)
  const player = useSpeech(sections, speechLang)

  return (
    <div className="min-h-screen">
      <Sidebar
        theme={theme}
        onToggleTheme={toggle}
        language={language}
        onChangeLanguage={setLanguage}
        sections={sections}
        t={t}
      />

      {/* Main content */}
      <main className={`lg:ml-72 px-6 sm:px-12 py-8 max-w-3xl ${player.currentIndex !== null ? 'pb-28' : ''}`}>
        <header className="mb-12 pt-12 lg:pt-0">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t.siteTitle}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {t.siteSubtitle}
          </p>
        </header>

        {sections.map((section, index) => (
          <Section
            key={section.id}
            section={section}
            isPlaying={player.currentIndex === index && player.state !== 'idle'}
            onPlay={() => player.play(index)}
            t={t}
          />
        ))}
      </main>

      <AudioPlayer player={player} sections={sections} t={t} />
    </div>
  )
}

export default App
