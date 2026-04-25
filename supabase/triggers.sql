-- ============================================================
-- RMSPS - Phase 1: Database Triggers & Functions
-- Run this THIRD in Supabase SQL Editor (after rls.sql)
-- ============================================================

-- ============================================================
-- 1. UPDATED_AT AUTO-TRIGGER
-- ============================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_parents_updated_at
  BEFORE UPDATE ON public.parents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_fees_updated_at
  BEFORE UPDATE ON public.fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_timetable_updated_at
  BEFORE UPDATE ON public.timetable
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
  v_role    TEXT;
BEGIN
  -- Get role from metadata (default: student)
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- Validate role
  IF v_role NOT IN ('admin', 'teacher', 'student', 'parent') THEN
    v_role := 'student';
  END IF;

  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = v_role;

  INSERT INTO public.profiles (id, role_id, full_name, email)
  VALUES (
    NEW.id,
    v_role_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. AUTO-CALCULATE GRADE ON RESULT INSERT/UPDATE
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_grade()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_percent NUMERIC;
BEGIN
  v_percent := (NEW.marks_obtained / NEW.full_marks) * 100;

  NEW.grade := CASE
    WHEN v_percent >= 90 THEN 'A+'
    WHEN v_percent >= 80 THEN 'A'
    WHEN v_percent >= 70 THEN 'B+'
    WHEN v_percent >= 60 THEN 'B'
    WHEN v_percent >= 50 THEN 'C+'
    WHEN v_percent >= 40 THEN 'C'
    WHEN v_percent >= 33 THEN 'D'
    ELSE 'F'
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_grade
  BEFORE INSERT OR UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.calculate_grade();

-- ============================================================
-- 4. AUTO-GENERATE RECEIPT NUMBER FOR PAYMENTS
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.receipt_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_receipt_no()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.receipt_no IS NULL THEN
    NEW.receipt_no := 'RCPT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                      LPAD(nextval('public.receipt_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_receipt_no
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_no();

-- ============================================================
-- 5. AUTO-NOTIFY ON NEW ANNOUNCEMENT
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert notification for each affected user based on target_role
  IF NEW.is_published = TRUE THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT
      p.id,
      '📢 New Announcement: ' || NEW.title,
      LEFT(NEW.content, 120),
      'info',
      '/announcements/' || NEW.id
    FROM public.profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE
      NEW.target_role = 'all'
      OR r.name = NEW.target_role;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_announcement
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_announcement();

-- ============================================================
-- 6. AUDIT LOG TRIGGER (for critical tables)
-- ============================================================

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::JSONB);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW)::JSONB);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit log triggers to critical tables
CREATE TRIGGER trg_audit_students
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_teachers
  AFTER INSERT OR UPDATE OR DELETE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_results
  AFTER INSERT OR UPDATE OR DELETE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

-- ============================================================
-- 7. SUPABASE REALTIME: ENABLE ON KEY TABLES
-- ============================================================

-- Enable realtime on notifications (for live bell icon)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime on messages (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime on attendance (for live attendance tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- ============================================================
-- 8. STORAGE BUCKETS SETUP (run in Supabase dashboard or here)
-- ============================================================

-- NOTE: Run these in Supabase SQL Editor to create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('student-profiles', 'student-profiles', TRUE,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('teacher-profiles', 'teacher-profiles', TRUE,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('assignments',      'assignments',      FALSE, 10485760, ARRAY['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('submissions',      'submissions',      FALSE, 10485760, ARRAY['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('documents',        'documents',        FALSE, 20971520, ARRAY['application/pdf']),
  ('reports',          'reports',          FALSE, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public buckets (profile images readable by all authenticated)
CREATE POLICY "student_profiles_public_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'student-profiles');

CREATE POLICY "student_profiles_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-profiles'
    AND (public.is_admin() OR (storage.foldername(name))[1] = auth.uid()::TEXT)
  );

CREATE POLICY "teacher_profiles_public_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'teacher-profiles');

CREATE POLICY "teacher_profiles_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'teacher-profiles'
    AND (public.is_admin() OR (storage.foldername(name))[1] = auth.uid()::TEXT)
  );

-- Assignments: teacher uploads, students in section can read
CREATE POLICY "assignments_teacher_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assignments' AND public.is_teacher());

CREATE POLICY "assignments_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'assignments');

-- Submissions: students upload, teachers read
CREATE POLICY "submissions_student_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'submissions' AND public.is_student());

CREATE POLICY "submissions_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'submissions'
    AND (public.is_admin() OR public.is_teacher())
  );

-- Documents & Reports: admin only
CREATE POLICY "documents_admin"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id IN ('documents', 'reports') AND public.is_admin())
  WITH CHECK (bucket_id IN ('documents', 'reports') AND public.is_admin());
