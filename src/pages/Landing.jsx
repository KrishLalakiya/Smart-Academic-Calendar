import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useDarkMode } from '../hooks/useDarkMode.js'

export default function Landing() {
  const { user } = useAuth()
  const { isDark, toggle } = useDarkMode()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col relative antialiased font-sans">

      {/* Theme toggle (floating) */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 dark:bg-white/10 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-gray-700 dark:text-gray-200 transition-all hover:scale-105"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <i className="fas fa-sun text-lg"></i>
          ) : (
            <i className="fas fa-moon text-lg"></i>
          )}
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-16 w-full">

        {/* Hero Section */}
        <div className="hero-gradient rounded-3xl p-8 sm:p-12 mb-12 border border-gray-200/50 dark:border-gray-800/60 calendar-preview relative overflow-hidden">
          {/* subtle decorative element */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white max-w-4xl leading-[1.1]">
              The Smart{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Academic Calendar
              </span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              The intelligent calendar built for modern academics. Navigate daily
              classes, prevent scheduling clashes automatically, and plan the
              semester with precision.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-gray-900 dark:bg-[#ffffff] dark:text-[#111827] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white"
              >
                <i className="fas fa-calendar-alt mr-3 text-blue-300 dark:text-blue-600"></i>
                {user ? 'Launch Calendar' : 'Get Started'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-6 py-4 text-base font-medium text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-gray-800/70 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition shadow-sm"
              >
                <i className="far fa-calendar-check mr-2 text-blue-500"></i>
                View demo
              </button>
            </div>

            {!user && (
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Already have an account?</span>
                <Link
                  to="/login"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>

          {/* floating abstract calendar snippet (visual) */}
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-12 hidden lg:block opacity-40 dark:opacity-30 pointer-events-none">
            <div className="w-40 h-36 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  April 19–25
                </span>
                <i className="fas fa-chevron-down text-gray-400 text-[10px]"></i>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[9px] text-center text-gray-500">
                <span>M</span><span>T</span><span>W</span><span>T</span>
                <span>F</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 mt-1">
                <span className="text-[10px] text-gray-400">12</span>
                <span className="text-[10px] text-gray-500">13</span>
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-medium">
                  19
                </span>
                <span className="text-[10px] text-gray-500">20</span>
                <span className="text-[10px] text-gray-500">21</span>
                <span className="text-[10px] text-gray-500">22</span>
                <span className="text-[10px] text-gray-500">23</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid (3 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {/* Card 1: Smart Scheduling */}
          <div className="card-hover bg-white dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700 rounded-2xl p-7 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-gray-700 flex items-center justify-center mb-5 border border-blue-200/50 dark:border-gray-600">
              <i className="fas fa-brain text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Smart Scheduling
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
              Automatically detects and prevents overlapping classes. Includes
              our powerful AI assistant to intelligently resolve scheduling
              conflicts and generate optimized timetables for your cohorts.
            </p>
          </div>

          {/* Card 2: Focus-Driven Views */}
          <div className="card-hover bg-white dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700 rounded-2xl p-7 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-gray-700 flex items-center justify-center mb-5 border border-purple-200/50 dark:border-gray-600">
              <i className="fas fa-eye text-2xl text-purple-600 dark:text-purple-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Focus‑Driven Views
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
              Detailed 24‑hour timeline views for your current week, and
              decluttered monthly overviews that hide daily noise to focus on
              major exams and assignments.
            </p>
          </div>

          {/* Card 3: Premium Themes */}
          <div className="card-hover bg-white dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700 rounded-2xl p-7 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-gray-700 flex items-center justify-center mb-5 border border-amber-200/50 dark:border-gray-600">
              <i className="fas fa-palette text-2xl text-amber-600 dark:text-amber-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Premium Themes
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
              A gorgeous Notion‑style aesthetic out of the box. Fully
              customizable event colors paired with deep dynamic contrasts for
              ultimate accessibility in dark mode.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/70 dark:border-gray-800/80 mt-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <i className="far fa-calendar-check text-blue-500"></i>
            <span>
              © {new Date().getFullYear()} CampusCal · Smart Academic Calendar
            </span>
          </div>
          <div className="flex gap-6">
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition"
            >
              About
            </a>
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition"
            >
              Privacy
            </a>
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition"
            >
              Docs
            </a>
            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">
              |
            </span>
            <span className="flex items-center gap-1">
              Built for academics{' '}
              <i className="fas fa-heart text-rose-400 text-xs"></i>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
