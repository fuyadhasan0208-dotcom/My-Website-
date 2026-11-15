import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { ConfirmModal } from './components/ConfirmModal';
import { Home } from './pages/Home';
import { StudyHub } from './pages/StudyHub';
import { SmartQuiz } from './pages/SmartQuiz';
import { AITutor } from './pages/AITutor';
import { StudyPlanner } from './pages/StudyPlanner';
import { Settings } from './pages/Settings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E1B4B]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/study-hub" element={<StudyHub />} />
              <Route path="/quiz" element={<SmartQuiz />} />
              <Route path="/tutor" element={<AITutor />} />
              <Route path="/planner" element={<StudyPlanner />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer />
          <ConfirmModal />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
