import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Radio,
  Camera,
  CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

const API_BASE = "http://127.0.0.1:8000/api";

export const StudentLogin: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
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
        body: JSON.stringify({ email: identifier.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (data.user.role !== 'student') {
        setError("Access Restricted: This portal is for students only. Please use a student account.");
        setLoading(false);
        return;
      }

      localStorage.setItem('smartattend_token', data.access_token);
      localStorage.setItem('smartattend_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.access_token);
    } catch (err) {
      setError("Cannot connect to backend server. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (email: string) => {
    setIdentifier(email);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070B19] relative flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Dynamic Ambient Background Glow Elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-transparent rounded-full blur-[120px] pointer-events-none animate-orb-1" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] bg-gradient-to-tl from-cyan-500/25 via-purple-600/20 to-transparent rounded-full blur-[130px] pointer-events-none animate-orb-2" />
      <div className="absolute top-[40%] right-[20%] w-[320px] h-[320px] bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Decorative Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-md w-full relative z-10 space-y-5">
        {/* Top Floating Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/70 shadow-lg backdrop-blur-md text-[11px] font-semibold text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Campus Radar mmWave Gateway Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-400 font-mono">v2.4-AI</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="backdrop-blur-xl bg-slate-900/85 border border-slate-700/80 rounded-3xl p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-slate-100 space-y-6 relative overflow-hidden">
          {/* Subtle Top Gradient Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-600" />

          {/* Brand Header */}
          <div className="text-center space-y-2.5">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/30 border border-blue-400/30">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                SmartAttend <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Student</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Learn • Attend • Grow • AI-Powered Attendance
              </p>
            </div>
          </div>

          {/* Feature Badges Bar */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
            <div className="flex flex-col items-center justify-center text-center p-1">
              <Radio className="w-3.5 h-3.5 text-cyan-400 mb-1" />
              <span className="font-semibold text-[10px]">Radar Sync</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-1 border-x border-slate-700/60">
              <Camera className="w-3.5 h-3.5 text-blue-400 mb-1" />
              <span className="font-semibold text-[10px]">Liveness ID</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mb-1" />
              <span className="font-semibold text-[10px]">Anti-Spoof</span>
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
                <span>Student ID or Email</span>
                <span className="text-[10px] text-slate-500 font-normal">e.g. rahul@smartattend.edu or S101</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter email or Roll No"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 text-white placeholder-slate-500 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 text-white placeholder-slate-500 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating via SmartAttend...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Student Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Accounts */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                One-Click Demo Profiles
              </div>
              <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Instant Login</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('rahul@smartattend.edu')}
                className="p-2.5 bg-slate-800/70 hover:bg-slate-750 border border-slate-700/80 hover:border-blue-500/70 rounded-xl text-left transition-all duration-150 flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-xs text-white truncate group-hover:text-blue-300">Rahul Sharma</div>
                  <div className="text-[10px] text-slate-400 font-mono">Roll: S101 • CSE</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('aditi@smartattend.edu')}
                className="p-2.5 bg-slate-800/70 hover:bg-slate-750 border border-slate-700/80 hover:border-blue-500/70 rounded-xl text-left transition-all duration-150 flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-xs text-white truncate group-hover:text-cyan-300">Aditi Patil</div>
                  <div className="text-[10px] text-slate-400 font-mono">Roll: S102 • CSE</div>
                </div>
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Biometric radar & GPS location auto-verify upon classroom entry</span>
          </div>
        </div>

        {/* Security & Version Footnote */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-3">
          <span>SmartAttend Academic AI</span>
          <span>•</span>
          <span>End-to-End Cryptographic Ledger</span>
        </div>
      </div>
    </div>
  );
};
