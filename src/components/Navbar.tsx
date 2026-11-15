import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'AI Study Hub', to: '/study-hub' },
  { label: 'Smart Quiz', to: '/quiz' },
  { label: 'AI Tutor', to: '/tutor' },
  { label: 'Study Planner', to: '/planner' },
  { label: 'Settings', to: '/settings' },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA] rounded-lg"
          aria-label="EduGenius AI Home"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA] rounded ${
                  isActive
                    ? 'text-[#4338CA] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-[#4338CA]'
                    : 'text-slate-600 hover:text-[#1E1B4B]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              navigate('/study-hub');
            }}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4338CA]"
          >
            Try AI Free
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#1E1B4B] hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA]"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-sm">
          <nav
            aria-label="Mobile Navigation"
            className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#4338CA]/10 text-[#4338CA] font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#1E1B4B]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate('/study-hub');
              }}
              className="mt-2 w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors cursor-pointer"
            >
              Try AI Free
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
