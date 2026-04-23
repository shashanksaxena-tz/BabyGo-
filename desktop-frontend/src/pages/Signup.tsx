import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChild } from '../contexts/ChildContext';
import { toast } from 'react-toastify';
import api from '../api';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { refreshChildren } = useChild();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            login(data.token, data.user);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            toast.success('Registration successful!');
            // Wait for children to be fetched before navigating
            // to prevent race condition with ProtectedRoute redirect
            await refreshChildren();
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Registration failed.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-gray-50 items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500 font-bold text-2xl font-heading shadow-sm">
                        B
                    </div>
                    <h2 className="text-2xl font-bold font-heading text-gray-900">Create Account</h2>
                    <p className="text-sm text-gray-500 font-medium">Join BabyGo to track development</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-800 mb-1.5 px-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            placeholder="Priya Sharma"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-800 mb-1.5 px-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-800 mb-1.5 px-1">Password</label>
                        <input
                            type="password"
                            required
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-2 w-full flex justify-center items-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition shadow-[0_4px_12px_rgba(16,185,129,0.2)] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600 font-medium">
                    Already have an account? <Link to="/login" className="text-emerald-500 font-bold hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}
