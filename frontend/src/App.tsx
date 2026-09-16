import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { AuthPage } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { EventsList } from './pages/EventsList';
import { CreateEvent } from './pages/CreateEvent';
import { EventDetails } from './pages/EventDetails';
import { PublicRegister } from './pages/PublicRegister';
import { PublicFeedback } from './pages/PublicFeedback';
import { CertificateVerify } from './pages/CertificateVerify';

export function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Global AI Copilot Drawer state
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiEventId, setAiEventId] = useState<string | undefined>(undefined);
  const [aiEventName, setAiEventName] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check initial auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAiCopilot = (eventId?: string, eventName?: string) => {
    setAiEventId(eventId);
    setAiEventName(eventName);
    setAiDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">
        Initializing EventFlow AI...
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
        
        <Navbar user={user} onOpenAiAssistant={() => openAiCopilot()} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
          <Routes>
            {/* Public Attendee Routes */}
            <Route path="/register/:eventId" element={<PublicRegister />} />
            <Route path="/feedback/:eventId" element={<PublicFeedback />} />
            <Route path="/verify/:certificateId" element={<CertificateVerify />} />

            {/* Auth Route */}
            <Route path="/auth" element={<AuthPage setUser={setUser} />} />

            {/* Organizer Protected Routes */}
            <Route
              path="/dashboard"
              element={user ? <Dashboard onOpenAiCopilot={openAiCopilot} /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/events"
              element={user ? <EventsList /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/events/new"
              element={user ? <CreateEvent /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/events/:eventId"
              element={user ? <EventDetails onOpenAiCopilot={openAiCopilot} /> : <Navigate to="/auth" replace />}
            />

            {/* Default Fallback */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
          </Routes>
        </main>

        <AIAssistantDrawer
          isOpen={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          eventId={aiEventId}
          eventName={aiEventName}
        />

        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 glass-panel mt-auto">
          EventFlow AI 2.5 • Real-time Event Operations & Intelligence Platform
        </footer>

      </div>
    </Router>
  );
}

export default App;
