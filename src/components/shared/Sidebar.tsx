'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  GraduationCap,
  BookOpen,
  Calendar,
  Users,
  UserCog,
  ClipboardList,
  Trophy,
  Megaphone,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  role: 'student' | 'teacher' | 'admin';
}

const studentLinks = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/student/exams', label: 'Exams', icon: FileText },
  { href: '/student/grades', label: 'Grades', icon: GraduationCap },
];

const teacherLinks = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarCheck },
  { href: '/teacher/exams', label: 'Exams', icon: BookOpen },
  { href: '/teacher/grades', label: 'Grades', icon: Trophy },
  { href: '/teacher/events', label: 'Events', icon: Calendar },
];

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/teachers', label: 'Teachers', icon: UserCog },
  { href: '/admin/attendance', label: 'Attendance', icon: ClipboardList },
  { href: '/admin/grades', label: 'Grades', icon: Trophy },
  { href: '/admin/events', label: 'Events & Notices', icon: Megaphone },
];

const linksByRole = {
  student: studentLinks,
  teacher: teacherLinks,
  admin: adminLinks,
};

interface SidebarContentProps {
  role: 'student' | 'teacher' | 'admin';
  pathname: string;
  onNavigate?: () => void;
}

function SidebarContent({ role, pathname, onNavigate }: SidebarContentProps) {
  const links = linksByRole[role];
  
  return (
    <nav className="flex flex-col gap-1 p-4">
      <div className="flex items-center gap-2 px-3 py-4 mb-4">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-gray-900">EduPortal</span>
      </div>
      
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="w-5 h-5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-[#F9FAFB] border-r z-50 transform transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent role={role} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-[#F9FAFB] border-r flex-col">
        <SidebarContent role={role} pathname={pathname} />
      </aside>
    </>
  );
}
