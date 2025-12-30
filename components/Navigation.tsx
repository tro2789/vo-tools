"use client"

import Image from 'next/image'
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
    <nav className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <a
          href="/"
          className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="relative w-8 h-8 md:w-10 md:h-10">
            <Image
              src="/logo.png"
              alt="VO Tools Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            VO Tools
          </div>
        </a>
        
        <div className="flex items-center gap-1.5 md:gap-3">
          <ThemeToggle />
          <a
            href="https://discord.gg/gYg69PbHfR"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            title="Join our Discord community"
          >
            <MessageCircle size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Discord</span>
          </a>
          <a
            href="https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/20"
          >
            <Heart size={14} className="fill-current md:w-4 md:h-4" />
            <span className="hidden sm:inline">Buy Me A Coffee</span>
          </a>
        </div>
      </div>
    </nav>
  )
}
