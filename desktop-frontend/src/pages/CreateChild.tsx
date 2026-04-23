import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { useChild } from '../contexts/ChildContext';
import { Baby, Calendar, Scale, Ruler, CheckCircle2 } from 'lucide-react';

export default function CreateChild() {
    const [formData, setFormData] = useState({
        name: '',
        dateOfBirth: '',
        gender: 'male',
        weight: '',
        height: '',
        region: 'searo',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { refreshChildren } = useChild();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/children', {
                ...formData,
                weight: parseFloat(formData.weight),
                height: parseFloat(formData.height)
            });
            await refreshChildren();
            toast.success('Child profile created successfully!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create child profile.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-gray-50 items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-2xl bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-50 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm text-4xl">
                            👶
                        </div>
                        <h2 className="text-3xl font-bold font-heading text-gray-900 mb-2">Create Child Profile</h2>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto">Set up your child's profile to get personalized development tracking and insights.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Baby className="w-4 h-4 text-emerald-500" /> Child's Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900"
                                    placeholder="e.g. Leo"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Date of Birth */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-emerald-500" /> Date of Birth
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-800">Gender</label>
                            <div className="flex gap-4">
                                {['male', 'female'].map(g => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: g })}
                                        className={`flex-1 py-3 px-4 rounded-xl border font-bold capitalize transition flex items-center justify-center gap-2 ${formData.gender === g ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {formData.gender === g && <CheckCircle2 className="w-4 h-4" />}
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Weight */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-emerald-500" /> Birth Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900"
                                    placeholder="e.g. 3.5"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>

                            {/* Length */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Ruler className="w-4 h-4 text-emerald-500" /> Birth Length (cm)
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.1"
                                    min="0"
                                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900"
                                    placeholder="e.g. 50"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Region */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-800">Geographic Region</label>
                            <select
                                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 appearance-none font-medium"
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            >
                                <option value="searo">South-East Asia (India, etc.)</option>
                                <option value="amro">Americas (US, Canada, etc.)</option>
                                <option value="euro">Europe</option>
                                <option value="afro">Africa</option>
                                <option value="emro">Eastern Mediterranean</option>
                                <option value="wpro">Western Pacific</option>
                            </select>
                        </div>

                        <div className="border-t border-gray-100 pt-6 mt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center gap-2 bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition shadow-[0_4px_12px_rgba(16,185,129,0.2)] text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Creating Profile...' : 'Create Child Profile'}
                            </button>
                            <p className="text-center text-xs text-gray-400 font-medium mt-4">
                                You can add more children or edit this later in Settings.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
