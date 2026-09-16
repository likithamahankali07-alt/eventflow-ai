import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, Calendar, MapPin, Users, ArrowUpRight, Filter, AlertCircle } from 'lucide-react';
import { eventApi } from '../lib/api';

export const EventsList: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventApi.getEvents();
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || evt.event_type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Event Operations</h1>
          <p className="text-xs text-slate-400">All published, upcoming, and completed events</p>
        </div>

        <Link
          to="/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Event</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by name, venue, description..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="workshop">Workshop</option>
            <option value="hackathon">Hackathon</option>
            <option value="seminar">Seminar</option>
            <option value="meetup">Meetup</option>
            <option value="contest">Contest</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl">
          Fetching events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No events found</h3>
          <p className="text-xs text-slate-400">
            {events.length === 0
              ? "You haven't created any events yet."
              : 'No events match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-950 border border-blue-800 text-blue-300">
                    {evt.event_type}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-400">
                    ● {evt.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-base">{evt.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{evt.date} • {evt.start_time} - {evt.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Capacity: {evt.capacity} seats</span>
                  </div>
                </div>

                <Link
                  to={`/events/${evt.id}`}
                  className="w-full py-2 px-3 text-center rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold text-xs border border-blue-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Manage Event</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
