
import React from 'react';
import { LayoutDashboard, Users, History, CheckCircle2, Send, Inbox, Settings } from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'runs', label: 'Processing Runs', icon: <History size={20} /> },
  { id: 'leads', label: 'Leads Directory', icon: <Users size={20} /> },
  { id: 'review', label: 'Review Queue', icon: <CheckCircle2 size={20} /> },
  { id: 'settings', label: 'System Settings', icon: <Settings size={20} /> },
];

export const NEED_LABELS: Record<string, string> = {
  needs_rebuild: 'Site Rebuild',
  needs_audit: 'Tech Audit',
  sermons_no_clips: 'Homily Reels',
  inactive_social: 'Social Boost',
  speaker_opportunity: 'Speaker Events',
};

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100/10 text-blue-400 border-blue-500/20',
  drafted: 'bg-yellow-100/10 text-yellow-400 border-yellow-500/20',
  queued: 'bg-indigo-100/10 text-indigo-400 border-indigo-500/20',
  approved: 'bg-green-100/10 text-green-400 border-green-500/20',
  sent: 'bg-emerald-100/10 text-emerald-400 border-emerald-500/20',
  skipped: 'bg-red-100/10 text-red-400 border-red-500/20',
  researching: 'bg-indigo-100/20 text-indigo-300 border-indigo-500/30 animate-pulse',
  suppressed: 'bg-slate-100/10 text-slate-500 border-slate-500/20',
};
