-- ============================================================
-- RMSPS - Phase 1: Row Level Security Policies
-- Run this SECOND in Supabase SQL Editor (after schema.sql)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's role name
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT r.name
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_user_role() = 'admin'
$$;

-- Check if current user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_user_role() = 'teacher'
$$;

-- Check if current user is student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_user_role() = 'student'
$$;

-- Check if current user is parent
CREATE OR REPLACE FUNCTION public.is_parent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_user_role() = 'parent'
$$;

-- ============================================================
-- ROLES TABLE POLICIES
-- ============================================================
CREATE POLICY "roles_select_all_authenticated"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- PROFILES TABLE POLICIES
-- ============================================================

-- Users can view their own profile; admin can view all
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR public.is_admin()
  );

-- Users can update their own profile; admin can update all
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR public.is_admin()
  );

-- Only admin can insert profiles
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admin can delete profiles
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- CLASSES TABLE POLICIES
-- ============================================================
CREATE POLICY "classes_select_authenticated"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "classes_insert_admin"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "classes_update_admin"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "classes_delete_admin"
  ON public.classes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- SECTIONS TABLE POLICIES
-- ============================================================
CREATE POLICY "sections_select_authenticated"
  ON public.sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sections_insert_admin"
  ON public.sections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "sections_update_admin"
  ON public.sections FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "sections_delete_admin"
  ON public.sections FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- SUBJECTS TABLE POLICIES
-- ============================================================
CREATE POLICY "subjects_select_authenticated"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "subjects_insert_admin"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "subjects_update_admin"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "subjects_delete_admin"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- TEACHERS TABLE POLICIES
-- ============================================================

-- Admin sees all, teacher sees own record
CREATE POLICY "teachers_select"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR profile_id = auth.uid()
    OR public.is_student()
    OR public.is_parent()
  );

CREATE POLICY "teachers_insert_admin"
  ON public.teachers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "teachers_update"
  ON public.teachers FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR profile_id = auth.uid());

CREATE POLICY "teachers_delete_admin"
  ON public.teachers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- TEACHER_SUBJECTS TABLE POLICIES
-- ============================================================
CREATE POLICY "teacher_subjects_select"
  ON public.teacher_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teacher_subjects_insert_admin"
  ON public.teacher_subjects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "teacher_subjects_delete_admin"
  ON public.teacher_subjects FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- STUDENTS TABLE POLICIES
-- ============================================================

