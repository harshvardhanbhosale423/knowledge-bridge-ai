import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  ChevronRight,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';
import { UserRole } from '../types';
import * as api from '../api';
import { useTheme } from '../context/ThemeContext';

interface LoginPageProps {
  onSuccess: (role: UserRole, userName: string) => void;
  onCancel?: () => void;
  initialRole?: UserRole | 'demo';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onCancel,
  initialRole = 'demo'
}) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedMode, setSelectedMode] = useState<'admin' | 'team_member' | 'demo'>(
    initialRole === 'demo' ? 'demo' : initialRole
  );
  const [credential, setCredential] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas ref for animated AI network background
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate network nodes
    const nodeCount = Math.min(45, Math.floor((width * height) / 25000));
    const nodes: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connections
      const maxDistance = 140;
      const isDark = theme === 'dark';
      const nodeColor = isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(59, 130, 246, 0.4)';
      const lineColor = isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)';

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1 - dist / maxDistance;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  // Handle standard credential authentication
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential.trim()) {
      setError('Please provide your secure access token.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const targetRole = selectedMode === 'admin' ? 'admin' : 'team_member';
      const res = await api.authenticateSession(targetRole, credential.trim());
      onSuccess(targetRole, res.user_name);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 1-click Demo Judge authentication
  const handleDemoLogin = async (role: 'admin' | 'team_member') => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.authenticateDemoSession(role);
      onSuccess(role, res.user_name);
    } catch (err: any) {
      setError(err.message || 'Demo session initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-[#060B17] via-[#0B1224] to-[#0A1020] text-slate-100 transition-colors duration-300">
      {/* Background Interactive AI Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-70"
      />

      {/* Ambient Radial Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Bar: Return button and Theme toggle */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between z-20">
        {onCancel ? (
          <button
            onClick={onCancel}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-navy-900/60 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-750 backdrop-blur-md text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Overview</span>
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-navy-900/60 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-750 backdrop-blur-md text-xs transition-all"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>
      </div>

      {/* Main Glassmorphism Portal Card */}
      <div className="relative z-10 w-full max-w-4xl bg-navy-900/80 backdrop-blur-xl border border-navy-750/90 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10 transition-all">
        {/* Brand Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[2px] shadow-glow-blue mb-4">
            <div className="w-full h-full bg-[#0B1224] rounded-[14px] flex items-center justify-center">
              <Layers className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            KNOWLEDGE BRIDGE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
            Never Lose Critical Knowledge. Keep Every Project Moving.
          </p>
        </div>

        {/* 3 Large Interactive Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Choice 1: Judge Demo Access */}
          <button
            type="button"
            onClick={() => { setSelectedMode('demo'); setError(null); }}
            className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
              selectedMode === 'demo'
                ? 'bg-gradient-to-b from-indigo-950/70 to-navy-900/90 border-indigo-500 shadow-glow-blue ring-1 ring-indigo-500/50'
                : 'bg-navy-850/50 hover:bg-navy-800/60 border-navy-750 hover:border-navy-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-300" />
              </div>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Judge Access
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              Judge Demo Mode
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Instant 1-click evaluation access. Pre-loaded with synthetic enterprise data, free demo AI, and audit trails.
            </p>
            <div className="mt-3 flex items-center text-xs font-semibold text-indigo-400">
              <span>Instant Login</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Choice 2: Admin / Engineering Lead */}
          <button
            type="button"
            onClick={() => { setSelectedMode('admin'); setError(null); }}
            className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
              selectedMode === 'admin'
                ? 'bg-gradient-to-b from-blue-950/70 to-navy-900/90 border-blue-500 shadow-glow-blue ring-1 ring-blue-500/50'
                : 'bg-navy-850/50 hover:bg-navy-800/60 border-navy-750 hover:border-navy-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-300" />
              </div>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Full Control
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
              Admin & Lead
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Upload documents, trigger AI extraction, verify quotes, batch review, backup/restore, and certify handovers.
            </p>
            <div className="mt-3 flex items-center text-xs font-semibold text-blue-400">
              <span>Token Login</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Choice 3: Team Member */}
          <button
            type="button"
            onClick={() => { setSelectedMode('team_member'); setError(null); }}
            className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
              selectedMode === 'team_member'
                ? 'bg-gradient-to-b from-emerald-950/70 to-navy-900/90 border-emerald-500 shadow-card ring-1 ring-emerald-500/50'
                : 'bg-navy-850/50 hover:bg-navy-800/60 border-navy-750 hover:border-navy-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Audited Member
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              Team Member
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Read-only view of approved handovers, tasks, decisions, risks, and next actions. Blocked from unapproved items.
            </p>
            <div className="mt-3 flex items-center text-xs font-semibold text-emerald-400">
              <span>Token Login</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>

        {/* Selected Mode Interaction Area */}
        <div className="bg-navy-950/70 border border-navy-800 rounded-2xl p-6 relative">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          {selectedMode === 'demo' ? (
            /* JUDGE DEMO ACCESS VIEW */
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Judge Demo Access Experience</h4>
                  <p className="text-xs text-slate-400">
                    Instant 1-Click Evaluation. Zero setup or master secrets required.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('admin')}
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-blue flex items-center justify-between transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-5 h-5" />
                    <div className="text-left">
                      <div>Launch as Demo Admin</div>
                      <div className="text-[11px] font-normal text-blue-200">Full evaluation scope & testing</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('team_member')}
                  className="p-4 rounded-xl bg-navy-800 hover:bg-navy-750 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 font-bold text-sm flex items-center justify-between transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    <div className="text-left">
                      <div>Launch as Demo Team Member</div>
                      <div className="text-[11px] font-normal text-slate-400">Audited handover consumer scope</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>

              <div className="p-3.5 bg-navy-900/80 border border-navy-750 rounded-xl flex items-start space-x-2.5 text-xs text-slate-400">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Demo Mode signs an authenticated HMAC-SHA256 JWT session directly with the backend server. All test features (Upload, Fallback AI Extraction, Evidence Center, Human Review, Certification, and Backup Export) operate with synthetic evaluation data.
                </span>
              </div>
            </div>
          ) : (
            /* REAL TOKEN CREDENTIAL FORM FOR ADMIN OR TEAM MEMBER */
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {selectedMode === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {selectedMode === 'admin' ? 'Administrator Authentication' : 'Team Member Authentication'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {selectedMode === 'admin' ? 'Alex Chen (Admin / Lead)' : 'Elena Rostova (Team Member)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {selectedMode === 'admin' ? 'Master Admin Secret Token' : 'Team Member Secret Token'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="Enter your confidential session token"
                    className="w-full pl-10 pr-10 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-colors"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>HMAC-SHA256 Token • 8h Session</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-glow-blue disabled:opacity-50 ${
                    selectedMode === 'admin'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
