import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Baby, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import apiService from '../services/apiService';

// ─── Schemas ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

// ─── Props ───────────────────────────────────────────────────────────────────

interface AuthScreenProps {
  onAuthenticated: () => void;
}

// ─── Shared field component ──────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  registration: ReturnType<ReturnType<typeof useForm>['register']>;
  showToggle?: boolean;
  onToggle?: () => void;
}

const Field: React.FC<FieldProps> = ({
  label, error, icon, type = 'text', placeholder, registration, showToggle, onToggle,
}) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      <input
        {...registration}
        type={type}
        placeholder={placeholder}
        className={`w-full pl-10 ${showToggle ? 'pr-10' : 'pr-4'} py-3 rounded-xl border text-sm transition-all outline-none
          ${error
            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
            : 'border-gray-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
          }`}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {type === 'password' ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
    </div>
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
        <AlertCircle size={12} /> {error}
      </p>
    )}
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Login form ──
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // ── Register form ──
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const isSubmitting = loginForm.formState.isSubmitting || registerForm.formState.isSubmitting;

  const handleLogin = async (data: LoginData) => {
    setServerError(null);
    try {
      const result = await apiService.login(data.email, data.password);
      if ((result as any).error) {
        setServerError((result as any).error);
        return;
      }
      onAuthenticated();
    } catch {
      setServerError('Could not connect to the server. Please try again.');
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setServerError(null);
    try {
      const result = await apiService.register(data.email, data.password, data.name);
      if ((result as any).error) {
        setServerError((result as any).error);
        return;
      }
      onAuthenticated();
    } catch {
      setServerError('Could not connect to the server. Please try again.');
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setServerError(null);
    loginForm.reset();
    registerForm.reset();
    setShowPassword(false);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg mb-4">
            <Baby className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
            TinySteps AI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track every milestone, celebrate every moment</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Tab toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-4 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          {/* ── Login form ── */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4" noValidate>
              <Field
                label="Email"
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                type="email"
                error={loginForm.formState.errors.email?.message}
                registration={loginForm.register('email')}
              />
              <Field
                label="Password"
                placeholder="Your password"
                icon={<Lock size={16} />}
                type={showPassword ? 'text' : 'password'}
                error={loginForm.formState.errors.password?.message}
                registration={loginForm.register('password')}
                showToggle
                onToggle={() => setShowPassword(p => !p)}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign In'}
              </button>
            </form>
          )}

          {/* ── Register form ── */}
          {mode === 'register' && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4" noValidate>
              <Field
                label="Your name"
                placeholder="Jane Smith"
                icon={<User size={16} />}
                error={registerForm.formState.errors.name?.message}
                registration={registerForm.register('name')}
              />
              <Field
                label="Email"
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                type="email"
                error={registerForm.formState.errors.email?.message}
                registration={registerForm.register('email')}
              />
              <Field
                label="Password"
                placeholder="At least 6 characters"
                icon={<Lock size={16} />}
                type={showPassword ? 'text' : 'password'}
                error={registerForm.formState.errors.password?.message}
                registration={registerForm.register('password')}
                showToggle
                onToggle={() => setShowPassword(p => !p)}
              />
              <Field
                label="Confirm password"
                placeholder="Repeat your password"
                icon={<Lock size={16} />}
                type={showConfirm ? 'text' : 'password'}
                error={registerForm.formState.errors.confirmPassword?.message}
                registration={registerForm.register('confirmPassword')}
                showToggle
                onToggle={() => setShowConfirm(p => !p)}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your child's data is private and encrypted. No medical advice provided.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
