import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Rocket, 
  Search, 
  Loader2, 
  RefreshCw, 
  Sparkles, 
  X, 
  Plus,
  CheckCircle2,
  Globe,
  Settings,
  Database,
  Zap,
  ShieldCheck,
  Terminal,
  Wifi,
  ClipboardList,
  ArrowRightCircle,
  Trophy,
  Layers,
  FileSpreadsheet,
  Send,
  ShieldAlert,
  Activity,
  Trash2,
  AlertCircle,
  History
} from 'lucide-react';
import { Lead, LeadStatus, NeedType, Run, Draft, GroundingSource, SystemLog } from './types';
import { NAVIGATION_ITEMS, NEED_LABELS, STATUS_COLORS } from './constants';

/** 
 * SECURE ENGINE (Simulated Backend)
 * In a production app, these functions would be API calls to a serverless backend.
 */
const ParishEngine = {
  discoverLeads: async (location?: string): Promise<any[]> => {
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Discovery failed');
    }
    const json = await res.json();
    return json.leads || [];
  },

  researchLead: async (orgName: string, websiteUrl: string): Promise<any> => {
    const res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName, websiteUrl })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Research failed');
    }
    return await res.json();
  },

  generateDraft: async (orgName: string, need: string, evidence: string): Promise<any> => {
    const res = await fetch('/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName, need, evidence })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Draft generation failed');
    }
    return await res.json();
  },

  uplinkToGHL: async (lead: Lead, locationId: string): Promise<boolean> => {
    try {
      // Simulation of a GHL API handshake
      console.log(`Uplinking ${lead.orgName} to GHL with Location: ${locationId}`);
      await new Promise(r => setTimeout(r, 800));
      // In a real app, this would be a fetch() call to the backend.
      return true;
    } catch (e) {
      return false;
    }
  }
};

