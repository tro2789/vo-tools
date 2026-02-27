import { MessageCircle, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full mt-4 px-4 md:px-6 py-5 border-t border-gray-200 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
        <div>
          Built for the voiceover community
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://discord.gg/gYg69PbHfR"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Discord
          </a>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <a
            href="https://github.com/tro2789/vo-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
            </svg>
            Source
          </a>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <a
            href="https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <Heart className="w-3.5 h-3.5" />
            Support
          </a>
        </div>
      </div>
    </footer>
  )
}
