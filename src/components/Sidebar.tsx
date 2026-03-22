import { useEffect, useState } from 'react'
import { BookOpen, Globe, Menu, Moon, Search, Sun, X } from 'lucide-react'
import type { Section } from '../data/sections'
import type { Language, UIStrings } from '../hooks/useLanguage'
import { LANGUAGES } from '../hooks/useLanguage'

interface SidebarProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  language: Language
  onChangeLanguage: (lang: Language) => void
  sections: Section[]
  t: UIStrings
}

export function Sidebar({ theme, onToggleTheme, language, onChangeLanguage, sections, t }: SidebarProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredSections = search
    ? sections.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase())
      )
    : sections

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible?.target.id) {
          setActiveId(visible.target.id)
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  function handleClick(id: string) {
    setIsOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          flex flex-col transition-transform duration-200
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center gap-2 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
          <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.siteTitle}</h1>
        </div>

        <div className="px-3 pt-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {filteredSections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => handleClick(section.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${
                      activeId === section.id
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
          {/* Language selector */}
          <div className="flex items-center gap-2 px-3 py-2">
            <Globe size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as Language)}
              className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md px-2 py-1 border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? t.lightMode : t.darkMode}
          </button>
        </div>
      </aside>
    </>
  )
}
