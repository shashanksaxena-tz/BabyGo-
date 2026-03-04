import { Search, Bell, ChevronDown } from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function TopBar({ title, subtitle }: { title?: string, subtitle?: string }) {
    const { user } = useAuth();
    const { children, activeChild, setActiveChildId } = useChild();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const formatAge = (dob: string | undefined) => {
        if (!dob) return '';
        const today = new Date();
        const birthDate = new Date(dob);
        let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        let years = Math.floor(months / 12);
        let remainingMonths = months % 12;

        if (years > 0) return `${years}y ${remainingMonths}m`;
        return `${months}m`;
    };

    return (
        <header className="h-20 lg:h-24 px-8 w-full flex items-center justify-between border-b border-gray-200 bg-white/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex flex-col justify-center">
                {title ? (
                    <h1 className="text-xl lg:text-2xl font-bold font-heading text-gray-900">{title}</h1>
                ) : (
                    <h1 className="text-xl lg:text-2xl font-bold font-heading text-gray-900">Good morning, {user?.name?.split(' ')[0] || 'Parent'}</h1>
                )}
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
                {/* Search inside topbar in some screens */}
                <div className="hidden lg:flex items-center bg-gray-100 rounded-xl px-3 py-2 w-64">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none ml-2 text-sm w-full text-gray-700 placeholder-gray-500"
                    />
                </div>

                <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
                    <Bell className="w-5 h-5" />
                </button>

                <div className="relative">
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center h-10 px-3 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition gap-2"
                    >
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                            {activeChild?.name?.charAt(0) || '👶'}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                            {activeChild ? `${activeChild.name}, ${formatAge(activeChild.dateOfBirth)}` : 'Select Child'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>

                    {isDropdownOpen && children.length > 0 && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            {children.map(child => (
                                <button
                                    key={child._id}
                                    onClick={() => {
                                        setActiveChildId(child._id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-emerald-50 transition ${activeChild?._id === child._id ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-700'}`}
                                >
                                    {child.name} ({formatAge(child.dateOfBirth)})
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
