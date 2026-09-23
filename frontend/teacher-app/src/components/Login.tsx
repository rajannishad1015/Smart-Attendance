import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Radio,
  BarChart3,
  Cpu,
  CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

const API_BASE = "http://127.0.0.1:8000/api";

export const TeacherLogin: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (data.user.role !== 'teacher') {
        setError("Access Restricted: This portal is for instructors/teachers only. Please use an authorized teacher account.");
        setLoading(false);
        return;
      }

      localStorage.setItem('smartattend_teacher_token', data.access_token);
      localStorage.setItem('smartattend_teacher_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.access_token);
    } catch (err) {
      setError("Cannot connect to backend server. Ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('teacher@smartattend.edu');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070B14] relative flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Executive Ambient Glow Mesh */}
      <div className="absolute top-[-10%] right-[-10%] w-[580px] h-[580px] bg-gradient-to-br from-indigo-600/25 via-blue-600/15 to-transparent rounded-full blur-[140px] pointer-events-none animate-float-light" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[580px] h-[580px] bg-gradient-to-tr from-cyan-600/20 via-purple-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Futuristic Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      <div className="max-w-md w-full relative z-10 space-y-5">
        {/* Hardware Status Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md text-[11px] font-semibold text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>Classroom Radar Gateway Beacon</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-mono">Node #01 Online</span>
          </div>
        </div>

        {/* Login Box */}
        <div className="backdrop-blur-2xl bg-slate-900/90 border border-slate-700/80 rounded-3xl p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-slate-100 space-y-6 relative overflow-hidden">
          {/* Top Gradient Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

          {/* Brand Header */}
          <div className="text-center space-y-2.5">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-white">
                <Cpu className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                SmartAttend <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Instructor</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Faculty Command Center • Teach • Track • Inspire
              </p>
            </div>
          </div>

          {/* Capabilities Ticker */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
            <div className="flex flex-col items-center justify-center text-center p-1">
              <Radio className="w-3.5 h-3.5 text-indigo-400 mb-1" />
              <span className="font-semibold text-[10px]">Radar Beam</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-1 border-x border-slate-700/60">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400 mb-1" />
              <span className="font-semibold text-[10px]">ML Anomaly</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-1">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400 mb-1" />
              <span className="font-semibold text-[10px]">Audit Trail</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs font-semibold text-rose-300 flex items-start gap-2.5 animate-pop-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Faculty Email Address</span>
                <span className="text-[10px] text-slate-500 font-normal">teacher@smartattend.edu</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="Enter instructor email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 text-white placeholder-slate-500 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">
                  Default: password123
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 text-white placeholder-slate-500 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Faculty Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Teacher Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Account */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Authorized Faculty Demo Profile
              </div>
              <div className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>1-Click Fill</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickFill}
              className="w-full p-3 bg-slate-800/70 hover:bg-slate-750 border border-slate-700/80 hover:border-indigo-500/70 rounded-xl text-left transition-all duration-150 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-indigo-300">
                    Prof. Aniket Deshmukh
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Dept. of Computer Science & Engineering
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold group-hover:bg-indigo-500/20 transition-colors">
                Apply Demo
              </span>
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Classroom mmWave Radar Hub ready for active session tracking</span>
          </div>
        </div>

        {/* Security & Node Footnote */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-3">
          <span>SmartAttend Faculty OS</span>
          <span>•</span>
          <span>Dual-Verification Anti-Spoof</span>
        </div>
      </div>
    </div>
  );
};
