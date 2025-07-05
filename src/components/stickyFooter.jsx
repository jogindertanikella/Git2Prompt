import VisitorMap from "./onlineUsersBadge";

export default function StickyFooter() {
  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 text-sm text-zinc-600 dark:text-zinc-400 backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4">
        {/* Visitor Count */}
        <div className="flex items-center justify-center">
          <VisitorMap mode="minimal" />
        </div>

        {/* Made with text */}
        <div className="flex items-center justify-center">
          Made with ❤️ by Joginder Tanikella. © 2025
        </div>

        {/* Social Icons */}
        <div className="flex items-center justify-center space-x-2">
          <a
            href="https://x.com/jogitanikella"
            target="_blank"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 hover:scale-105 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M20.9 3.6L13.6 12l7.3 8.4h-3.3L12 13.8 6 20.4H3.1l7.6-8.7L3.1 3.6H6l6.2 6.9 5.7-6.9h3z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/jogindertanikella/"
            target="_blank"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 hover:scale-105 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M20.45 20.45h-3.55v-5.6c0-1.33-.02-3.04-1.86-3.04-1.86 0-2.15 1.45-2.15 2.94v5.7h-3.55V9h3.4v1.56h.05c.47-.89 1.6-1.83 3.29-1.83 3.52 0 4.17 2.32 4.17 5.34v6.38zM5.34 7.43c-1.14 0-2.07-.93-2.07-2.08 0-1.15.93-2.07 2.07-2.07s2.07.92 2.07 2.07c0 1.15-.93 2.08-2.07 2.08zm1.78 13.02H3.56V9h3.56v11.45z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
