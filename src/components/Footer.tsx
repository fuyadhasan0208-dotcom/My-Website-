import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1E1B4B] text-slate-300 border-t border-[#1E1B4B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          <div className="md:col-span-5 space-y-3">
            <Logo darkSurface />
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Smart Learning &amp; Education Assistant built by Apex Edutech Labs. Helping
              students learn faster with structured explanations, MCQ quizzes, and adaptive
              study planning.
            </p>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Learning Modules</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/study-hub" className="hover:text-white transition-colors">
                  AI Study Hub
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="hover:text-white transition-colors">
                  Smart Quiz
                </Link>
              </li>
              <li>
                <Link to="/tutor" className="hover:text-white transition-colors">
                  AI Tutor
                </Link>
              </li>
              <li>
                <Link to="/planner" className="hover:text-white transition-colors">
                  Study Planner
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-white transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-white">Platform Notes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Preferences, notes, quiz history, and tutor sessions are stored locally in your
              browser for this MVP. AI requests are routed through the server API proxy.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {year} Apex Edutech Labs · EduGenius AI. All rights reserved.</p>
          <p>Smart Learning &amp; Education Assistant</p>
        </div>
      </div>
    </footer>
  );
}
