import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Users, Type, AlignLeft, 
  ArrowLeft, CheckCircle2, Globe, HelpCircle, Plus, Trash2, Tag
} from 'lucide-react';
import { eventApi } from '../lib/api';

interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  required: boolean;
  options?: string;
}

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'workshop',
    audience_type: 'general', // 'general' | 'student'
    date: '',
    start_time: '10:00',
    end_time: '17:00',
    venue: '',
    capacity: 100,
    registration_deadline: '',
  });

  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'select' | 'checkbox'>('text');
  const [newQuestionRequired, setNewQuestionRequired] = useState(false);
  const [newQuestionOptions, setNewQuestionOptions] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const addCustomQuestion = () => {
    if (!newQuestionLabel.trim()) return;
    const q: CustomQuestion = {
      id: 'q_' + Date.now(),
      label: newQuestionLabel.trim(),
      type: newQuestionType,
      required: newQuestionRequired,
      options: newQuestionType === 'select' ? newQuestionOptions : undefined,
    };
    setCustomQuestions([...customQuestions, q]);
    setNewQuestionLabel('');
    setNewQuestionOptions('');
    setNewQuestionRequired(false);
  };

  const removeCustomQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  };

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

      const deadline = formData.registration_deadline || `${formData.date}T23:59:00Z`;

      const formattedQuestions = customQuestions.map(q => ({
        id: q.id,
        label: q.label,
        type: q.type,
        required: q.required,
        options: q.options ? q.options.split(',').map(s => s.trim()).filter(Boolean) : [],
      }));

      const payload = {
        ...formData,
        registration_deadline: deadline,
        custom_questions: formattedQuestions.length > 0 ? formattedQuestions : null,
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
          <p className="text-xs text-slate-400">Configure parameters, audience type, custom questions, and registration workflow</p>
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
                  placeholder="e.g. AI Product Summit 2026 / GDG Cloud Workshop / Annual Cultural Fest"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Event Format / Category *</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="workshop">Hands-on Workshop</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="conference">Tech / Industry Conference</option>
                  <option value="corporate_summit">Corporate Summit / Seminar</option>
                  <option value="webinar">Virtual Webinar / Masterclass</option>
                  <option value="meetup">Community Meetup</option>
                  <option value="cultural_fest">Cultural Fest / Arts & Music</option>
                  <option value="networking_mixer">Networking Mixer / Social</option>
                  <option value="sports_event">Sports / Esports Tournament</option>
                  <option value="contest">Contest / Competition</option>
                  <option value="launch_event">Product Launch / Showcase</option>
                  <option value="other">Other Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Max Capacity *</label>
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

            {/* Audience Type */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Audience *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, audience_type: 'general' })}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    formData.audience_type === 'general'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">General & Professional</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Collects Name, Email, Phone, Company/Organization, and Job Role.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, audience_type: 'student' })}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    formData.audience_type === 'student'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Student & Academic</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Collects Name, Email, Phone, College/University, Branch, and Academic Year.</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Event Description *</label>
              <div className="relative">
                <AlignLeft className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide key schedule details, prerequisites, speaker highlights, agenda, and takeaways..."
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
                  placeholder="e.g. Grand Convention Center / Hall 4 / Virtual via Google Meet"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Custom Registration Questions */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">3. Custom Registration Questions</h2>
                <p className="text-[11px] text-slate-400">Add bespoke questions for your attendees (e.g. dietary preference, T-shirt size, GitHub link)</p>
              </div>
              <span className="text-[11px] text-slate-500">{customQuestions.length} added</span>
            </div>

            {/* Existing Questions List */}
            {customQuestions.length > 0 && (
              <div className="space-y-2">
                {customQuestions.map((q) => (
                  <div key={q.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white flex items-center gap-2">
                        {q.label}
                        {q.required && <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">Required</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        Type: {q.type} {q.options && `(Options: ${q.options})`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomQuestion(q.id)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Question Row */}
            <div className="p-3 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Question (e.g. T-Shirt Size, GitHub URL)"
                  value={newQuestionLabel}
                  onChange={(e) => setNewQuestionLabel(e.target.value)}
                  className="sm:col-span-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <select
                  value={newQuestionType}
                  onChange={(e) => setNewQuestionType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="text">Text Input</option>
                  <option value="select">Dropdown Select</option>
                  <option value="checkbox">Yes/No Checkbox</option>
                </select>
              </div>

              {newQuestionType === 'select' && (
                <input
                  type="text"
                  placeholder="Comma-separated options (e.g. S, M, L, XL, XXL)"
                  value={newQuestionOptions}
                  onChange={(e) => setNewQuestionOptions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newQuestionRequired}
                    onChange={(e) => setNewQuestionRequired(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Mandatory field</span>
                </label>
                <button
                  type="button"
                  onClick={addCustomQuestion}
                  disabled={!newQuestionLabel.trim()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
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