const HarvesterCore: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="relative w-64 h-64 flex items-center justify-center">
    <div className={`absolute inset-0 border-2 border-indigo-500/10 rounded-full ${active ? 'animate-[spin_10s_linear_infinite]' : ''}`} />
    <div className={`absolute inset-4 border border-violet-500/10 rounded-full ${active ? 'animate-[spin_15s_linear_infinite_reverse]' : ''}`} />
    <div className={`absolute inset-8 border border-cyan-500/10 rounded-full ${active ? 'animate-[spin_20s_linear_infinite]' : ''}`} />
    <div className="relative z-10 w-32 h-32 bg-indigo-600/20 backdrop-blur-3xl rounded-[2.5rem] border border-indigo-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.2)]">
      <div className={`p-6 bg-indigo-600 rounded-2xl shadow-lg transition-all duration-500 ${active ? 'scale-110 shadow-indigo-500/50' : 'scale-100'}`}>
        <Rocket className={`text-white ${active ? 'animate-bounce' : ''}`} size={48} />
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  // Persistence Layer
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('tower_leads');
    return saved ? JSON.parse(saved) : [];
  });
  const [runs, setRuns] = useState<Run[]>(() => {
    const saved = localStorage.getItem('tower_runs');
    return saved ? JSON.parse(saved) : [];
  });
  const [drafts, setDrafts] = useState<Draft[]>(() => {
    const saved = localStorage.getItem('tower_drafts');
    return saved ? JSON.parse(saved) : [];
  });
  const [suppressedDomains, setSuppressedDomains] = useState<string[]>(() => {
    const saved = localStorage.getItem('tower_suppression');
    return saved ? JSON.parse(saved) : ['competitor.com', 'blacklist.org', 'test.com'];
  });
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('tower_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // System Settings
  const [dailySendCap, setDailySendCap] = useState(() => Number(localStorage.getItem('tower_cap')) || 50);
  const [sendsToday, setSendsToday] = useState(() => {
    const lastDate = localStorage.getItem('tower_last_send_date');
    const today = new Date().toDateString();
    return lastDate === today ? Number(localStorage.getItem('tower_sends_today')) || 0 : 0;
  });
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(() => localStorage.getItem('tower_autopilot') === 'true');
  const [ghlLocationId, setGhlLocationId] = useState(() => localStorage.getItem('tower_ghl_loc') || 'loc-parish-outreach-1');

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTarget, setLocationTarget] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [systemStatus, setSystemStatus] = useState<string>('System Nominal');
  const [ingestionMode, setIngestionMode] = useState<'csv' | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState<string | null>(null);
  const [newSuppression, setNewSuppression] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Persistence
  useEffect(() => {
    localStorage.setItem('tower_leads', JSON.stringify(leads));
    localStorage.setItem('tower_runs', JSON.stringify(runs));
    localStorage.setItem('tower_drafts', JSON.stringify(drafts));
    localStorage.setItem('tower_suppression', JSON.stringify(suppressedDomains));
    localStorage.setItem('tower_logs', JSON.stringify(systemLogs.slice(0, 100))); 
    localStorage.setItem('tower_autopilot', autoPilotEnabled.toString());
    localStorage.setItem('tower_ghl_loc', ghlLocationId);
    localStorage.setItem('tower_cap', dailySendCap.toString());
    localStorage.setItem('tower_sends_today', sendsToday.toString());
    localStorage.setItem('tower_last_send_date', new Date().toDateString());
  }, [leads, runs, drafts, suppressedDomains, systemLogs, autoPilotEnabled, ghlLocationId, dailySendCap, sendsToday]);

  // Logging Helper
  const addLog = useCallback((type: SystemLog['type'], category: SystemLog['category'], message: string) => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      category,
      message
    };
    setSystemLogs(prev => [newLog, ...prev]);
  }, []);

  // Hard Guardrail: Deduplication & Suppression Utility
  const isSafeLead = useCallback((website: string): { safe: boolean; reason?: string } => {
    if (!website) return { safe: false, reason: 'Empty URL' };
    const cleanUrl = website.replace(/https?:\/\/|www\./g, '').split('/')[0].toLowerCase();
    
    // Check Suppression
    if (suppressedDomains.some(d => cleanUrl.includes(d.toLowerCase()))) {
      return { safe: false, reason: 'Suppressed domain' };
    }
    
    // Check Deduplication
    if (leads.some(l => l.websiteUrl.toLowerCase().includes(cleanUrl))) {
      return { safe: false, reason: 'Duplicate node' };
    }

    return { safe: true };
  }, [leads, suppressedDomains]);

  // Statistics
  const stats = useMemo(() => ({
    total: leads.length,
    unprocessed: leads.filter(l => l.status === LeadStatus.NEW && !l.email).length,
    researched: leads.filter(l => !!l.email).length,
    sent: leads.filter(l => l.status === LeadStatus.SENT).length,
    successRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === LeadStatus.SENT).length / (leads.length || 1)) * 100) : 0
  }), [leads]);

  const filteredLeads = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const loc = locationFilter.toLowerCase().trim();

    return leads.filter(l => {
      const matchesSearch = !term ||
        l.orgName.toLowerCase().includes(term) ||
        l.websiteUrl.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term);

      const city = (l.city || '').toLowerCase();
      const state = (l.state || '').toLowerCase();
      const metadata = (l.sourceMetadata || '').toLowerCase();
      const matchesLocation = !loc || city.includes(loc) || state.includes(loc) || metadata.includes(loc);

      return matchesSearch && matchesLocation;
    });
  }, [leads, searchTerm, locationFilter]);

  const toCsvCell = (value: string | undefined) => {
    const raw = (value || '').replace(/"/g, '""');
    return `"${raw}"`;
  };

  const exportLeadsToCsv = () => {
    const rows = filteredLeads;
    if (rows.length === 0) {
      setSystemStatus('No leads match current filters for CSV export.');
      addLog('warning', 'system', 'CSV export skipped: no matching leads.');
      return;
    }

    const header = ['Org Name', 'Website', 'Email', 'City', 'State', 'Primary Need', 'Status', 'Evidence'];
    const body = rows.map(lead => [
      toCsvCell(lead.orgName),
      toCsvCell(lead.websiteUrl),
      toCsvCell(lead.email),
      toCsvCell(lead.city),
      toCsvCell(lead.state),
      toCsvCell(NEED_LABELS[lead.primaryNeed] || lead.primaryNeed),
      toCsvCell(lead.status),
      toCsvCell(lead.evidenceSnippet),
    ].join(','));

    const csv = [header.map(h => toCsvCell(h)).join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `parish-leads-${stamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSystemStatus(`CSV Export Complete: ${rows.length} leads.`);
    addLog('success', 'system', `CSV export complete for ${rows.length} leads.`);
  };

  // --- ACTIONS ---

  const runDiscovery = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSystemStatus('Neural Discovery Initiated...');
    addLog('info', 'discovery', 'Starting automated discovery cycle');
    
    try {
      const discovered = await ParishEngine.discoverLeads(locationTarget);
      let addedCount = 0;
      let skippedCount = 0;

      const newNodes = discovered.map(d => {
        const check = isSafeLead(d.websiteUrl);
        if (!check.safe) {
          skippedCount++;
          addLog('warning', 'discovery', `Blocked discovery of ${d.orgName}: ${check.reason}`);
          return null;
        }

        addedCount++;
        return {
          id: Math.random().toString(36).substr(2, 9),
          orgName: d.orgName || "Unknown Parish",
          websiteUrl: d.websiteUrl || "",
          city: d.city || '',
          state: d.state || '',
          email: '', socials: {}, evidenceSnippet: 'New node found via Neural Scout.', tags: [], primaryNeed: NeedType.NEEDS_AUDIT, status: LeadStatus.NEW, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          groundingSources: d.groundingSources,
          sourceType: 'manual'
        } as Lead;
      }).filter(Boolean) as Lead[];

      setLeads(prev => [...newNodes, ...prev]);
      setSystemStatus(`Discovery Finished: ${addedCount} added, ${skippedCount} skipped.`);
      addLog('success', 'discovery', `Matrix updated: ${addedCount} nodes added.`);
    } catch (e) {
      setSystemStatus(`Discovery Failure: ${(e as Error).message}`);
      addLog('error', 'discovery', `Discovery cycle failed: ${(e as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const researchNode = async (leadId: string, orgName: string, websiteUrl: string) => {
    try {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.RESEARCHING } : l));
      const result = await ParishEngine.researchLead(orgName, websiteUrl);
      
      const update: Partial<Lead> = { 
        email: result.email || '', socials: result.socials || {}, 
        evidenceSnippet: result.evidence || "Scanned digital footprint.", 
        primaryNeed: (result.primaryNeed as NeedType) || NeedType.NEEDS_AUDIT, 
        status: LeadStatus.NEW, updatedAt: new Date().toISOString(),
        groundingSources: result.groundingSources
      };

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...update } : l));
      addLog('info', 'research', `Intelligence mapped for ${orgName}`);
      return update;
    } catch (e) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.NEW, errorMessage: (e as Error).message } : l));
      addLog('error', 'research', `Failed to map intelligence for ${orgName}: ${(e as Error).message}`);
      return null;
    }
  };

  const draftOutreach = async (lead: Lead) => {
    if (isGeneratingDraft) return;
    setIsGeneratingDraft(lead.id);
    addLog('info', 'system', `Drafting outreach for ${lead.orgName}`);
    
    try {
      const parsed = await ParishEngine.generateDraft(lead.orgName, NEED_LABELS[lead.primaryNeed], lead.evidenceSnippet);
      const newDraft: Draft = { 
        id: Math.random().toString(36).substr(2, 9), leadId: lead.id, 
        subject: parsed.subject || `Note to ${lead.orgName}`, 
        body: parsed.body || `Hello, I noticed your digital presence...`, 
        createdAt: new Date().toISOString() 
      };
      
      setDrafts(prev => [newDraft, ...prev.filter(d => d.leadId !== lead.id)]);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.DRAFTED } : l));
      addLog('success', 'system', `Outreach draft generated for ${lead.orgName}`);
      
      if (autoPilotEnabled) await executeUplink(lead.id);
    } catch (e) { 
      addLog('error', 'system', `Draft generation failed for ${lead.orgName}`);
    } finally { 
      setIsGeneratingDraft(null); 
    }
  };

  const executeUplink = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !lead.email) return;

    // Hard Guardrail: Daily Cap
    if (sendsToday >= dailySendCap) {
      setSystemStatus('Guardrail: Daily Send Cap Reached');
      addLog('warning', 'uplink', `Blocked uplink for ${lead.orgName}: Daily cap exceeded.`);
      return;
    }

    try {
      setSystemStatus(`Uplinking ${lead.orgName}...`);
      const success = await ParishEngine.uplinkToGHL(lead, ghlLocationId);
      
      if (success) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.SENT, updatedAt: new Date().toISOString() } : l));
        setSendsToday(prev => prev + 1);
        setSystemStatus(`Uplink Successful: ${lead.orgName}`);
        addLog('success', 'uplink', `Successfully uplinked ${lead.orgName} to GHL Matrix.`);
      }
    } catch (err) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.SKIPPED, errorMessage: (err as Error).message } : l));
      addLog('error', 'uplink', `Matrix handshake failed for ${lead.orgName}`);
    }
  };

  const engageHarvester = async () => {
    if (isProcessing) return;
    const targets = leads.filter(l => l.status === LeadStatus.NEW && !l.email).slice(0, 5);
    
    if (targets.length === 0) {
      setSystemStatus('Queue Neutral: Upload CSV to initialize.');
      return;
    }

    setIsProcessing(true);
    setSystemStatus('Harvest Cycle Active');
    addLog('info', 'research', `Engaging harvester for batch of ${targets.length}`);

    const runId = Math.random().toString(36).substr(2, 9);
    const newRun: Run = {
      id: runId, source: 'manual', sourceType: 'manual', startedAt: new Date().toISOString(), stats: { scraped: 0, drafted: 0, sent: 0, skipped: 0 }, status: 'running'
    };
    setRuns(prev => [newRun, ...prev]);

    try {
      let count = 0;
      for (const lead of targets) {
        setSystemStatus(`Scrutinizing ${lead.orgName}...`);
        const result = await researchNode(lead.id, lead.orgName, lead.websiteUrl);
        if (result && result.email) count++;
        setRuns(prev => prev.map(r => r.id === runId ? { ...r, stats: { ...r.stats, scraped: count } } : r));
      }
      setRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'completed', finishedAt: new Date().toISOString() } : r));
      setSystemStatus('Batch Harvest Completed');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSuppression = (domain: string) => {
    if (!domain) return;
    setSuppressedDomains(prev => {
      const exists = prev.includes(domain);
      if (exists) return prev.filter(d => d !== domain);
      return [...prev, domain];
    });
    addLog('info', 'system', `Updated suppression list: ${domain}`);
  };

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden relative selection:bg-indigo-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-80 h-full flex flex-col border-r border-white/5 bg-white/[0.02] backdrop-blur-3xl z-30">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-14">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20">
              <Rocket size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Control<br/>Tower</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-1.5 h-1.5 rounded-full ${autoPilotEnabled ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-500'}`} />
                <p className="text-[10px] mono-text text-indigo-400 font-bold uppercase tracking-[0.2em]">Autopilot</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {NAVIGATION_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all relative border ${
                  activeTab === item.id 
                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.1)]' 
                    : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-white/[0.04]'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 space-y-4">
          <button 
            onClick={() => setIngestionMode('csv')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 group"
          >
            <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> UPLINK DESIGNATED LIST
          </button>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <Terminal size={18} className="text-slate-400" />
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure Engine</p>
              <p className="text-xs font-black text-slate-300 truncate">{systemStatus}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="px-12 py-8 flex items-center justify-between border-b border-white/5 bg-white/[0.01] backdrop-blur-md">
          <h2 className="text-4xl font-black capitalize tracking-tight flex items-center gap-4">
            {activeTab}
            {isProcessing && <Loader2 className="animate-spin text-indigo-500" size={24} />}
          </h2>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Query matrix nodes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold outline-none w-80 focus:ring-2 focus:ring-indigo-500/50 transition-all focus:bg-white/[0.05]"
              />
            </div>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Target location (e.g., Dallas, TX)"
                value={locationTarget}
                onChange={(e) => setLocationTarget(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold outline-none w-80 focus:ring-2 focus:ring-indigo-500/50 transition-all focus:bg-white/[0.05]"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={runDiscovery}
                disabled={isProcessing}
                className="px-6 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-2xl text-sm font-black hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={18} /> DISCOVER BY LOCATION
              </button>
              <button 
                onClick={engageHarvester}
                disabled={isProcessing || stats.unprocessed === 0}
                className="px-8 py-4 bg-white text-slate-950 rounded-2xl text-sm font-black hover:bg-slate-200 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Zap size={18} /> ENGAGE HARVESTER
              </button>
              <button
                onClick={exportLeadsToCsv}
                className="px-6 py-4 bg-emerald-600/90 text-white rounded-2xl text-sm font-black hover:bg-emerald-500 transition-all flex items-center gap-2 active:scale-95"
              >
                <FileSpreadsheet size={18} /> EXPORT CSV
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-12 py-10">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex items-center gap-12 p-12 rounded-[3.5rem] bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-white/10 glass-card">
                  <HarvesterCore active={isProcessing} />
                  <div>
                    <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Autonomous Matrix Link</p>
                    <h3 className="text-5xl font-black mb-4 tracking-tighter leading-tight">Uplink: Designated Lists</h3>
                    <p className="text-lg text-slate-400 font-medium mb-8">
                      {stats.unprocessed > 0 
                        ? `${stats.unprocessed} designated nodes awaiting analysis cycle.` 
                        : "Matrix inventory stabilized. Upload a list to initiate harvest."}
                    </p>
                    <div className="flex gap-4">
                      <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Success Rate</p>
                        <p className="text-2xl font-black">{stats.successRate}%</p>
                      </div>
                      <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Daily Payload</p>
                        <p className="text-2xl font-black text-indigo-400">{sendsToday} / {dailySendCap}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 rounded-[3.5rem] bg-indigo-600 text-white flex flex-col justify-between shadow-2xl shadow-indigo-600/30">
                   <div className="relative">
                     <div className="p-3 bg-white/20 w-fit rounded-2xl mb-8"><Wifi size={24} /></div>
                     <h3 className="text-3xl font-black tracking-tighter">Autopilot Node</h3>
                     <p className="text-indigo-100/70 mt-2 font-medium">
                       {autoPilotEnabled ? 'Active: Conducting background research and drafting cycles.' : 'Standby: Awaiting manual handshake for sequence steps.'}
                     </p>
                   </div>
                   <button 
                     onClick={() => setAutoPilotEnabled(!autoPilotEnabled)}
                     className="w-full py-5 bg-white text-indigo-600 rounded-3xl font-black text-sm active:scale-95 transition-all shadow-xl hover:bg-slate-50"
                   >
                     {autoPilotEnabled ? 'TERMINATE CYCLE' : 'INITIALIZE SEQUENCE'}
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Total Matrix', val: stats.total, icon: <Database /> },
                  { label: 'Researched', val: stats.researched, icon: <Trophy /> },
                  { label: 'Uplinks Sent', val: stats.sent, icon: <Send /> },
                  { label: 'Queue Load', val: stats.unprocessed, icon: <ClipboardList /> },
                ].map((s, i) => (
                  <div key={i} className="glass-card p-8 rounded-[2.5rem] border border-white/10 hover:border-white/20 transition-all group cursor-default">
                    <div className="p-4 bg-white/5 text-indigo-400 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-300">
                      {s.icon}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <p className="text-4xl font-black mt-2 tabular-nums">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Recent Logs Section */}
              <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xl font-black flex items-center gap-3">
                    <Activity className="text-indigo-400" /> SYSTEM ACTIVITY LOG
                  </h4>
                  <button onClick={() => setSystemLogs([])} className="text-[10px] font-black uppercase text-slate-500 hover:text-red-400 transition-colors">Clear Log history</button>
                </div>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-4">
                  {systemLogs.map(log => (
                    <div key={log.id} className="flex gap-4 items-start py-3 border-b border-white/5 group">
                      <div className={`p-2 rounded-lg mt-0.5 ${
                        log.type === 'error' ? 'bg-red-500/10 text-red-400' :
                        log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.type === 'error' ? <ShieldAlert size={14} /> : <Terminal size={14} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{log.category}</span>
                          <span className="text-[10px] mono-text text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-300">{log.message}</p>
                      </div>
                    </div>
                  ))}
                  {systemLogs.length === 0 && <p className="text-center py-10 text-slate-600 font-black uppercase text-[10px] tracking-widest">No Activity Recorded</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="glass-card rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-700">
              <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center gap-4">
                <Globe className="text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Filter leads by city/state"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="flex-1 max-w-md px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {filteredLeads.length} visible
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5 bg-white/[0.01]">
                    <tr>
                      <th className="px-10 py-6">Parish Identity</th>
                      <th className="px-6 py-6">Location</th>
                      <th className="px-6 py-6">Status</th>
                      <th className="px-6 py-6">Intelligence</th>
                      <th className="px-10 py-6 text-right">Sequence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="group hover:bg-white/[0.02] transition-all">
                        <td className="px-10 py-8">
                          <p className="font-black text-lg group-hover:text-indigo-400 transition-colors">{lead.orgName}</p>
                          <p className="text-[10px] mono-text text-slate-500 font-bold uppercase mt-1">{lead.websiteUrl.replace(/https?:\/\//, '')}</p>
                        </td>
                        <td className="px-6 py-8">
                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            {lead.city || lead.state ? `${lead.city || 'Unknown City'}, ${lead.state || 'Unknown State'}` : 'Unknown'}
                          </p>
                        </td>
                        <td className="px-6 py-8">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border tracking-widest ${STATUS_COLORS[lead.status]}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-8">
                          {lead.email ? (
                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg">
                                {NEED_LABELS[lead.primaryNeed]}
                              </span>
                              <p className="text-[10px] text-slate-500 mono-text">{lead.email}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">Awaiting Analysis</span>
                          )}
                        </td>
                        <td className="px-10 py-8 text-right space-x-2">
                           <button onClick={() => researchNode(lead.id, lead.orgName, lead.websiteUrl)} className="p-3 bg-white/5 rounded-xl hover:text-white text-slate-400 border border-white/10 active:scale-95 transition-all">
                             <RefreshCw size={18} className={lead.status === LeadStatus.RESEARCHING ? 'animate-spin' : ''} />
                           </button>
                           <button onClick={() => draftOutreach(lead)} disabled={!lead.email} className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg disabled:opacity-30 active:scale-95 transition-all">
                             <Sparkles size={18} />
                           </button>
                           <button onClick={() => setLeads(prev => prev.filter(l => l.id !== lead.id))} className="p-3 bg-white/5 rounded-xl hover:text-red-400 text-slate-500 border border-white/10 active:scale-95 transition-all">
                             <Trash2 size={18} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
              {leads.filter(l => l.status === LeadStatus.DRAFTED).map(lead => (
                <div key={lead.id} className="glass-card rounded-[3.5rem] p-12 border border-white/10 shadow-2xl flex flex-col gap-8 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-3xl font-black tracking-tight">{lead.orgName}</h4>
                      <p className="text-indigo-400 mt-2 font-black uppercase tracking-widest text-[10px]">{lead.email}</p>
                    </div>
                    <button 
                      onClick={() => executeUplink(lead.id)} 
                      className="px-10 py-4 bg-indigo-600 text-white rounded-[1.8rem] font-black text-xs active:scale-95 shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                    >
                      <ArrowRightCircle size={18} /> APPROVE & UPLINK
                    </button>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                    <p className="text-xl font-black text-white">{drafts.find(d => d.leadId === lead.id)?.subject}</p>
                    <p className="text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">{drafts.find(d => d.leadId === lead.id)?.body}</p>
                  </div>
                </div>
              ))}
              {leads.filter(l => l.status === LeadStatus.DRAFTED).length === 0 && (
                <div className="py-40 text-center bg-white/[0.01] rounded-[3rem] border border-white/5">
                  <CheckCircle2 size={64} className="mx-auto text-indigo-500/20 mb-6" />
                  <p className="text-slate-500 font-black uppercase tracking-widest">Review Cycle Normalized: Queue Empty</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-10 duration-700">
              <div className="glass-card rounded-[3.5rem] p-16 border border-white/10 shadow-2xl space-y-12 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-6">
                  <div className="p-6 bg-indigo-600 rounded-[2rem] shadow-2xl"><ShieldCheck size={40} /></div>
                  <h3 className="text-4xl font-black tracking-tight">System Guardrails</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Send Cap</label>
                    <input 
                      type="number" 
                      value={dailySendCap} 
                      onChange={e => setDailySendCap(Number(e.target.value))}
                      className="w-full px-8 py-6 bg-white/[0.03] border border-white/10 rounded-[2rem] text-xl font-black outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    />
                    <p className="text-[10px] text-slate-500 font-bold px-2">Utilization: {sendsToday} / {dailySendCap}</p>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GHL Location Alias</label>
                    <input 
                      type="text" 
                      value={ghlLocationId} 
                      onChange={e => setGhlLocationId(e.target.value)}
                      className="w-full px-8 py-6 bg-white/[0.03] border border-white/10 rounded-[2rem] text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    />
                  </div>
                </div>

                {/* Suppression Management */}
                <div className="space-y-6 relative z-10 pt-8 border-t border-white/5">
                   <h4 className="text-xl font-black flex items-center gap-3">
                     <AlertCircle className="text-amber-500" /> DOMAIN SUPPRESSION LIST
                   </h4>
                   <div className="flex gap-4">
                     <input 
                       type="text" 
                       value={newSuppression}
                       onChange={e => setNewSuppression(e.target.value)}
                       placeholder="Enter domain (e.g., spammer.com)"
                       className="flex-1 px-8 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold outline-none"
                     />
                     <button 
                       onClick={() => {
                         if (newSuppression) {
                           toggleSuppression(newSuppression);
                           setNewSuppression('');
                         }
                       }}
                       className="px-8 py-4 bg-white text-slate-950 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all"
                     >
                       BLOCK
                     </button>
                   </div>
                   <div className="flex flex-wrap gap-2 mt-4">
                     {suppressedDomains.map(domain => (
                       <div key={domain} className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-black text-red-400 flex items-center gap-3 group">
                         {domain}
                         <button onClick={() => toggleSuppression(domain)} className="opacity-40 group-hover:opacity-100 hover:text-white transition-opacity"><X size={14} /></button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'runs' && (
            <div className="glass-card rounded-[3rem] border border-white/10 p-12 animate-in fade-in duration-700">
               <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
                 <History className="text-indigo-400" /> PROCESS HISTORY
               </h3>
               <div className="space-y-6">
                 {runs.map(run => (
                   <div key={run.id} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group">
                     <div className="flex items-center gap-8">
                        <div className={`p-5 rounded-2xl ${run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                          <Zap size={24} />
                        </div>
                        <div>
                          <p className="text-xl font-black mb-1">Cycle: {new Date(run.startedAt).toLocaleDateString()}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{run.sourceType} • {run.status}</p>
                        </div>
                     </div>
                     <div className="flex gap-12 text-right">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-500">Nodes Mapped</p>
                          <p className="text-2xl font-black">{run.stats.scraped}</p>
                        </div>
                     </div>
                   </div>
                 ))}
                 {runs.length === 0 && <div className="text-center py-20 text-slate-600 font-black uppercase tracking-widest text-sm">No recorded process runs</div>}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Ingestion Modal */}
      {ingestionMode === 'csv' && (
        <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="glass-card rounded-[4rem] w-full max-w-2xl p-20 shadow-2xl relative border border-white/10 text-center">
            <button onClick={() => setIngestionMode(null)} className="absolute top-12 right-12 p-4 text-slate-500 hover:text-white transition-colors">
              <X size={40} />
            </button>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-24 border-4 border-dashed border-white/10 rounded-[3rem] cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
            >
              <FileSpreadsheet className="text-indigo-500 mx-auto mb-10 transform group-hover:-translate-y-2 transition-transform duration-500" size={120} />
              <p className="text-3xl font-black mb-4">Uplink Designated List</p>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Format: OrgName, WebsiteURL, (Meta...)</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  const lines = text.split('\n').filter(l => l.trim()).slice(1);
                  let countAdded = 0;
                  let countBlocked = 0;

                  const newLeads = lines.map(line => {
                    const columns = line.split(',').map(c => c.trim());
                    const website = columns[1] || "";
                    const check = isSafeLead(website);
                    if (!check.safe) {
                      countBlocked++;
                      return null;
                    }
                    countAdded++;
                    return {
                      id: Math.random().toString(36).substr(2, 9),
                      orgName: columns[0] || "Imported Node",
                      websiteUrl: website,
                      city: columns[2] || '',
                      state: columns[3] || '',
                      sourceMetadata: `${columns[2] || ''} ${columns[3] || ''}`.trim(),
                      email: '', socials: {}, evidenceSnippet: 'Awaiting neural analysis.', tags: [], primaryNeed: NeedType.NEEDS_AUDIT, status: LeadStatus.NEW, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                      sourceType: 'csv'
                    } as Lead;
                  }).filter(Boolean) as Lead[];

                  setLeads(prev => [...newLeads, ...prev]);
                  setIngestionMode(null);
                  addLog('success', 'system', `Import: ${countAdded} nodes added, ${countBlocked} blocked.`);
                };
                reader.readAsText(file);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;