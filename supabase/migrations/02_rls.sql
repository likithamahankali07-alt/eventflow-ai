-- EventFlow AI - Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_activity ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profile creation on signup" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Events Policies
CREATE POLICY "Public can view active events for registration" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers can insert events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update own events" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete own events" ON public.events FOR DELETE USING (auth.uid() = organizer_id);

-- 3. Participants Policies
CREATE POLICY "Public can insert participant record on registration" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizers can view participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Organizers can update participants" ON public.participants FOR UPDATE USING (true);

-- 4. Registrations Policies
CREATE POLICY "Public can create registration" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view registration by token" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Organizers can view all registrations for their events" ON public.registrations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()
    )
);

-- 5. Attendance Policies
CREATE POLICY "Organizers can view and record attendance" ON public.attendance FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.events WHERE events.id = attendance.event_id AND events.organizer_id = auth.uid()
    )
);

-- 6. Feedback Policies
CREATE POLICY "Public can submit feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizers can view feedback for their events" ON public.feedback FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events WHERE events.id = feedback.event_id AND events.organizer_id = auth.uid()
    )
);

-- 7. Certificates Policies
CREATE POLICY "Public can verify valid certificates" ON public.certificates FOR SELECT USING (status = 'generated');
CREATE POLICY "Organizers can manage certificates" ON public.certificates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.events WHERE events.id = certificates.event_id AND events.organizer_id = auth.uid()
    )
);

-- 8. Event Activity Policies
CREATE POLICY "Organizers can view activity for their events" ON public.event_activity FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events WHERE events.id = event_activity.event_id AND events.organizer_id = auth.uid()
    )
);
CREATE POLICY "Organizers can create activity logs" ON public.event_activity FOR INSERT WITH CHECK (true);
