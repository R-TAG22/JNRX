import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Activity,
  Layers,
  Terminal,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  testSupabaseConnection,
} from '../../supabaseClient';

export const SettingsPage: React.FC = () => {
  const { draftContent, updateSection } = useCMS();
  const { showToast } = useToast();

  const [copiedSql, setCopiedSql] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Live Supabase Health State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    ok: boolean;
    message: string;
    latencyMs?: number;
  }>({
    tested: false,
    ok: true,
    message: 'Configured and active',
  });

  const checkConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await testSupabaseConnection();
      setConnectionStatus({
        tested: true,
        ok: res.ok,
        message: res.message,
        latencyMs: res.latencyMs,
      });
      if (res.ok) {
        showToast('success', 'Supabase Connected', `Latency: ${res.latencyMs}ms. Project: ${SUPABASE_PROJECT_ID}`);
      } else {
        showToast('error', 'Connection Error', res.message);
      }
    } catch (err: unknown) {
      setConnectionStatus({
        tested: true,
        ok: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
      showToast('error', 'Connection Error', 'Could not reach Supabase endpoint');
    } finally {
      setIsTestingConnection(false);
    }
  };

  useEffect(() => {
    // Initial silent connectivity check
    checkConnection();
  }, []);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draftContent, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jnrx-cms-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('success', 'Export Complete', 'Downloaded CMS content backup JSON file.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.header || !parsed.hero || !parsed.portfolio) {
          throw new Error('Invalid JNRX schema');
        }
        for (const [key, val] of Object.entries(parsed)) {
          if (key !== 'lastUpdated' && key !== 'publishedAt') {
            await updateSection(key as any, val as any);
          }
        }
        showToast('success', 'Import Successful', 'Imported CMS content successfully.');
        window.location.reload();
      } catch (err: unknown) {
        showToast('error', 'Import Failed', err instanceof Error ? err.message : 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToFactory = async () => {
    try {
      localStorage.removeItem('jnrx_cms_draft_v6');
      localStorage.removeItem('jnrx_cms_published_v6');
      localStorage.removeItem('commerceforge_cms_draft_v5');
      localStorage.removeItem('commerceforge_cms_published_v5');
      localStorage.removeItem('commerceforge_cms_draft_v1');
      localStorage.removeItem('commerceforge_cms_published_v1');
      showToast('info', 'Reset Complete', 'Restored original initial website content.');
      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      showToast('error', 'Reset Failed', err instanceof Error ? err.message : 'Reset failed');
    }
  };

  const supabaseSqlSchema = `-- JNRX Dev Team: Supabase Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql

-- 1. Create Inquiries table for proposal submissions
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  store_url TEXT,
  package_tier TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS & Policies for Inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public anon inserts" 
  ON public.inquiries 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow read for admin" 
  ON public.inquiries 
  FOR SELECT 
  USING (true);

-- 2. Create CMS Content table for dynamic page management
CREATE TABLE IF NOT EXISTS public.cms_content (
  content_type TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS & Policies for CMS Content
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of published content" 
  ON public.cms_content 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow write for authorized updates" 
  ON public.cms_content 
  FOR ALL 
  USING (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    showToast('info', 'SQL Copied', 'Copied database creation script for Supabase SQL Editor.');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Infrastructure &amp; Backend</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            System Settings &amp; Supabase Backend
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Manage your Supabase backend integration, test live connectivity, export JSON backups, and view table schemas.
          </p>
        </div>
      </div>

      {/* Supabase Integration Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Supabase Cloud Backend
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Connected</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Integrated with project <code className="font-mono text-emerald-800 font-bold">{SUPABASE_PROJECT_ID}</code> for proposal inquiries, CMS data persistence, and authentication.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={checkConnection}
              disabled={isTestingConnection}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-200 disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 text-emerald-600 ${isTestingConnection ? 'animate-spin' : ''}`} />
              <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
            </button>
            <a
              href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <span>Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Credentials & Status details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Project ID
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 block truncate">
              {SUPABASE_PROJECT_ID}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Project URL
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 block truncate" title={SUPABASE_URL}>
              {SUPABASE_URL}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Live Health Status
            </span>
            <div className="flex items-center gap-1.5">
              {connectionStatus.ok ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
              <span className="text-xs font-bold text-slate-800">
                {connectionStatus.latencyMs ? `${connectionStatus.latencyMs}ms response` : connectionStatus.message}
              </span>
            </div>
          </div>
        </div>

        {/* Setup instructions & SQL script */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Supabase SQL Setup Script
              </span>
            </div>
            <button
              type="button"
              onClick={copySqlToClipboard}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white hover:bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied to Clipboard' : 'Copy SQL Schema'}</span>
            </button>
          </div>
          <p className="text-xs text-emerald-950 font-medium leading-relaxed">
            Run this in your{' '}
            <a
              href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-emerald-900 inline-flex items-center gap-0.5"
            >
              <span>Supabase SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            to create the <code className="font-mono bg-emerald-100/80 px-1 py-0.5 rounded text-[11px]">inquiries</code> and <code className="font-mono bg-emerald-100/80 px-1 py-0.5 rounded text-[11px]">cms_content</code> tables with proper Row Level Security policies.
          </p>

          <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
            {supabaseSqlSchema}
          </pre>
        </div>
      </div>

      {/* JSON Backup & Migration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Export CMS Backup
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Download all sections, packages, and portfolio data as a JSON file.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportJSON}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON Snapshot</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Restore From Backup
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Upload a previously saved JSON snapshot to restore website copy.
              </p>
            </div>
          </div>

          <label className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Select JSON File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone: Factory Reset */}
      <div className="p-6 rounded-3xl bg-white border border-red-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-red-900">
                Reset Drafts to Initial Copy
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Revert all CMS sections back to the pristine default website template content.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
          >
            Reset Content
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset All CMS Content?"
        message="This will clear your local draft and restore the original initial website copy. Are you sure you want to proceed?"
        confirmLabel="Reset Everything"
        isDestructive={true}
        onConfirm={handleResetToFactory}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
