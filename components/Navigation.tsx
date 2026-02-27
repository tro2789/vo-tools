"use client"

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MessageCircle, Heart } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()

  // Show on all pages except home
  const showNavigation = pathname !== '/'

  if (!showNavigation) {
    return null
  }

  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-700/50 bg-white/90 dark:bg-[#000d15]/90 backdrop-blur-sm sticky top-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <a
          href="/"
          className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
            VO Tools
          </div>
        </a>

        <div className="flex items-center gap-1.5 md:gap-2">
          <ThemeToggle />
          <a
            href="https://discord.gg/gYg69PbHfR"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-600"
            title="Join our Discord community"
          >
            <MessageCircle size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Discord</span>
          </a>
          <a
            href="https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm shadow-cyan-600/20"
          >
            <Heart size={14} className="fill-current md:w-4 md:h-4" />
            <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </div>
    </nav>
  )
}
