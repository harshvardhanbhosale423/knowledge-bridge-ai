import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  UserCheck,
  Sparkles,
  FolderGit2,
  Plus,
  Settings as SettingsIcon,
  HelpCircle,
  Cpu,
  Key,
  LogOut,
  Lock,
  Download,
  Sun,
  Moon,
  HardDrive,
  Printer
} from 'lucide-react';
import { UserRole, AIProviderConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  aiConfig: AIProviderConfig | null;
  onOpenCreateProject: () => void;
  onOpenSettings: () => void;
  isAuthenticated: boolean;
  userName?: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenReportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  aiConfig,
  onOpenCreateProject,
  onOpenSettings,
  isAuthenticated,
  userName,
  onOpenAuth,
  onLogout,
  onOpenReportModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDemo = api.isDemoSession();

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#070B14]/90 backdrop-blur-md border-b border-slate-200 dark:border-navy-750/80 transition-colors shadow-sm">
      {/* Judge Demo Banner Pill if Demo Session Active */}
      {isDemo && (
        <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-blue-900/90 border-b border-indigo-500/30 px-4 py-1 text-center text-xs font-semibold text-indigo-200 flex items-center justify-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          <span>HACKATHON JUDGE DEMO MODE ACTIVE</span>
          <span className="text-indigo-400 font-normal hidden sm:inline">• Read & Test Scope • Synthetic Enterprise Handover Data</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setCurrentTab('landing')}
            className="flex items-center space-x-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-glow-blue transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#0B1224] rounded-[11px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
                  KNOWLEDGE BRIDGE <span className="text-blue-600 dark:text-blue-400">AI</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Never Lose Critical Knowledge. Keep Every Project Moving.
              </p>
            </div>
          </button>

          {/* Navigation links */}
          <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-200 dark:border-navy-700/60">
            <button
              onClick={() => setCurrentTab('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTab === 'landing'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/30 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-navy-800'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTab === 'admin'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/30 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-navy-800'
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('workspace')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTab === 'workspace' || currentTab === 'projects'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/30 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-navy-800'
                }`}
            >
              Project Workspace
            </button>
            <button
              onClick={() => setCurrentTab('team')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTab === 'team'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-600/20 dark:text-emerald-400 dark:border-emerald-500/30 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-navy-800'
                }`}
            >
              Team Member View
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => setCurrentTab('backup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTab === 'backup'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-600/20 dark:text-indigo-400 dark:border-indigo-500/30 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-navy-800'
                  }`}
              >
                Backup & Recovery
              </button>
            )}
          </nav>
        </div>

        {/* Right: Actions, Role Switcher, Report Download, AI Status, Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Prominent B&W PDF Download Button */}
          <button
            onClick={onOpenReportModal}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 rounded-xl text-xs font-extrabold shadow-sm transition-all transform hover:-translate-y-0.5"
            title="Download Official 20-Section Black & White Executive Project Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PROJECT REPORT (PDF)</span>
            <span className="md:hidden">REPORT</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-navy-700"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>

          {/* AI Engine Status Pill */}
          <button
            onClick={onOpenSettings}
            className={`hidden xl:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors shadow-sm ${aiConfig?.is_demo_mode
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 hover:dark:bg-amber-500/20'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 hover:dark:bg-emerald-500/20'
              }`}
            title="Click to view AI Engine details and configuration"
          >
            <span className={`w-2 h-2 rounded-full ${aiConfig?.is_demo_mode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <Cpu className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">
              {aiConfig?.is_demo_mode ? 'Free Fallback (₹0)' : 'Gemini Free (₹0)'}
            </span>
          </button>

          {/* Authentication & Role Pill */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="bg-slate-100 dark:bg-navy-850 p-0.5 rounded-xl border border-slate-300 dark:border-navy-700/80 flex items-center shadow-inner">
                <button
                  onClick={() => {
                    if (userRole !== 'admin') {
                      onOpenAuth();
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${userRole === 'admin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  title={userRole === 'admin' ? `Signed in as Administrator (${userName || 'Alex Chen'})` : 'Click to authenticate as Administrator'}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => {
                    if (userRole !== 'team_member') {
                      onOpenAuth();
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${userRole === 'team_member'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  title={userRole === 'team_member' ? `Signed in as Team Member (${userName || 'Elena Rostova'})` : 'Click to authenticate as Team Member'}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Team</span>
                </button>
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-300 dark:hover:border-rose-500/20 transition-colors"
                title="Sign out of current session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-glow-blue transition-all"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Quick Create Project Button */}
          {isAuthenticated && userRole === 'admin' && (
            <button
              onClick={onOpenCreateProject}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-glow-blue transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            title="Settings & Diagnostics"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
