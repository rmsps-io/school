// ============================================================
// RMSPS - TypeScript Types
// ============================================================

export type Role = 'admin' | 'teacher' | 'student' | 'parent'

export interface Profile {
  id: string
  role_id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  roles?: { name: Role }
}

export interface Student {
  id: string
  profile_id: string
  admission_no: string
  roll_no: string | null
  section_id: string
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  blood_group: string | null
  address: string | null
  admission_date: string
  academic_year: string
  is_active: boolean
  created_at: string
  updated_at: string
  profiles?: Profile
  sections?: Section & { classes?: Class }
}

export interface Teacher {
  id: string
  profile_id: string
  employee_id: string
  qualification: string | null
  experience_yrs: number
  joining_date: string
  salary: number | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Parent {
  id: string
  profile_id: string
  student_id: string
  relation: 'father' | 'mother' | 'guardian'
  occupation: string | null
  annual_income: number | null
  created_at: string
  updated_at: string
  profiles?: Profile
  students?: Student
}

export interface Class {
  id: string
  name: string
  numeric_val: number
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  class_id: string
  name: string
  capacity: number
  created_at: string
  updated_at: string
  classes?: Class
}

export interface Subject {
  id: string
  name: string
  code: string
  class_id: string
  full_marks: number
  pass_marks: number
  created_at: string
  updated_at: string
  classes?: Class
}

export interface Attendance {
  id: string
  student_id: string
  section_id: string
  teacher_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'holiday'
  remarks: string | null
  created_at: string
  updated_at: string
}

export interface Exam {
  id: string
  name: string
  exam_type: 'unit_test' | 'half_yearly' | 'annual' | 'pre_board' | 'other'
  class_id: string
  start_date: string
  end_date: string
  academic_year: string
  is_published: boolean
  created_at: string
  updated_at: string
  classes?: Class
}

export interface Result {
  id: string
  student_id: string
  exam_id: string
  subject_id: string
  marks_obtained: number
  full_marks: number
  grade: string | null
  remarks: string | null
  entered_by: string
  created_at: string
  updated_at: string
  students?: Student
  exams?: Exam
  subjects?: Subject
}

export interface Assignment {
  id: string
  title: string
  description: string | null
  subject_id: string
  section_id: string
  teacher_id: string
  due_date: string
  max_marks: number
  file_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  subjects?: Subject
  sections?: Section
  teachers?: Teacher
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'general' | 'exam' | 'holiday' | 'event' | 'urgent' | 'fee'
  target_role: Role | 'all' | null
  class_id: string | null
  attachment: string | null
  is_published: boolean
  published_at: string | null
  expires_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'success' | 'error' | 'reminder'
  is_read: boolean
  link: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Fee {
  id: string
  class_id: string
  fee_type: 'tuition' | 'hostel' | 'transport' | 'library' | 'lab' | 'sports' | 'other'
  amount: number
  frequency: 'monthly' | 'quarterly' | 'half_yearly' | 'annual' | 'one_time'
  academic_year: string
  description: string | null
  created_at: string
  updated_at: string
  classes?: Class
}

export interface Payment {
  id: string
  student_id: string
  fee_id: string
  amount_paid: number
  payment_date: string
  payment_method: 'cash' | 'online' | 'cheque' | 'dd' | 'razorpay'
  transaction_id: string | null
  razorpay_order_id: string | null
  razorpay_pay_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  receipt_no: string | null
  remarks: string | null
  collected_by: string | null
  created_at: string
  updated_at: string
  students?: Student
  fees?: Fee
}

// Dashboard stats types
export interface AdminStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalRevenue: number
  presentToday: number
  pendingFees: number
  activeAnnouncements: number
  pendingAssignments: number
}

// Nav item type for sidebar
export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}
