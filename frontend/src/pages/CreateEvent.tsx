import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Calendar, Clock, MapPin, Users, Type, AlignLeft, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { eventApi } from '../lib/api';

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'workshop',
    date: '',
    start_time: '10:00',
    end_time: '17:00',
    venue: '',
    capacity: 100,
    registration_deadline: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!formData.name || !formData.description || !formData.date || !formData.venue) {
        setErrorMsg('Please fill in all required fields.');
        setLoading(false);
        return;
      }

      // Default registration deadline to event date if not provided
      const deadline = formData.registration_deadline || `${formData.date}T23:59:00Z`;

      const payload = {
        ...formData,
        registration_deadline: deadline,
      };

      const res = await eventApi.createEvent(payload);
      if (res.data && res.data.id) {
        navigate(`/events/${res.data.id}`);
      } else {
        setErrorMsg('Failed to create event. Please try again.');
      }
    } catch (err: any) {
      console.error('Create event error:', err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Error creating event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Create New Event</h1>
          <p className="text-xs text-slate-400">Configure parameters, seating capacity, and public registration link</p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">1. Basic Information</h2>
            
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Event Name *</label>
              <div className="relative">
                <Type className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. GDG Cloud Workshop & AI Hackathon 2026"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Event Type *</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="workshop">Hands-on Workshop</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="seminar">Seminar / Guest Talk</option>
                  <option value="meetup">Community Meetup</option>
                  <option value="contest">Coding Contest</option>
                  <option value="conference">Tech Conference</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Max Seating Capacity *</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Description *</label>
              <div className="relative">
                <AlignLeft className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide schedule details, prerequisites, speaker names, and takeaway skills..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Date, Time & Location */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">2. Schedule & Venue</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Event Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Start Time *</label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">End Time *</label>
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Venue Location *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Main Auditorium, Block C - Campus Hall"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Publishing Event...' : 'Create & Open Command Center'}</span>
          </button>
        </form>
      </div>

    </div>
  );
};
