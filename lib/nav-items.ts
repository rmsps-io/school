// ── Sidebar nav items per role ───────────────────────────────
// icon = lucide-react icon name (string), resolved in Sidebar component

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/admin',                  icon: 'LayoutDashboard' },
  { label: 'User Management',href: '/admin/users',            icon: 'ShieldCheck'     },
  { label: 'Requests',       href: '/admin/requests',         icon: 'ClipboardList'   },
  { label: 'Students',       href: '/admin/students',         icon: 'GraduationCap'   },
  { label: 'Teachers',       href: '/admin/teachers',         icon: 'Users'           },
  { label: 'Classes',        href: '/admin/classes',          icon: 'School'          },
  { label: 'Subjects',       href: '/admin/subjects',         icon: 'BookOpen'        },
  { label: 'Timetable',      href: '/admin/timetable',        icon: 'Calendar'        },
  { label: 'Exams',          href: '/admin/exams',            icon: 'ClipboardList'   },
  { label: 'Results',        href: '/admin/results',          icon: 'BarChart2'       },
  { label: 'Attendance',     href: '/admin/attendance',       icon: 'CalendarCheck'   },
  { label: 'Fees',           href: '/admin/fees',             icon: 'IndianRupee'     },
  { label: 'Payments',       href: '/admin/payments',         icon: 'CreditCard'      },
  { label: 'Announcements',  href: '/admin/announcements',    icon: 'Megaphone'       },
  { label: 'Messages',       href: '/admin/messages',         icon: 'MessageSquare'   },
  { label: 'Audit Logs',     href: '/admin/audit',            icon: 'ShieldCheck'     },
]

export const TEACHER_NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/teacher',              icon: 'LayoutDashboard' },
  { label: 'My Classes',   href: '/teacher/classes',      icon: 'School'         },
  { label: 'Attendance',   href: '/teacher/attendance',   icon: 'CalendarCheck'  },
  { label: 'Assignments',  href: '/teacher/assignments',  icon: 'ClipboardList'  },
  { label: 'Results',      href: '/teacher/results',      icon: 'BarChart2'      },
  { label: 'Timetable',    href: '/teacher/timetable',    icon: 'Calendar'       },
  { label: 'Announcements',href: '/teacher/announcements',icon: 'Megaphone'      },
  { label: 'Messages',     href: '/teacher/messages',     icon: 'MessageSquare'  },
]

export const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/student',              icon: 'LayoutDashboard' },
  { label: 'Attendance',   href: '/student/attendance',   icon: 'CalendarCheck'  },
  { label: 'Assignments',  href: '/student/assignments',  icon: 'ClipboardList'  },
  { label: 'Results',      href: '/student/results',      icon: 'BarChart2'      },
  { label: 'Timetable',    href: '/student/timetable',    icon: 'Calendar'       },
  { label: 'Fees',         href: '/student/fees',         icon: 'IndianRupee'    },
  { label: 'Announcements',href: '/student/announcements',icon: 'Megaphone'      },
  { label: 'Messages',     href: '/student/messages',     icon: 'MessageSquare'  },
]

export const PARENT_NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/parent',               icon: 'LayoutDashboard' },
  { label: 'My Child',     href: '/parent/child',         icon: 'GraduationCap'  },
  { label: 'Attendance',   href: '/parent/attendance',    icon: 'CalendarCheck'  },
  { label: 'Results',      href: '/parent/results',       icon: 'BarChart2'      },
  { label: 'Fees',         href: '/parent/fees',          icon: 'IndianRupee'    },
  { label: 'Announcements',href: '/parent/announcements', icon: 'Megaphone'      },
  { label: 'Messages',     href: '/parent/messages',      icon: 'MessageSquare'  },
]
