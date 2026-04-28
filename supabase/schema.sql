-- ============================================================
-- RMSPS - Residential Maa Saraswati Public School
-- Phase 1: Complete Database Schema
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE CHECK (name IN ('admin', 'teacher', 'student', 'parent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed roles
INSERT INTO public.roles (name) VALUES
  ('admin'), ('teacher'), ('student'), ('parent')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. PROFILES TABLE (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id      UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  avatar_url   TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email   ON public.profiles(email);

-- ============================================================
-- 3. CLASSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  numeric_val INTEGER NOT NULL CHECK (numeric_val BETWEEN 1 AND 12),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name)
);

-- ============================================================
-- 4. SECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (name IN ('A','B','C','D','E')),
  capacity   INTEGER NOT NULL DEFAULT 40 CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sections_class_id ON public.sections(class_id);

-- ============================================================
-- 5. SUBJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  full_marks  INTEGER NOT NULL DEFAULT 100 CHECK (full_marks > 0),
  pass_marks  INTEGER NOT NULL DEFAULT 33 CHECK (pass_marks > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON public.subjects(class_id);

-- ============================================================
-- 6. TEACHERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id    TEXT NOT NULL UNIQUE,
  qualification  TEXT,
  experience_yrs INTEGER DEFAULT 0 CHECK (experience_yrs >= 0),
  joining_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  salary         NUMERIC(10,2) CHECK (salary >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_profile_id ON public.teachers(profile_id);

-- ============================================================
-- 7. TEACHER SUBJECTS (which teacher teaches which subject)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  section_id  UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, subject_id, section_id)
);

-- ============================================================
-- 8. STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  admission_no     TEXT NOT NULL UNIQUE,
  roll_no          TEXT,
  section_id       UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
  date_of_birth    DATE,
  gender           TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_group      TEXT CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  address          TEXT,
  admission_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  academic_year    TEXT NOT NULL DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY'),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_profile_id  ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_section_id  ON public.students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON public.students(admission_no);

-- ============================================================
-- 9. PARENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relation      TEXT NOT NULL CHECK (relation IN ('father','mother','guardian')),
  occupation    TEXT,
  annual_income NUMERIC(12,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parents_profile_id ON public.parents(profile_id);
CREATE INDEX IF NOT EXISTS idx_parents_student_id ON public.parents(student_id);

-- ============================================================
-- 10. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  section_id  UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT NOT NULL CHECK (status IN ('present','absent','late','holiday')),
  remarks     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date       ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_section_id ON public.attendance(section_id);

-- ============================================================
-- 11. EXAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  exam_type     TEXT NOT NULL CHECK (exam_type IN ('unit_test','half_yearly','annual','pre_board','other')),
  class_id      UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  academic_year TEXT NOT NULL DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY'),
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_exams_class_id ON public.exams(class_id);

-- ============================================================
-- 12. RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id          UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id       UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  marks_obtained   NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
  full_marks       INTEGER NOT NULL DEFAULT 100,
  grade            TEXT,
  remarks          TEXT,
  entered_by       UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, exam_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_results_student_id ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_id    ON public.results(exam_id);

-- ============================================================
-- 13. ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  subject_id   UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  section_id   UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  teacher_id   UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  due_date     TIMESTAMPTZ NOT NULL,
  max_marks    INTEGER DEFAULT 100 CHECK (max_marks > 0),
  file_url     TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_subject_id  ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_section_id  ON public.assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id  ON public.assignments(teacher_id);

-- ============================================================
-- 14. SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_url        TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  marks_obtained  NUMERIC(5,2) CHECK (marks_obtained >= 0),
  feedback        TEXT,
  status          TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','graded','late','rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id    ON public.submissions(student_id);

-- ============================================================
-- 15. FEES TABLE (fee structure)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  fee_type      TEXT NOT NULL CHECK (fee_type IN ('tuition','hostel','transport','library','lab','sports','other')),
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  frequency     TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly','quarterly','half_yearly','annual','one_time')),
  academic_year TEXT NOT NULL DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY'),
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_class_id ON public.fees(class_id);

-- ============================================================
-- 16. PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_id            UUID NOT NULL REFERENCES public.fees(id) ON DELETE RESTRICT,
  amount_paid       NUMERIC(10,2) NOT NULL CHECK (amount_paid > 0),
  payment_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method    TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','online','cheque','dd','razorpay')),
  transaction_id    TEXT,
  razorpay_order_id TEXT,
  razorpay_pay_id   TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  receipt_no        TEXT UNIQUE,
  remarks           TEXT,
  collected_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id   ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status       ON public.payments(status);

-- ============================================================
-- 17. ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general','exam','holiday','event','urgent','fee')),
  target_role  TEXT CHECK (target_role IN ('admin','teacher','student','parent','all')),
  class_id     UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  attachment   TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_type        ON public.announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_target_role ON public.announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by  ON public.announcements(created_by);

-- ============================================================
-- 18. TIMETABLE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timetable (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  room_no     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  UNIQUE(section_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_timetable_section_id ON public.timetable(section_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_id ON public.timetable(teacher_id);

-- ============================================================
-- 19. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','success','error','reminder')),
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created  ON public.notifications(created_at DESC);

-- ============================================================
-- 20. MESSAGES TABLE (chat system)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at  ON public.messages(created_at DESC);

-- ============================================================
-- 21. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================
-- 22. REGISTRATION REQUESTS (Student self-registration)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  gender          TEXT CHECK (gender IN ('male','female','other')),
  date_of_birth   DATE,
  class_requested TEXT NOT NULL,
  address         TEXT,
  guardian_name   TEXT,
  guardian_phone  TEXT,
  guardian_relation TEXT CHECK (guardian_relation IN ('father','mother','guardian')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_requests_status ON public.registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_reg_requests_email  ON public.registration_requests(email);

-- ============================================================
-- 23. ANNOUNCEMENT REQUESTS (Teacher requests admin to publish)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcement_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general','exam','holiday','event','urgent','fee')),
  target_role  TEXT CHECK (target_role IN ('admin','teacher','student','parent','all')),
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  reviewed_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ann_req_status ON public.announcement_requests(status);
CREATE INDEX IF NOT EXISTS idx_ann_req_by     ON public.announcement_requests(requested_by);

-- ============================================================
-- 24. PROFILE UPDATE REQUESTS (Student/Teacher request data change)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profile_update_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  field_name   TEXT NOT NULL,
  old_value    TEXT,
  new_value    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  reviewed_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_req_profile ON public.profile_update_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_req_status  ON public.profile_update_requests(status);