-- Admin sees all; teacher sees students in their section
-- Student sees own record; parent sees their child
CREATE POLICY "students_select"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR profile_id = auth.uid()
    OR (
      public.is_teacher()
      AND section_id IN (
        SELECT ts.section_id FROM public.teacher_subjects ts
        JOIN public.teachers t ON t.id = ts.teacher_id
        WHERE t.profile_id = auth.uid()
      )
    )
    OR (
      public.is_parent()
      AND id IN (
        SELECT p.student_id FROM public.parents p
        JOIN public.profiles pr ON pr.id = p.profile_id
        WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "students_insert_admin"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "students_update"
  ON public.students FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR profile_id = auth.uid());

CREATE POLICY "students_delete_admin"
  ON public.students FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- PARENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "parents_select"
  ON public.parents FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR profile_id = auth.uid()
    OR (
      public.is_student()
      AND student_id IN (
        SELECT s.id FROM public.students s WHERE s.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "parents_insert_admin"
  ON public.parents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "parents_update"
  ON public.parents FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR profile_id = auth.uid());

CREATE POLICY "parents_delete_admin"
  ON public.parents FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- ATTENDANCE TABLE POLICIES
-- ============================================================
CREATE POLICY "attendance_select"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_teacher()
      AND section_id IN (
        SELECT ts.section_id FROM public.teacher_subjects ts
        JOIN public.teachers t ON t.id = ts.teacher_id
        WHERE t.profile_id = auth.uid()
      )
    )
    OR (
      public.is_student()
      AND student_id IN (
        SELECT s.id FROM public.students s WHERE s.profile_id = auth.uid()
      )
    )
    OR (
      public.is_parent()
      AND student_id IN (
        SELECT p.student_id FROM public.parents p
        JOIN public.profiles pr ON pr.id = p.profile_id
        WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "attendance_insert_teacher"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_teacher()
      AND section_id IN (
        SELECT ts.section_id FROM public.teacher_subjects ts
        JOIN public.teachers t ON t.id = ts.teacher_id
        WHERE t.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "attendance_update_teacher"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_teacher()
      AND section_id IN (
        SELECT ts.section_id FROM public.teacher_subjects ts
        JOIN public.teachers t ON t.id = ts.teacher_id
        WHERE t.profile_id = auth.uid()
      )
    )
  );

-- ============================================================
-- EXAMS TABLE POLICIES
-- ============================================================
CREATE POLICY "exams_select"
  ON public.exams FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR is_published = TRUE
  );

CREATE POLICY "exams_insert_admin"
  ON public.exams FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "exams_update_admin"
  ON public.exams FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "exams_delete_admin"
  ON public.exams FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- RESULTS TABLE POLICIES
-- ============================================================
CREATE POLICY "results_select"
  ON public.results FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR (
      public.is_student()
      AND student_id IN (
        SELECT s.id FROM public.students s WHERE s.profile_id = auth.uid()
      )
    )
    OR (
      public.is_parent()
      AND student_id IN (
        SELECT p.student_id FROM public.parents p
        JOIN public.profiles pr ON pr.id = p.profile_id
        WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "results_insert_teacher"
  ON public.results FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "results_update_teacher"
  ON public.results FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_teacher());

-- ============================================================
-- ASSIGNMENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "assignments_select"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR (
      public.is_student()
      AND section_id IN (
        SELECT s.section_id FROM public.students s WHERE s.profile_id = auth.uid()
      )
    )
    OR (
      public.is_parent()
      AND section_id IN (
        SELECT s.section_id FROM public.students s
        JOIN public.parents pa ON pa.student_id = s.id
        JOIN public.profiles pr ON pr.id = pa.profile_id
        WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "assignments_insert_teacher"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "assignments_update_teacher"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "assignments_delete_teacher"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (public.is_admin() OR public.is_teacher());

-- ============================================================
-- SUBMISSIONS TABLE POLICIES
-- ============================================================
CREATE POLICY "submissions_select"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR (
      public.is_student()
      AND student_id IN (
        SELECT s.id FROM public.students s WHERE s.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "submissions_insert_student"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_student()
      AND student_id IN (
        SELECT s.id FROM public.students s WHERE s.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "submissions_update"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR (
      public.is_student()
      AND student_id IN (
        SELECT s.id FROM public.students s WHERE s.profile_id = auth.uid()
      )
    )
  );

-- ============================================================
-- FEES TABLE POLICIES
-- ============================================================
CREATE POLICY "fees_select"
  ON public.fees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "fees_insert_admin"
  ON public.fees FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "fees_update_admin"
  ON public.fees FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- PAYMENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "payments_select"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_student()
      AND student_id IN (
        SELECT s.id FROM public.students s WHERE s.profile_id = auth.uid()
      )
    )
    OR (
      public.is_parent()
      AND student_id IN (
        SELECT p.student_id FROM public.parents p
        JOIN public.profiles pr ON pr.id = p.profile_id
        WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "payments_insert_admin"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "payments_update_admin"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- ANNOUNCEMENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "announcements_select"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    is_published = TRUE
    AND (
      target_role = 'all'
      OR target_role = public.get_user_role()
      OR public.is_admin()
    )
    AND (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "announcements_insert_admin_teacher"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "announcements_update_admin"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

CREATE POLICY "announcements_delete_admin"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

-- ============================================================
-- TIMETABLE TABLE POLICIES
-- ============================================================
CREATE POLICY "timetable_select_authenticated"
  ON public.timetable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "timetable_insert_admin"
  ON public.timetable FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "timetable_update_admin"
  ON public.timetable FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "timetable_delete_admin"
  ON public.timetable FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "notifications_insert_system"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- MESSAGES TABLE POLICIES
-- ============================================================
CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_insert_authenticated"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update_own"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================================
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "audit_logs_insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
