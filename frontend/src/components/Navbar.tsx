import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Calendar, PlusCircle, LayoutDashboard, LogOut, ShieldCheck, Zap, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  user: any;
  onOpenAiAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onOpenAiAssistant }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight gradient-text">EventFlow</span>
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 rounded-full">AI Workspace</span>
          </div>
        </Link>

        {/* Navigation Links */}
        {user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/dashboard')
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              to="/events"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/events')
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </Link>

            <Link
              to="/ai-workspace"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/ai-workspace')
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">AI Workspace</span>
            </Link>

            <Link
              to="/events/new"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </Link>

            <div className="h-6 w-[1px] bg-slate-800 mx-1 sm:mx-2" />

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Organizer Login</span>
          </Link>
        )}

      </div>
    </nav>
  );
};
