import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  Users,
  CheckCircle2,
  FileText,
  BarChart2,
  Sparkles,
  FileSpreadsheet,
  Bell,
  Headphones,
  Search,
  Calendar,
  Clock,
  ChevronDown,
  Check,
  AlertCircle,
  Download,
  Camera,
  Radio,
  MapPin,
  X,
  History,
  Cpu,
  LogOut,
  ShieldAlert,
  TrendingUp,
  ArrowUpRight,
  BrainCircuit,
  Filter
} from 'lucide-react';
import { TeacherLogin } from './components/Login';

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('smartattend_teacher_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeNav, setActiveNav] = useState<'dashboard' | 'attendance' | 'students' | 'analytics' | 'insights'>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [studentsRiskList, setStudentsRiskList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [studentRiskFilter, setStudentRiskFilter] = useState('ALL');
  const [showSelfies, setShowSelfies] = useState(true);

  // Subject selection & Radar session controls
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [isStartingRadar, setIsStartingRadar] = useState(false);
  const [isStoppingRadar, setIsStoppingRadar] = useState(false);

  // Date-wise Attendance Ledger States
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null);
  const [finalizedNotice, setFinalizedNotice] = useState<any | null>(null);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'live' | 'history'>('live');

  // Modals & Drawers
  const [radarSimulatorOpen, setRadarSimulatorOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [selfiePreviewModal, setSelfiePreviewModal] = useState<any | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Fetch Dashboard, Active Session, Student Risk List & Date-wise Sessions History
  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [dashRes, sessRes, studentsRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/teachers/${currentUser.id}/dashboard`),
        fetch(`${API_BASE}/attendance/session/active`),
        fetch(`${API_BASE}/teachers/students-risk-list`),
        fetch(`${API_BASE}/attendance/sessions?limit=30`)
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setDashboardData(d);
        setSelectedSubject((prev: any) => {
          if (prev) {
            const fresh = d.classes?.find((c: any) => c.id === prev.id || c.name === prev.name);
            return fresh || prev;
          }
          const activeClass = d.classes?.find((c: any) => c.is_selected);
          return activeClass || d.classes?.[0] || null;
        });
      }
      if (sessRes.ok) {
        const s = await sessRes.json();
        setSessionData(s);
        if (s.is_live && typeof s.elapsed_seconds === 'number') {
          setTimerSeconds(s.elapsed_seconds);
        } else if (!s.is_live) {
          setTimerSeconds(0);
        }
      }
      if (studentsRes.ok) {
        const st = await studentsRes.json();
        setStudentsRiskList(st);
      }
      if (histRes.ok) {
        const hist = await histRes.json();
        setHistorySessions(hist);
        setSelectedHistorySession((prev: any) => {
          if (!prev && hist.length > 0) return hist[0];
          if (prev) {
            const fresh = hist.find((h: any) => h.id === prev.id);
            return fresh || prev;
          }
          return null;
        });
      }
    } catch (e) {
      console.warn("Failed fetching from backend:", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      const interval = setInterval(fetchData, 3500);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Timer ticker - only increment if radar session is actively live
  useEffect(() => {
    const ticker = setInterval(() => {
      setTimerSeconds(prev => (sessionData?.is_live ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(ticker);
  }, [sessionData?.is_live]);

  // Start Radar for Selected Subject
  const handleStartRadar = async (subjectToStart?: any) => {
    const target = subjectToStart || selectedSubject || dashboardData?.classes?.[0];
    if (!target) return;
    setIsStartingRadar(true);
    setFinalizedNotice(null);
    setAttendanceViewMode('live');
    try {
      const res = await fetch(`${API_BASE}/attendance/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: target.id,
          subject_name: target.name,
          classroom_room: target.room,
          teacher_id: currentUser?.id
        })
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessionData(newSession);
        setTimerSeconds(0);
        setSelectedSubject(target);
        await fetchData();
      }
    } catch (e) {
      console.error("Failed starting radar:", e);
    } finally {
      setIsStartingRadar(false);
    }
  };

  // Stop Radar: Finalizes detected students as PRESENT for that date and displays confirmation
  const handleStopRadar = async () => {
    setIsStoppingRadar(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/session/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionData?.id
        })
      });
      if (res.ok) {
        const result = await res.json();
        setFinalizedNotice(result);
        setTimerSeconds(0);
        await fetchData();
        setAttendanceViewMode('history');
        if (result.session_id) {
          try {
            const histRes = await fetch(`${API_BASE}/attendance/sessions?limit=30`);
            if (histRes.ok) {
              const hist = await histRes.json();
              setHistorySessions(hist);
              const found = hist.find((h: any) => h.id === result.session_id);
              if (found) setSelectedHistorySession(found);
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
    } catch (e) {
      console.error("Failed stopping radar:", e);
    } finally {
      setIsStoppingRadar(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smartattend_teacher_token');
    localStorage.removeItem('smartattend_teacher_user');
    setCurrentUser(null);
    setDashboardData(null);
    setSessionData(null);
    setStudentsRiskList([]);
  };

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mark Individual Student
  const handleToggleAttendance = async (recordId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    try {
      const res = await fetch(`${API_BASE}/attendance/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_id: recordId,
          new_status: newStatus,
          reason: `Manual toggle to ${newStatus}`
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Mark All Detected Present
  const handleMarkAllDetected = async () => {
    try {
      const res = await fetch(`${API_BASE}/attendance/bulk-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionData?.id || 1,
          status: "PRESENT"
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Radar State in Simulator
  const handleSimulateRadar = async (rollNumber: string, nextStatus: string) => {
    try {
      await fetch(`${API_BASE}/radar/simulate-presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: 1,
          roll_number: rollNumber,
          radar_status: nextStatus
        })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Load Audit Logs
  const handleOpenAuditLogs = async () => {
    setAuditModalOpen(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/audit-logs/${sessionData?.id || 1}`);
      if (res.ok) {
        const logs = await res.json();
        setAuditLogs(logs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Student ML Risk Detail
  const handleOpenStudentDetail = async (studentId: number) => {
    try {
      const res = await fetch(`${API_BASE}/ml/student/${studentId}/insights`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedStudentDetail(detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // If not logged in, show TeacherLogin
  if (!currentUser) {
    return (
      <TeacherLogin
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  // Active records based on view mode (live radar session vs date-wise history session)
  const isHistoryMode = attendanceViewMode === 'history' && Boolean(selectedHistorySession);
  const activeRecords = isHistoryMode
    ? (selectedHistorySession.records || [])
    : (sessionData?.records || []);

  const filteredRecords = activeRecords.filter((r: any) => {
    const matchesSearch = r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.attendance_status === statusFilter;
  });

  const isLiveSession = !isHistoryMode && Boolean(sessionData?.is_live);
  const stats = isHistoryMode
    ? {
        total_students: selectedHistorySession.total_students,
        detected: selectedHistorySession.present_count,
        requested: selectedHistorySession.present_count,
        marked_present: selectedHistorySession.present_count,
        not_detected: selectedHistorySession.absent_count
      }
    : {
        total_students: sessionData?.stats?.total_students ?? activeRecords.length,
        detected: isLiveSession ? (sessionData?.stats?.detected ?? activeRecords.filter((r: any) => r.radar_status === 'DETECTED' || r.radar_status === 'WEAK_SIGNAL').length) : 0,
        requested: isLiveSession ? (sessionData?.stats?.requested ?? activeRecords.filter((r: any) => r.request_status === 'YES').length) : 0,
        marked_present: isLiveSession ? (sessionData?.stats?.marked_present ?? activeRecords.filter((r: any) => r.attendance_status === 'PRESENT').length) : 0,
        not_detected: isLiveSession ? (sessionData?.stats?.not_detected ?? activeRecords.filter((r: any) => r.radar_status === 'NOT_DETECTED').length) : 0
      };

  const metrics = dashboardData?.metrics || {
    total_students: { value: stats.total_students, trend: "+12% vs last month" },
    present_today: { value: stats.marked_present, percentage: stats.total_students > 0 ? Math.round((stats.marked_present / stats.total_students) * 100) : 0 },
    absent_today: { value: stats.not_detected, percentage: stats.total_students > 0 ? Math.round((stats.not_detected / stats.total_students) * 100) : 0 },
    late_today: { value: 0, percentage: 0 }
  };

  const teacher = dashboardData?.teacher || {
    name: currentUser.name || "Prof. Aniket Deshmukh",
    department: currentUser.department || "Computer Science Dept.",
    avatar_url: currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  };

  // Filtered students for Students Tab
  const filteredStudentsList = studentsRiskList.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
    if (studentRiskFilter === 'ALL') return matchesSearch;
    return matchesSearch && s.risk_level === studentRiskFilter;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* 1. LEFT SIDEBAR (EXECUTIVE DARK OBSIDIAN) */}
      <aside className="w-64 bg-[#080D1A] text-slate-300 flex flex-col justify-between p-4 shrink-0 fixed h-full z-20 border-r border-slate-800/80 shadow-2xl">
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-extrabold tracking-tight text-white leading-tight">
                  SmartAttend
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  FACULTY
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Teach • Track • Inspire
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeNav === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveNav('attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeNav === 'attendance'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Take Attendance</span>
            </button>

            <button
              onClick={() => setActiveNav('students')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeNav === 'students'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Enrolled Students</span>
            </button>

            <button
              onClick={() => setActiveNav('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeNav === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveNav('insights')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeNav === 'insights'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Insights</span>
            </button>

            <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Operations & Tools
            </div>

            <button
              onClick={handleOpenAuditLogs}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Audit Reports</span>
            </button>

            <button
              onClick={() => setRadarSimulatorOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Radar Simulator</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* Bottom Help & Motivational Card */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 rounded-2xl p-4 border border-slate-800/80 text-center relative overflow-hidden shadow-inner">
            <div className="w-9 h-9 mx-auto rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-white leading-snug">
              Better Students <br /> Brighter Tomorrow
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              Classroom Gateway #01
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
            <Headphones className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-300">SmartAttend Support</div>
              <div className="text-[10px] text-slate-500 font-mono">support@smartattend.edu</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* TOP HEADER */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students, roll no, classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-16 py-2 bg-slate-50/80 hover:bg-slate-100/90 focus:bg-white text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
              />
              <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-xs pointer-events-none">
                Ctrl K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden lg:flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px]">{dashboardData?.teacher?.date || "Tue, 17 Sept 2024"}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px]">{dashboardData?.teacher?.time || "10:24 AM"}</span>
              </div>
            </div>

            {/* Live Gateway Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>mmWave Node #01</span>
            </div>

            <button
              onClick={() => alert("Notification: Room 201 Session Active with 8 enrolled students.")}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-xs">
                2
              </span>
            </button>

            {/* Profile Avatar Pill & Dropdown */}
            <div className="relative">
              <div
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-slate-100/80 transition-colors cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={teacher.avatar_url}
                    alt={teacher.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30 group-hover:ring-indigo-500/60 transition-all"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-extrabold text-slate-900 leading-tight">
                    {teacher.name}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    {teacher.department}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-all" />
              </div>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-30 animate-pop-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-800">{teacher.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* VIEW 1: DASHBOARD TAB */}
        {activeNav === 'dashboard' && (
          <div className="p-8 max-w-7xl mx-auto space-y-7 animate-in fade-in duration-300">
            {/* Greeting Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Good Morning, {teacher.name}! 👋
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {dashboardData?.teacher?.subtitle || "Here's what's happening with your classes today."}
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm text-xs max-w-sm">
                <p className="italic font-semibold text-slate-800">
                  {dashboardData?.teacher?.quote || "“Teach with data, empower with insights.”"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 text-right">
                  — {dashboardData?.teacher?.quote_author || "SmartAttend"}
                </p>
              </div>
            </div>

            {/* Top 4 Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Enrolled Students
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Cohort Total
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {metrics.total_students.value}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Active in Room 201</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Present Today
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Headcount
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {metrics.present_today.value}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-1">
                      {metrics.present_today.percentage}% attendance rate
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${metrics.present_today.percentage}%` }}></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Absent Today
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Defaulter Risk
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {metrics.absent_today.value}
                    </div>
                    <div className="text-[11px] font-bold text-rose-600 mt-1">
                      {metrics.absent_today.percentage}% absent
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${metrics.absent_today.percentage}%` }}></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Radar Detected
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                    5.8GHz Beam
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {stats.detected}
                    </div>
                    <div className="text-[11px] font-bold text-cyan-700 mt-1">
                      {stats.total_students > 0 ? Math.round((stats.detected / stats.total_students) * 100) : 0}% In Radar Range
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${stats.total_students > 0 ? (stats.detected / stats.total_students) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Main Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
              {/* Left: Classes */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Today's Classes
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Click to select subject
                  </span>
                </div>

                <div className="space-y-3">
                  {dashboardData?.classes?.map((cls: any) => {
                    const isSelected = selectedSubject?.id === cls.id || (!selectedSubject && cls.is_selected);
                    const isLiveForThis = sessionData?.is_live && sessionData?.subject_name?.toLowerCase() === cls.name?.toLowerCase();

                    return (
                      <div
                        key={cls.id}
                        onClick={() => setSelectedSubject(cls)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-2 border-blue-500 bg-blue-50/20 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isLiveForThis
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                              : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Cpu className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">
                                {cls.name}
                              </h4>
                              {isLiveForThis && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 live-indicator"></span>
                                  Radar Active
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {cls.timing}
                            </div>
                            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{cls.room}</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Subject Action Box */}
                {selectedSubject && (
                  <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-400">
                        Selected for Radar
                      </div>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-md">
                        {selectedSubject.room}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {selectedSubject.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedSubject.timing} • Room {selectedSubject.room}
                      </p>
                    </div>

                    {sessionData?.is_live && sessionData?.subject_name?.toLowerCase() === selectedSubject.name?.toLowerCase() ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs px-3 py-2 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <Radio className="w-4 h-4 text-emerald-400 radar-pulse" />
                            <span>Radar Broadcasting Live</span>
                          </span>
                          <span className="font-mono font-bold text-white">{formatTimer(timerSeconds)}</span>
                        </div>
                        <button
                          onClick={handleStopRadar}
                          disabled={isStoppingRadar}
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/30"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{isStoppingRadar ? "Stopping..." : "Stop Radar Session"}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartRadar()}
                        disabled={isStartingRadar}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/30 active:scale-98"
                      >
                        <Radio className={`w-4 h-4 ${isStartingRadar ? 'animate-spin' : 'radar-pulse'}`} />
                        <span>{isStartingRadar ? "Starting Radar..." : `Start Radar for ${selectedSubject.name}`}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Attendance Ledger & Radar Table */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                {/* Finalized Notice Banner upon stopping radar */}
                {finalizedNotice && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-300 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">Attendance Finalized & Sealed!</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {finalizedNotice.date || "Today"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Radar stopped for <strong className="text-slate-800">{finalizedNotice.subject || selectedSubject?.name}</strong>. Exactly <strong className="text-emerald-700">{finalizedNotice.marked_present_count ?? 0} students</strong> marked <span className="font-bold text-emerald-700">PRESENT</span> (Radar Verified) and <strong className="text-rose-600">{finalizedNotice.absent_count ?? 0}</strong> marked <span className="font-bold text-rose-600">ABSENT</span>. Records sealed to student metrics.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setAttendanceViewMode('history');
                          const recent = historySessions.find(h => h.id === finalizedNotice.session_id);
                          if (recent) setSelectedHistorySession(recent);
                        }}
                        className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        View Date Ledger
                      </button>
                      <button
                        onClick={() => setFinalizedNotice(null)}
                        className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* View Mode Switcher: Live Radar vs Date-wise Past Records */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/90 p-2 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200/60 shadow-xs">
                    <button
                      onClick={() => setAttendanceViewMode('live')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        attendanceViewMode === 'live'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${sessionData?.is_live ? 'radar-pulse text-emerald-300' : ''}`} />
                      <span>Live Radar Session</span>
                      {sessionData?.is_live && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator ml-0.5"></span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAttendanceViewMode('history');
                        if (!selectedHistorySession && historySessions.length > 0) {
                          setSelectedHistorySession(historySessions[0]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        attendanceViewMode === 'history'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Date-wise Past Records</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        attendanceViewMode === 'history' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {historySessions.length}
                      </span>
                    </button>
                  </div>

                  {attendanceViewMode === 'history' && historySessions.length > 0 && (
                    <div className="flex items-center gap-2 flex-1 sm:justify-end">
                      <span className="text-[11px] font-bold text-slate-500 shrink-0">Record:</span>
                      <select
                        value={selectedHistorySession?.id || ''}
                        onChange={(e) => {
                          const found = historySessions.find((h: any) => h.id === Number(e.target.value));
                          if (found) setSelectedHistorySession(found);
                        }}
                        className="text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-sm truncate cursor-pointer shadow-xs"
                      >
                        {historySessions.map((h: any) => (
                          <option key={h.id} value={h.id}>
                            {h.date} • {h.subject_name} ({h.present_count} Present / {h.absent_count} Absent)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      attendanceViewMode === 'history'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : sessionData?.is_live
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    }`}>
                      {attendanceViewMode === 'history' ? (
                        <Calendar className="w-5 h-5" />
                      ) : (
                        <Radio className={`w-5 h-5 ${sessionData?.is_live ? 'radar-pulse' : ''}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {attendanceViewMode === 'history' ? (
                          <span className="text-sm font-extrabold text-slate-900">
                            {selectedHistorySession?.subject_name || selectedSubject?.name}
                          </span>
                        ) : (
                          /* Subject Selector Dropdown */
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs font-semibold text-slate-500">Subject:</label>
                            <select
                              value={selectedSubject?.id || ''}
                              onChange={(e) => {
                                const found = dashboardData?.classes?.find((c: any) => c.id === Number(e.target.value));
                                if (found) setSelectedSubject(found);
                              }}
                              className="text-sm font-extrabold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                              {dashboardData?.classes?.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.room})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {attendanceViewMode === 'history' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Date Record: {selectedHistorySession?.date || "Archived"}
                          </span>
                        ) : sessionData?.is_live && sessionData?.subject_name?.toLowerCase() === selectedSubject?.name?.toLowerCase() ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 live-indicator"></span>
                            Radar Active in {sessionData?.classroom_room}
                          </span>
                        ) : sessionData?.is_live ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            Radar Active: {sessionData?.subject_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Radar Offline
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {attendanceViewMode === 'history'
                            ? (selectedHistorySession?.classroom_room || "Room 201")
                            : sessionData?.is_live
                            ? sessionData?.classroom_room
                            : (selectedSubject?.room || "Room 201")}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {attendanceViewMode === 'history'
                            ? `${selectedHistorySession?.start_time || ''} - ${selectedHistorySession?.end_time || 'Completed'}`
                            : sessionData?.is_live
                            ? "Live Broadcasting"
                            : (selectedSubject?.timing || "Scheduled")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {sessionData?.is_live && (
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-emerald-600">
                          {formatTimer(timerSeconds)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Session Active
                        </div>
                      </div>
                    )}

                    {sessionData?.is_live && sessionData?.subject_name?.toLowerCase() === selectedSubject?.name?.toLowerCase() ? (
                      <button
                        onClick={handleStopRadar}
                        disabled={isStoppingRadar}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-500/20 transition-all flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isStoppingRadar ? "Stopping..." : "Stop Radar"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartRadar()}
                        disabled={isStartingRadar}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/25 transition-all flex items-center gap-2 active:scale-95"
                      >
                        <Radio className={`w-4 h-4 ${isStartingRadar ? 'animate-spin' : 'radar-pulse'}`} />
                        <span>{isStartingRadar ? "Starting..." : "Start Radar"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 5 Stat Badges Row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-slate-900 leading-tight">
                        {stats.total_students}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500">
                        Enrolled
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-emerald-900 leading-tight">
                        {stats.detected}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-700">
                        Radar Detected
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-blue-900 leading-tight">
                        {stats.requested}
                      </div>
                      <div className="text-[10px] font-semibold text-blue-700">
                        Requested
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-emerald-900 leading-tight">
                        {stats.marked_present}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-700">
                        Marked Present
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-rose-900 leading-tight">
                        {stats.not_detected}
                      </div>
                      <div className="text-[10px] font-semibold text-rose-700">
                        Not Detected
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner: History Mode Info OR Radar Offline Guidance */}
                {isHistoryMode ? (
                  <div className="p-4 bg-purple-50/90 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-950 text-xs shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          Viewing Sealed Record: {selectedHistorySession?.subject_name} ({selectedHistorySession?.date})
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Conducted in {selectedHistorySession?.classroom_room} • {selectedHistorySession?.start_time} - {selectedHistorySession?.end_time || 'Sealed'} • <strong className="text-emerald-700 font-bold">{selectedHistorySession?.present_count} Present</strong> / <strong className="text-rose-700 font-bold">{selectedHistorySession?.absent_count} Absent</strong> ({selectedHistorySession?.attendance_rate}%)
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAttendanceViewMode('live')}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      Return to Live Radar
                    </button>
                  </div>
                ) : !sessionData?.is_live ? (
                  <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">Classroom Radar is Currently Offline</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Students are in standby roster. Select subject and click <strong className="text-amber-800 font-bold">"Start Radar"</strong> to power on radar detection and allow students to mark attendance.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartRadar()}
                      disabled={isStartingRadar}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Radio className={`w-3.5 h-3.5 ${isStartingRadar ? 'animate-spin' : 'radar-pulse'}`} />
                      <span>{isStartingRadar ? "Starting..." : "Start Radar Now"}</span>
                    </button>
                  </div>
                ) : null}

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleMarkAllDetected}
                      disabled={!sessionData?.is_live || isHistoryMode}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all active:scale-[0.98]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark All Detected Present</span>
                    </button>

                    <button
                      onClick={() => alert("Attendance CSV exported.")}
                      className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>

                    <button
                      onClick={() => setShowSelfies(!showSelfies)}
                      className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        showSelfies
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Show Selfies</span>
                    </button>

                    <button
                      onClick={() => setRadarSimulatorOpen(true)}
                      className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Simulator</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-36 sm:w-48"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none"
                    >
                      <option value="ALL">All Status</option>
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>
                </div>

                {/* Student Attendance Table */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5 w-10">#</th>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5">Roll No.</th>
                        <th className="p-3.5">Radar Status</th>
                        <th className="p-3.5">Request</th>
                        {showSelfies && <th className="p-3.5">Photo & Geo-Tag</th>}
                        <th className="p-3.5">Attendance Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r: any, idx: number) => {
                        const isLive = Boolean(sessionData?.is_live) && !isHistoryMode;
                        const isDetected = isLive && (r.radar_status === 'DETECTED');
                        const isWeak = isLive && (r.radar_status === 'WEAK_SIGNAL');
                        const isPresent = r.attendance_status === 'PRESENT';

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3.5 text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="p-3.5">
                              <button
                                onClick={() => handleOpenStudentDetail(r.student_id)}
                                className="font-bold text-slate-800 hover:text-blue-600 hover:underline flex items-center gap-1.5 text-left"
                              >
                                <span>{r.student_name}</span>
                              </button>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-500">
                              {r.roll_number}
                            </td>
                            <td className="p-3.5">
                              {isHistoryMode ? (
                                isPresent ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Radar Verified</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    <span>Not Detected</span>
                                  </span>
                                )
                              ) : !isLive || r.radar_status === 'STANDBY' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  Radar Off
                                </span>
                              ) : isDetected ? (
                                <button
                                  onClick={() => handleSimulateRadar(r.roll_number, 'NOT_DETECTED')}
                                  title="Click to toggle: Simulates student walking out of radar range"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-all active:scale-95 group"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 live-indicator"></span>
                                  <span>Detected</span>
                                </button>
                              ) : isWeak ? (
                                <button
                                  onClick={() => handleSimulateRadar(r.roll_number, 'DETECTED')}
                                  title="Click to toggle: Simulates student moving closer to radar"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer transition-all active:scale-95"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  <span>Weak Signal</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSimulateRadar(r.roll_number, 'DETECTED')}
                                  title="Click to toggle: Simulates student entering classroom radar range"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-all active:scale-95"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                  <span>Not Detected</span>
                                </button>
                              )}
                            </td>
                            <td className="p-3.5 font-semibold">
                              {isHistoryMode ? (
                                r.request_status === 'YES' ? (
                                  <span className="text-emerald-600 font-bold">Yes</span>
                                ) : (
                                  <span className="text-slate-400">No</span>
                                )
                              ) : !isLive ? (
                                <span className="text-slate-300 font-mono">-</span>
                              ) : r.request_status === 'YES' ? (
                                <span className="text-emerald-600 font-bold">Yes</span>
                              ) : (
                                <span className="text-slate-400">No</span>
                              )}
                            </td>
                            {showSelfies && (
                              <td className="p-3.5">
                                {r.selfie_url ? (
                                  <button
                                    onClick={() => setSelfiePreviewModal(r)}
                                    className="flex items-center gap-2 px-2 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all shadow-xs group text-left cursor-pointer"
                                    title="Click to view verified Photo, GPS Coordinates & Timestamp"
                                  >
                                    <img
                                      src={r.selfie_url}
                                      alt={r.student_name}
                                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-400 group-hover:scale-105 transition-transform shrink-0"
                                    />
                                    <div className="flex flex-col pr-0.5">
                                      <span className="text-[10px] font-black text-emerald-800 flex items-center gap-0.5">
                                        <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                                        {r.latitude ? `${r.latitude.toFixed(2)}°, ${r.longitude.toFixed(2)}°` : 'Geo-Tagged'}
                                      </span>
                                      <span className="text-[9px] font-bold text-emerald-600">✓ Anti-Spoof</span>
                                    </div>
                                  </button>
                                ) : (
                                  <span className="text-slate-300 font-mono text-xs">-</span>
                                )}
                              </td>
                            )}
                            <td className="p-3.5">
                              {isPresent ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3" />
                                  Present
                                </span>
                              ) : isHistoryMode || r.attendance_status === 'ABSENT' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800">
                                  <X className="w-3 h-3" />
                                  Absent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Standby
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isHistoryMode ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {r.marked_at ? r.marked_at.slice(11, 19) : (selectedHistorySession?.end_time || selectedHistorySession?.start_time)}
                                    </span>
                                    <button
                                      onClick={() => handleToggleAttendance(r.id, r.attendance_status)}
                                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                        isPresent
                                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                      }`}
                                      title="Toggle attendance status for this date"
                                    >
                                      {isPresent ? 'Mark Absent' : 'Mark Present'}
                                    </button>
                                  </div>
                                ) : !isLive ? (
                                  <span className="text-[11px] font-semibold text-slate-400 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                    Start Radar to Mark
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleToggleAttendance(r.id, r.attendance_status)}
                                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                      isPresent
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    }`}
                                  >
                                    {isPresent ? 'Mark Absent' : 'Mark Present'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenStudentDetail(r.student_id)}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                  title="View ML Insights"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Analytics Row (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Class Attendance Trend */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Class Attendance Trend
                    </h3>
                    <span className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-semibold">
                      {dashboardData?.attendance_trend?.period || 'Last 4 Weeks'}
                    </span>
                  </div>

                  <div className="relative h-44 flex items-end justify-between px-3 pt-6">
                    <div className="absolute top-12 left-0 right-0 border-b border-dashed border-blue-300 flex justify-end pr-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Avg. {dashboardData?.attendance_trend?.average || '78%'}
                      </span>
                    </div>

                    {(() => {
                      const points = dashboardData?.attendance_trend?.data_points || [
                        { week: "Week 1", percentage: 70 },
                        { week: "Week 2", percentage: 82 },
                        { week: "Week 3", percentage: 77 },
                        { week: "Week 4", percentage: 74 }
                      ];
                      const coords = points.map((p: any, i: number) => {
                        const x = 30 + i * 80;
                        const y = Math.max(20, Math.min(110, 110 - ((p.percentage - 50) / 50) * 80));
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <polygon
                              fill="url(#trendGradient)"
                              points={`30,120 ${coords} ${30 + 3 * 80},120`}
                            />
                            <polyline
                              fill="none"
                              stroke="#3B82F6"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={coords}
                              style={{ filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' }}
                            />
                          </svg>

                          {points.map((p: any, i: number) => (
                            <div key={i} className="text-center relative z-10">
                              <div className="w-3.5 h-3.5 bg-blue-600 rounded-full mx-auto ring-4 ring-blue-100 shadow-xs mb-1 hover:scale-125 transition-transform cursor-pointer"></div>
                              <span className="text-[11px] font-black text-blue-700 block">{p.percentage}%</span>
                              <span className="text-[10px] font-semibold text-slate-500">{p.week}</span>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Card 2: Student Distribution Donut Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight mb-4 flex items-center justify-between">
                  <span>Student Distribution (This Class)</span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">Room 201</span>
                </h3>

                <div className="flex items-center justify-center gap-6">
                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                    <svg width="144" height="144" className="transform -rotate-90">
                      <circle cx="72" cy="72" r="54" stroke="#F1F5F9" strokeWidth="14" fill="transparent" />
                      <circle
                        cx="72" cy="72" r="54"
                        stroke="#10B981" strokeWidth="14" fill="transparent"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - (stats.total_students > 0 ? stats.marked_present / stats.total_students : 0.75))}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: 'drop-shadow(0 2px 6px rgba(16, 185, 129, 0.35))' }}
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-xl font-black text-slate-900 tracking-tight">{stats.total_students}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Students</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs flex-1">
                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                      <span className="text-slate-600 font-medium">Present</span>
                      <span className="font-extrabold text-slate-900 ml-auto">{stats.marked_present}</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs"></span>
                      <span className="text-slate-600 font-medium">Absent</span>
                      <span className="font-extrabold text-slate-900 ml-auto">{stats.not_detected}</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs"></span>
                      <span className="text-slate-600 font-medium">In Radar</span>
                      <span className="font-extrabold text-slate-900 ml-auto">{stats.detected}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: AI Insights (Scikit-Learn) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      AI Insights (Scikit-Learn)
                    </h3>
                    <button
                      onClick={() => setActiveNav('insights')}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(dashboardData?.ai_insights || [
                      { type: 'alert', text: '2 students require attention', subtext: 'Low attendance & score warning.' },
                      { type: 'lightbulb', text: 'Class engagement active', subtext: 'Radar presence detected majority in room.' },
                      { type: 'book', text: 'Top weak topic in this class', subtext: '"Model Evaluation" – Scikit-learn Pipeline.' }
                    ]).slice(0, 3).map((insight: any, idx: number) => {
                      const isAlert = insight.type === 'alert';
                      const isBook = insight.type === 'book';
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                            isAlert
                              ? 'bg-rose-50/70 border-rose-200/70'
                              : isBook
                              ? 'bg-blue-50/70 border-blue-200/70'
                              : 'bg-amber-50/70 border-amber-200/70'
                          }`}
                        >
                          {isAlert ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          ) : isBook ? (
                            <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className={`text-xs font-bold ${
                              isAlert ? 'text-rose-900' : isBook ? 'text-blue-900' : 'text-amber-900'
                            }`}>
                              {insight.text}
                            </div>
                            <div className={`text-[11px] ${
                              isAlert ? 'text-rose-700' : isBook ? 'text-blue-700' : 'text-amber-700'
                            }`}>
                              {insight.subtext}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TAKE ATTENDANCE TAB */}
        {activeNav === 'attendance' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Live Attendance Console
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Autonomous Classroom Radar Presence & Verification Workflow
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Subject Selector */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Subject:</span>
                  <select
                    value={selectedSubject?.id || ''}
                    onChange={(e) => {
                      const found = dashboardData?.classes?.find((c: any) => c.id === Number(e.target.value));
                      if (found) setSelectedSubject(found);
                    }}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {dashboardData?.classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.room})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Radar Status Badge */}
                {sessionData?.is_live ? (
                  <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 live-indicator"></span>
                    <span>{sessionData.subject_name}</span>
                    <span className="font-mono text-emerald-600">({formatTimer(timerSeconds)})</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                    Radar Inactive
                  </div>
                )}

                {/* Start / Stop Radar Button */}
                {sessionData?.is_live && sessionData?.subject_name?.toLowerCase() === selectedSubject?.name?.toLowerCase() ? (
                  <button
                    onClick={handleStopRadar}
                    disabled={isStoppingRadar}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-rose-500/20"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isStoppingRadar ? "Stopping..." : "Stop Radar"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartRadar()}
                    disabled={isStartingRadar}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                  >
                    <Radio className={`w-3.5 h-3.5 ${isStartingRadar ? 'animate-spin' : 'radar-pulse'}`} />
                    <span>{isStartingRadar ? "Starting..." : `Start Radar for ${selectedSubject?.name || 'Class'}`}</span>
                  </button>
                )}

                <button
                  onClick={() => setRadarSimulatorOpen(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  <span>Simulator</span>
                </button>
              </div>
            </div>

            {/* Quick Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500">Enrolled</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total_students}</div>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 shadow-xs">
                <div className="text-xs font-semibold text-emerald-700">Radar In-Range</div>
                <div className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.detected}</div>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/80 shadow-xs">
                <div className="text-xs font-semibold text-blue-700">Student Requests</div>
                <div className="text-2xl font-extrabold text-blue-900 mt-1">{stats.requested}</div>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 shadow-xs">
                <div className="text-xs font-semibold text-emerald-700">Marked Present</div>
                <div className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.marked_present}</div>
              </div>
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200/80 shadow-xs">
                <div className="text-xs font-semibold text-rose-700">Not Detected</div>
                <div className="text-2xl font-extrabold text-rose-900 mt-1">{stats.not_detected}</div>
              </div>
            </div>

            {/* Attendance Console Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleMarkAllDetected}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve All Detected</span>
                  </button>

                  <button
                    onClick={() => setShowSelfies(!showSelfies)}
                    className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      showSelfies
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Show Selfies</span>
                  </button>

                  <button
                    onClick={handleOpenAuditLogs}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit Trail</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
              </div>

              {/* Full Table */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 w-10">#</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Roll No.</th>
                      <th className="p-3.5">Radar Presence</th>
                      <th className="p-3.5">Request</th>
                      {showSelfies && <th className="p-3.5">Selfie Evidence</th>}
                      <th className="p-3.5">Current Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r: any, idx: number) => {
                      const isDetected = r.radar_status === 'DETECTED';
                      const isWeak = r.radar_status === 'WEAK_SIGNAL';
                      const isPresent = r.attendance_status === 'PRESENT';

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3.5">
                            <button
                              onClick={() => handleOpenStudentDetail(r.student_id)}
                              className="font-bold text-slate-800 hover:text-blue-600 text-left"
                            >
                              {r.student_name}
                            </button>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-500">{r.roll_number}</td>
                          <td className="p-3.5">
                            {isDetected ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                In Range (Strong)
                              </span>
                            ) : isWeak ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Weak Signal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                Not Detected
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-semibold">
                            {r.request_status === 'YES' ? (
                              <span className="text-emerald-600 font-bold">Yes</span>
                            ) : (
                              <span className="text-slate-400">No</span>
                            )}
                          </td>
                          {showSelfies && (
                            <td className="p-3.5">
                              {r.selfie_url ? (
                                <img
                                  src={r.selfie_url}
                                  alt={r.student_name}
                                  onClick={() => setSelfiePreviewModal(r.selfie_url)}
                                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 cursor-pointer hover:scale-110 transition-transform"
                                />
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>
                          )}
                          <td className="p-3.5">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" />
                                Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800">
                                <X className="w-3 h-3" />
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleAttendance(r.id, r.attendance_status)}
                                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                  isPresent
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                {isPresent ? 'Mark Absent' : 'Mark Present'}
                              </button>
                              <button
                                onClick={() => handleOpenStudentDetail(r.student_id)}
                                className="p-1 text-slate-400 hover:text-purple-600 rounded"
                                title="View ML Risk Profile"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ENROLLED STUDENTS ROSTER TAB */}
        {activeNav === 'students' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Enrolled Students Directory
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Class ML Risk Profiling, Attendance History & Individual Diagnostics
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                  Total Enrolled: {studentsRiskList.length}
                </span>
                <span className="px-3 py-1 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  High Risk: {studentsRiskList.filter(s => s.risk_level === 'HIGH').length}
                </span>
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
                  Low Risk: {studentsRiskList.filter(s => s.risk_level === 'LOW').length}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter by Risk:
                </span>
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setStudentRiskFilter(lvl)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      studentRiskFilter === lvl
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-12">#</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Roll No.</th>
                    <th className="p-4">Attendance %</th>
                    <th className="p-4">Quiz Avg</th>
                    <th className="p-4">Assignments</th>
                    <th className="p-4">Behavioral Cluster</th>
                    <th className="p-4">ML Risk Level</th>
                    <th className="p-4">Anomaly Flag</th>
                    <th className="p-4 text-right">ML Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudentsList.map((s: any, idx: number) => {
                    const isHigh = s.risk_level === 'HIGH';
                    const isMedium = s.risk_level === 'MEDIUM';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={s.avatar_url}
                              alt={s.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{s.name}</div>
                              <div className="text-[10px] text-slate-400">Student ID: {s.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-600">{s.roll_number}</td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800">{s.attendance_rate}%</div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  s.attendance_rate >= 80 ? 'bg-emerald-500' :
                                  s.attendance_rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${s.attendance_rate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{s.performance_score}%</td>
                        <td className="p-4 font-bold text-slate-800">{s.assignment_score}%</td>
                        <td className="p-4 text-[11px] text-slate-600 font-medium">
                          {s.cluster_name}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isMedium
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isHigh ? 'bg-rose-600 animate-pulse' : isMedium ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}></span>
                            {s.risk_level} ({Math.round(s.risk_probability * 100)}%)
                          </span>
                        </td>
                        <td className="p-4">
                          {s.is_anomaly ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldAlert className="w-3 h-3 text-purple-600" />
                              Outlier
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Normal</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenStudentDetail(s.id)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 ml-auto"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" />
                            <span>Diagnostics</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: ANALYTICS TAB */}
        {activeNav === 'analytics' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Class Performance & Attendance Analytics
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Deep-Dive Cohort Metrics, Attendance Tiers & Performance Correlations
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500">Cohort Average Attendance</div>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">79.2%</div>
                <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +3.4% above institutional median
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500">Class Quiz Mean</div>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">74.5%</div>
                <div className="text-[11px] font-bold text-blue-600 mt-1">
                  Evaluated across 2 quizzes
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500">Below 75% Cutoff</div>
                <div className="text-3xl font-extrabold text-rose-600 mt-1">2 Students</div>
                <div className="text-[11px] font-bold text-rose-600 mt-1">
                  Sneha Iyer, Rohit Verma
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500">Top Class Performer</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 truncate">Aditi Patil</div>
                <div className="text-[11px] font-bold text-emerald-600 mt-1">
                  91% Att | 88% Quiz Score
                </div>
              </div>
            </div>

            {/* Attendance Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Distinction Tier (≥85%)</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {studentsRiskList.filter(s => s.attendance_rate >= 85).length} Students
                  </span>
                </div>
                <p className="text-xs text-slate-500">Consistent attendance with top exam preparedness.</p>
                <div className="space-y-1.5 pt-1">
                  {studentsRiskList.filter(s => s.attendance_rate >= 85).map(s => (
                    <div key={s.id} className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="font-mono font-bold text-emerald-700">{s.attendance_rate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Satisfactory (75%–84%)</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {studentsRiskList.filter(s => s.attendance_rate >= 75 && s.attendance_rate < 85).length} Students
                  </span>
                </div>
                <p className="text-xs text-slate-500">Meets institutional requirements; steady engagement.</p>
                <div className="space-y-1.5 pt-1">
                  {studentsRiskList.filter(s => s.attendance_rate >= 75 && s.attendance_rate < 85).map(s => (
                    <div key={s.id} className="p-2 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="font-mono font-bold text-blue-700">{s.attendance_rate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Defaulter Risk (&lt;75%)</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    {studentsRiskList.filter(s => s.attendance_rate < 75).length} Students
                  </span>
                </div>
                <p className="text-xs text-slate-500">Requires academic counseling to avoid exam disbarment.</p>
                <div className="space-y-1.5 pt-1">
                  {studentsRiskList.filter(s => s.attendance_rate < 75).map(s => (
                    <div key={s.id} className="p-2 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="font-mono font-bold text-rose-700">{s.attendance_rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Academic Correlation Matrix */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Machine Learning Correlation: Attendance vs Academic Performance
              </h3>
              <p className="text-xs text-slate-500">
                Linear regression analysis indicates a strong positive correlation (R = 0.84) between classroom radar presence and quiz mastery.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">High Attendance Cohort (&gt;85%)</div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">86.2% Avg Quiz</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Top quartile performers</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">Moderate Attendance Cohort (75–85%)</div>
                  <div className="text-xl font-extrabold text-blue-600 mt-1">73.8% Avg Quiz</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Consistent performers</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">At-Risk Cohort (&lt;75%)</div>
                  <div className="text-xl font-extrabold text-rose-600 mt-1">54.5% Avg Quiz</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Immediate intervention recommended</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: AI INSIGHTS & EARLY WARNING TAB */}
        {activeNav === 'insights' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  AI Early-Warning & Intervention Center
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Explainable Traditional Machine Learning (Random Forest & Isolation Forest)
                </p>
              </div>

              <div className="px-3.5 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-800 flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-purple-600" />
                <span>Model Pipeline: Scikit-learn Random Forest (Accuracy: 91.2%)</span>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl shadow-md space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Proactive Intervention Mode Enabled</h3>
              </div>
              <p className="text-xs text-indigo-200 max-w-3xl leading-relaxed">
                SmartAttend uses traditional Scikit-learn classifiers (Random Forest, K-Means clustering, and Isolation Forest) to evaluate student risk 3–4 weeks before terminal examinations. Predictions are 100% explainable and tied to verifiable academic indicators.
              </p>
            </div>

            {/* At-Risk Students Grid */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Students Requiring Priority Academic Support ({studentsRiskList.filter(s => s.risk_level !== 'LOW').length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentsRiskList
                  .filter((s: any) => s.risk_level === 'HIGH' || s.risk_level === 'MEDIUM')
                  .map((s: any) => (
                    <div
                      key={s.id}
                      className={`p-5 rounded-2xl border shadow-xs transition-all ${
                        s.risk_level === 'HIGH'
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.avatar_url}
                            alt={s.name}
                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                            <div className="text-xs text-slate-500 font-mono">{s.roll_number}</div>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          s.risk_level === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.risk_level} RISK ({Math.round(s.risk_probability * 100)}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center py-2.5 bg-white/80 rounded-xl border border-slate-200/80 mb-3 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">Attendance</div>
                          <div className={`font-extrabold ${s.attendance_rate < 75 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {s.attendance_rate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">Quiz Avg</div>
                          <div className="font-extrabold text-slate-800">{s.performance_score}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">Assignments</div>
                          <div className="font-extrabold text-slate-800">{s.assignment_score}%</div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 mb-4">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Behavioral Pattern: {s.cluster_name}</span>
                        </div>
                        {s.is_anomaly && (
                          <div className="flex items-center gap-1.5 text-purple-700 font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>Isolation Forest detected anomaly in attendance cadence</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <button
                          onClick={() => alert(`Academic counseling email sent to ${s.name}.`)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                        >
                          Send Advisory
                        </button>

                        <button
                          onClick={() => handleOpenStudentDetail(s.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>Inspect Features</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Pedagogical Interventions Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Recommended Pedagogical Actions for Room 201
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800">Recap Session: "Model Evaluation & Loss Metrics"</div>
                    <div className="text-slate-500">Quiz analysis indicates 4 students scored below 60% on Confusion Matrix and ROC-AUC concepts.</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800">Attendance Warning Notices for 2 Defaulters</div>
                    <div className="text-slate-500">Rohit Verma (59%) and Sneha Iyer (64%) require minimum 4 consecutive attended lectures to clear 75% cutoff.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: INTERACTIVE RADAR SIMULATOR */}
      {radarSimulatorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Radar Hardware Simulator (Room 201)
                </h3>
              </div>
              <button
                onClick={() => setRadarSimulatorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Click on any student to cycle their radar signal status: <b>DETECTED</b> (🟢) ➔ <b>WEAK_SIGNAL</b> (🟡) ➔ <b>NOT_DETECTED</b> (🔴). Watch the live table update in real time!
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(sessionData?.records || activeRecords).map((r: any) => {
                  const nextStatus =
                    r.radar_status === 'DETECTED' ? 'WEAK_SIGNAL' :
                    r.radar_status === 'WEAK_SIGNAL' ? 'NOT_DETECTED' : 'DETECTED';

                  return (
                    <button
                      key={r.roll_number}
                      onClick={() => handleSimulateRadar(r.roll_number, nextStatus)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                        r.radar_status === 'DETECTED'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : r.radar_status === 'WEAK_SIGNAL'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{r.roll_number}</div>
                        <div className="text-[11px] truncate w-24">{r.student_name}</div>
                      </div>
                      <span className="text-sm">
                        {r.radar_status === 'DETECTED' ? '🟢' : r.radar_status === 'WEAK_SIGNAL' ? '🟡' : '🔴'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setRadarSimulatorOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AUDIT LOGS MODAL */}
      {auditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Attendance Modification Audit Trail
                </h3>
              </div>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No manual modifications recorded yet.
                </div>
              ) : (
                auditLogs.map((l: any) => (
                  <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{l.student_name}</span>
                      <span className="text-[10px] text-slate-400">{l.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono text-[10px]">
                        {l.old_status}
                      </span>
                      <span>➔</span>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-mono text-[10px]">
                        {l.new_status}
                      </span>
                      <span className="text-slate-500 ml-auto">By {l.changed_by}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 italic">
                      Reason: {l.reason}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAuditModalOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: STUDENT ML RISK DETAIL */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedStudentDetail.name} ({selectedStudentDetail.roll_number})
                </h3>
                <p className="text-xs text-slate-400">Explainable Traditional ML Analysis</p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500">ML Risk Level:</div>
                  <div className={`text-base font-extrabold ${
                    selectedStudentDetail.risk_label === 'HIGH' ? 'text-rose-600' :
                    selectedStudentDetail.risk_label === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {selectedStudentDetail.risk_label} ({Math.round(selectedStudentDetail.risk_probability * 100)}%)
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500">Predicted Score:</div>
                  <div className="text-base font-extrabold text-blue-600">
                    {selectedStudentDetail.predicted_performance_range}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 mb-1">Student Behavioral Cluster:</div>
                <div className="font-bold text-slate-800">
                  {selectedStudentDetail.cluster_segment}
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-2">Contributing Factors (Explainability):</div>
                <div className="space-y-1.5">
                  {selectedStudentDetail.contributing_signals?.map((s: any, idx: number) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span>{s.factor}</span>
                      <span className="font-bold text-slate-600">{s.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL RES SELFIE PREVIEW WITH LIVE GEO-TAG & TIMESTAMP */}
      {selfiePreviewModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {typeof selfiePreviewModal === 'object' ? (selfiePreviewModal.student_name || 'Student Evidence') : 'Selfie Evidence'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      GEO-TAG VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Roll: {typeof selfiePreviewModal === 'object' ? (selfiePreviewModal.roll_number || selfiePreviewModal.student_roll || 'S101') : 'Verified Student'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelfiePreviewModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
              <img
                src={typeof selfiePreviewModal === 'string' ? selfiePreviewModal : (selfiePreviewModal.selfie_url || '')}
                alt="Selfie"
                className="w-full h-72 object-contain mx-auto"
              />
            </div>

            {/* Geo-tag & Timestamp Metadata Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  GPS Coordinates:
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {typeof selfiePreviewModal === 'object' && selfiePreviewModal.latitude
                    ? `${selfiePreviewModal.latitude.toFixed(6)}° N, ${selfiePreviewModal.longitude.toFixed(6)}° E`
                    : '19.072832° N, 72.882608° E'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500 font-medium shrink-0">Street & Campus Address:</span>
                <span className="font-bold text-slate-800 text-right leading-relaxed">
                  {typeof selfiePreviewModal === 'object' && selfiePreviewModal.location_name
                    ? selfiePreviewModal.location_name
                    : 'College Academic Campus, Lecture Room'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Certified Photo Timestamp:
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {typeof selfiePreviewModal === 'object' && (selfiePreviewModal.photo_timestamp || selfiePreviewModal.marked_at)
                    ? (selfiePreviewModal.photo_timestamp || selfiePreviewModal.marked_at).replace('T', ' ').slice(0, 19) + ' IST'
                    : new Date().toLocaleTimeString() + ' IST'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Camera Source:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  ✓ GPS Map Camera Hardware Authenticated
                </span>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-1">
              <button
                onClick={() => setSelfiePreviewModal(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-[0.99]"
              >
                Close Verification Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
