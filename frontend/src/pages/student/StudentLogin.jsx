import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  ArrowRight, 
  Sparkles,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import studentService from '../../services/studentService';

/**
 * StudentLogin Component
 * Provides a dedicated, student-friendly authentication portal.
 * Authenticates via admission_number and password/pin.
 */
const StudentLogin = () => {
  const navigate = useNavigate();

  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Handle student login submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!admissionNumber.trim() || !password.trim()) {
      toast.error('Please enter both your Admission Number and Password/PIN.');
      return;
    }

    setLoading(true);

    try {
      const data = await studentService.studentLogin(
        admissionNumber.trim(),
        password.trim()
      );

      // Securely store authentication token and student profile
      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('student', JSON.stringify(data.student));
        localStorage.setItem('user', JSON.stringify({
          ...data.student,
          role: 'student'
        }));

        toast.success(`Welcome back, ${data.student?.first_name || data.student?.name}!`);
        navigate('/student/dashboard');
      } else {
        toast.error('Login succeeded but failed to receive access token.');
      }
    } catch (err) {
      console.error('Student login error:', err);
      const message = err?.response?.data?.message || 'Invalid admission number or password/PIN.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick fill for demo or testing convenience
   */
  const handleQuickDemo = (admNo, pass) => {
    setAdmissionNumber(admNo);
    setPassword(pass);
    toast.info(`Filled credentials for ${admNo}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/80 rounded-3xl p-8 shadow-2xl relative z-10 transition-all">
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4 animate-bounce duration-1000">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Student Portal
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-300 dark:text-slate-400 mt-1.5">
            Log in with your school admission number to access your report card.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Admission Number Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200">
              Admission Number
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="e.g. STD/2024/001"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Password / PIN Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200">
                Password or PIN
              </label>
              <span className="text-[11px] text-slate-400">Default: 123456</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your student password or PIN"
                className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Student Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Login Helpers */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-[11px] text-slate-400 text-center mb-2.5 flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3 text-indigo-400" /> Demo Student Credentials:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleQuickDemo('STD/2024/001', '123456')}
              className="px-2.5 py-1 text-[11px] font-mono bg-white/5 hover:bg-white/10 text-indigo-300 rounded-lg border border-white/10 transition-colors"
            >
              STD/2024/001 (123456)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('STD/2024/002', '123456')}
              className="px-2.5 py-1 text-[11px] font-mono bg-white/5 hover:bg-white/10 text-indigo-300 rounded-lg border border-white/10 transition-colors"
            >
              STD/2024/002 (123456)
            </button>
          </div>
        </div>

        {/* Link back to Staff / Admin Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Staff & Administrator Login &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
