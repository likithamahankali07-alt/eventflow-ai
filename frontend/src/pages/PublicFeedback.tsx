import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { feedbackApi } from '../lib/api';

export const PublicFeedback: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [ratings, setRatings] = useState({
    overall_rating: 5,
    content_rating: 5,
    speaker_rating: 5,
    organization_rating: 5,
    hands_on_rating: 5,
  });

  const [comments, setComments] = useState({
    participant_email: '',
    liked: '',
    improvement: '',
    future_topic: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      await feedbackApi.submitFeedback(eventId, {
        ...ratings,
        ...comments,
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarPicker = (category: keyof typeof ratings, label: string) => {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-medium text-slate-300">
          <span>{label}</span>
          <span className="text-amber-400 font-bold">{ratings[category]} / 5</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRatings({ ...ratings, [category]: star })}
              className={`p-2 rounded-xl border transition-all ${
                ratings[category] >= star
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
              }`}
            >
              <Star className="w-5 h-5 fill-current" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md text-center space-y-4 border border-emerald-500/30">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Feedback Submitted!</h2>
          <p className="text-xs text-slate-400">
            Thank you for sharing your thoughts. Your responses help organizers improve future workshops and tech meetups.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Event Feedback & Rating</h1>
          <p className="text-xs text-slate-400">Rate your experience and share recommendations</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {renderStarPicker('overall_rating', 'Overall Event Experience')}
            {renderStarPicker('content_rating', 'Session Content & Clarity')}
            {renderStarPicker('speaker_rating', 'Speaker & Instructor Quality')}
            {renderStarPicker('organization_rating', 'Venue & Event Organization')}
            {renderStarPicker('hands_on_rating', 'Hands-on Code / Activity Value')}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email (Optional)</label>
              <input
                type="email"
                value={comments.participant_email}
                onChange={(e) => setComments({ ...comments, participant_email: e.target.value })}
                placeholder="your.email@college.edu"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">What did you enjoy most?</label>
              <textarea
                rows={2}
                value={comments.liked}
                onChange={(e) => setComments({ ...comments, liked: e.target.value })}
                placeholder="Great explanation of Gemini API function calling..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Areas for improvement?</label>
              <textarea
                rows={2}
                value={comments.improvement}
                onChange={(e) => setComments({ ...comments, improvement: e.target.value })}
                placeholder="Pacing, microphone audio, Q&A time..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

      </div>
    </div>
  );
};
