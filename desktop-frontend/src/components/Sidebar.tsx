import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Sparkles,
    Camera,
    Trophy,
    Clock,
    LineChart,
    BookOpen,
    Utensils,
    Lightbulb,
    Stethoscope,
    Library,
    Users,
    FileText,
    Baby,
    UserCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Profile', path: '/profile', icon: UserCircle },
    { name: 'Insights', path: '/insights', icon: Sparkles },
    { name: 'Analysis', path: '/analysis', icon: Camera },
    { name: 'Milestones', path: '/milestones', icon: Trophy },
    { name: 'Timeline', path: '/timeline', icon: Clock },
    { name: 'Growth Charts', path: '/growth', icon: LineChart },
    { name: 'Stories', path: '/stories', icon: BookOpen },
    { name: 'Recipes', path: '/recipes', icon: Utensils },
    { name: 'Recommendations', path: '/recommendations', icon: Lightbulb },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'WHO Evidence', path: '/who-evidence', icon: BookOpen },
    { name: 'Health Hub', path: '/health-hub', icon: Stethoscope },
    { name: 'Resources', path: '/resources', icon: Library },
];

export default function Sidebar() {
    const location = useLocation();
    const { user } = useAuth();

    return (
        <div className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col py-6 px-4 shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 px-2 mb-8">
                <Baby fill="currentColor" className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
                <span className="font-heading text-2xl font-bold text-emerald-500">TinySteps</span>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={twMerge(
                                clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200",
                                    isActive
                                        ? "bg-emerald-50 text-emerald-600 font-semibold"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
                                )
                            )}
                        >
                            <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-sm">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-[18px] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-sm">
                    {user?.name?.charAt(0) || 'P'}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'Parent'}</span>
                    <span className="text-xs text-gray-500 truncate">{user?.email || 'parent@example.com'}</span>
                </div>
            </div>
        </div>
    );
}
