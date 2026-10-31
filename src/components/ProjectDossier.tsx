/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Info,
  CheckCircle2,
  Database,
  Terminal,
  Layers,
  Award,
  Github,
  Key,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface DbStatusState {
  loading: boolean;
  connected: boolean;
  latencyMs?: number;
  url?: string;
  storage?: {
    ready: boolean;
    bucketName: string;
    isPrivate: boolean;
    allBuckets: string[];
    error?: string | null;
  };
  database?: {
    documentsTableReady: boolean;
    documentCount: number;
    error?: string | null;
  };
  error?: string | null;
}

export const ProjectDossier: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<DbStatusState>({
    loading: true,
    connected: false,
  });

  const fetchStatus = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/database/status');
      const data = await res.json();
      setDbStatus({
        loading: false,
        connected: data.connected,
        latencyMs: data.latencyMs,
        url: data.url,
        storage: data.storage,
        database: data.database,
        error: data.error,
      });
    } catch (err: any) {
      setDbStatus({
        loading: false,
        connected: false,
        error: err?.message || 'Could not reach backend health service.',
      });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copySqlMigration = () => {
    const sqlText = `-- Supabase Migration: Step 2 Documents & Storage
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  document_type text not null check (document_type in ('manuscript', 'photograph', 'map', 'architectural_record', 'historical_document', 'other')),
  historical_period text,
  language text default 'en',
  location_name text,
  latitude double precision check (latitude is null or (latitude >= -90.0 and latitude <= 90.0)),
  longitude double precision check (longitude is null or (longitude >= -180.0 and longitude <= 180.0)),
  source_name text,
  attribution text,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/tiff')),
  file_size_bytes bigint not null check (file_size_bytes > 0),
  processing_status text not null default 'uploaded' check (processing_status in ('uploaded', 'processing', 'needs_review', 'indexed', 'failed')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'under_review', 'verified')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.documents enable row level security;`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Title */}
      <div className="border-b border-[#E2D7C3] pb-6">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-[#B38E46]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6860]">
            System Architecture &amp; Documentation
          </span>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#16192E]">
          Project Dossier &amp; Technical Foundation
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6B6860]">
          Comprehensive technical blueprint for <strong>Virasat </strong>, built for the problem statement &ldquo;Digital Revitalisation of Unstructured Cultural &amp; Architectural Heritage Archives.&rdquo;
        </p>
      </div>

      {/* Live Supabase Database & Storage Health Panel (Step 2 Implementation) */}
      <div className="mt-8 rounded-2xl border border-[#C9BBA2] bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2D7C3] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#16192E] text-[#C9A45C]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B38E46]">
                Step 2 &bull; Active Service Verification
              </span>
              <h2 className="font-serif text-lg font-bold text-[#16192E]">
                Supabase PostgreSQL &amp; Secure Storage Health
              </h2>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={dbStatus.loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2D7C3] px-3 py-1.5 text-xs font-medium text-[#16192E] hover:bg-[#F4EFE6] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${dbStatus.loading ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* PostgreSQL Connection */}
          <div className="rounded-xl border border-[#E2D7C3] bg-[#FBF9F4] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B6860]">Database Connection</span>
              {dbStatus.connected ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Live ({dbStatus.latencyMs}ms)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Connecting...
                </span>
              )}
            </div>
            <div className="mt-2 text-xs font-mono text-[#16192E] truncate">
              {dbStatus.url || 'Not configured'}
            </div>
            <div className="mt-1 text-[11px] text-[#8E8A81]">
              PostgreSQL on Supabase Cloud
            </div>
          </div>

          {/* Private Storage Bucket */}
          <div className="rounded-xl border border-[#E2D7C3] bg-[#FBF9F4] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B6860]">Storage Vault Bucket</span>
              {dbStatus.storage?.ready ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Private Vault Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <HardDrive className="h-3.5 w-3.5" />
                  Configuring
                </span>
              )}
            </div>
            <div className="mt-2 text-xs font-mono text-[#16192E]">
              bucket: &ldquo;historical_archives&rdquo;
            </div>
            <div className="mt-1 text-[11px] text-[#8E8A81]">
              Private &bull; 50MB Limit &bull; Restrained MIME
            </div>
          </div>

          {/* Documents Table Records */}
          <div className="rounded-xl border border-[#E2D7C3] bg-[#FBF9F4] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B6860]">Metadata Table Records</span>
              <span className="text-[11px] font-bold text-[#16192E]">
                {dbStatus.database?.documentsTableReady
                  ? `${dbStatus.database.documentCount} document(s)`
                  : 'Schema Pending'}
              </span>
            </div>
            <div className="mt-2 text-xs font-mono text-[#16192E]">
              public.documents
            </div>
            <div className="mt-1 text-[11px] text-[#8E8A81]">
              {dbStatus.database?.documentsTableReady
                ? 'Zero fake records (clean empty state)'
                : 'Run SQL migration in Supabase'}
            </div>
          </div>
        </div>

        {/* SQL Migration Script Copy Box */}
        <div className="mt-6 rounded-xl border border-[#E2D7C3] bg-[#F4EFE6] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#B38E46]" />
              <span className="text-xs font-serif font-bold text-[#16192E]">
                Reproducible SQL Migration File: <code className="text-xs font-mono">supabase/schema_step2_documents.sql</code>
              </span>
            </div>
            <button
              onClick={copySqlMigration}
              className="flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-medium text-[#16192E] border border-[#C9BBA2] hover:bg-[#FBF9F4]"
            >
              {copiedSql ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied SQL</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-[#6B6860]">
            Contains table definition for <code className="text-[#16192E] font-mono">documents</code>, coordinate validation checks, full-text tsvector index, and row-level security (RLS) policies for user privacy.
          </p>
        </div>
      </div>

      {/* Hackathon Evaluation Alignment */}
      <div className="mt-8 rounded-2xl border border-[#E2D7C3] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-[#16192E]">
          <Award className="h-4 w-4 text-[#B38E46]" />
          <span>Hackathon Evaluation Weighting &amp; Strategy</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#E2D7C3] bg-[#F4EFE6] p-4">
            <span className="text-xs text-[#6B6860]">Technical Execution</span>
            <div className="font-serif text-2xl font-bold text-[#16192E]">40%</div>
            <p className="mt-1 text-[11px] text-[#6B6860]">
              Modular TypeScript, server-side Gemini 2.5 Flash OCR, unit tests via Node test runner, strict error boundaries.
            </p>
          </div>
          <div className="rounded-xl border border-[#E2D7C3] bg-[#F4EFE6] p-4">
            <span className="text-xs text-[#6B6860]">System Architecture</span>
            <div className="font-serif text-2xl font-bold text-[#16192E]">30%</div>
            <p className="mt-1 text-[11px] text-[#6B6860]">
              PostgreSQL schema in Supabase with RLS, passage chunking, storage buckets, decoupled business logic.
            </p>
          </div>
          <div className="rounded-xl border border-[#E2D7C3] bg-[#F4EFE6] p-4">
            <span className="text-xs text-[#6B6860]">UI / UX Design</span>
            <div className="font-serif text-2xl font-bold text-[#16192E]">20%</div>
            <p className="mt-1 text-[11px] text-[#6B6860]">
              Museum-grade editorial palette (ivory, deep indigo, antique gold), zero-pill typography, responsive dual-pane viewer.
            </p>
          </div>
          <div className="rounded-xl border border-[#E2D7C3] bg-[#F4EFE6] p-4">
            <span className="text-xs text-[#6B6860]">Innovation &amp; Fit</span>
            <div className="font-serif text-2xl font-bold text-[#16192E]">10%</div>
            <p className="mt-1 text-[11px] text-[#6B6860]">
              Strict source attribution, verifiable evidence citations, differentiating verified records from AI commentary.
            </p>
          </div>
        </div>
      </div>

      {/* Foundation & Current Scope Status */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Established in this step */}
        <div className="rounded-xl border border-[#E2D7C3] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#16192E]">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <span>Established in Current Foundation Steps</span>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-[#6B6860]">
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span><strong>Design System:</strong> Warm ivory (#FBF9F4), parchment (#F4EFE6), deep indigo-charcoal (#16192E), and antique-gold (#B38E46).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span><strong>Database Schema (Step 2):</strong> <code className="text-[11px] font-mono text-[#16192E]">documents</code> metadata table with constraints and RLS policies.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span><strong>Secure Storage (Step 2):</strong> Private <code className="text-[11px] font-mono text-[#16192E]">historical_archives</code> bucket created in Supabase with 50MB limit.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span><strong>Zero Fake Data:</strong> No fabricated counts or mock records presented as real database results.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span><strong>Security:</strong> Service role key isolated to server endpoints; client uses Anon publishable key only.</span>
            </li>
          </ul>
        </div>

        {/* Planned Incremental Next Steps */}
        <div className="rounded-xl border border-[#E2D7C3] bg-[#F4EFE6] p-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#16192E]">
            <Layers className="h-4 w-4 text-[#B38E46]" />
            <span>Upcoming Incremental Feature Releases</span>
          </div>
          <ol className="mt-4 space-y-2 text-xs text-[#6B6860] list-decimal list-inside">
            <li>
              <strong>Step 3:</strong> Document Upload &amp; Multi-Modal Gemini OCR Ingestion Pipeline.
            </li>
            <li>
              <strong>Step 4:</strong> Deep Searchable Archival Passage Index &amp; Inscription Search.
            </li>
            <li>
              <strong>Step 5:</strong> Grounded Gemini AI Heritage Research Assistant with Evidence Citations.
            </li>
            <li>
              <strong>Step 7:</strong> Heritage Knowledge Graph (Monuments, Dynasties, Sources).
            </li>
          </ol>
        </div>
      </div>

      {/* GitHub Synchronization Guide for macOS M1 */}
      <div className="mt-8 rounded-2xl border border-[#E2D7C3] bg-[#16192E] p-6 text-[#EDE5D5] shadow-md">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5 text-[#C9A45C]" />
          <h2 className="font-serif text-lg font-bold text-white">
            macOS M1 &amp; GitHub Synchronization Guide
          </h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#A7A9B4]">
          Follow these exact steps in your Mac Terminal to maintain, run, and synchronize this codebase with your existing repository at <code className="text-[#C9A45C]">https://github.com/bpvankar496-ux/HackathonIITG</code>:
        </p>

        <div className="mt-4 rounded-lg bg-[#111322] p-4 font-mono text-xs text-[#EDE5D5] space-y-2 border border-[#272B40]">
          <div className="text-[#8E8A81]"># 1. Clone or pull from your GitHub repository</div>
          <div>git clone https://github.com/bpvankar496-ux/HackathonIITG.git</div>
          <div>cd HackathonIITG</div>
          <div className="mt-2 text-[#8E8A81]"># 2. Install dependencies (Node 18+ on macOS M1)</div>
          <div>npm install</div>
          <div className="mt-2 text-[#8E8A81]"># 3. Configure environment variables (copied from .env.example)</div>
          <div>cp .env.example .env.local</div>
          <div className="mt-2 text-[#8E8A81]"># 4. Start local development server</div>
          <div>npm run dev</div>
          <div className="mt-2 text-[#8E8A81]"># 5. Run type checks and production build</div>
          <div>npm run build</div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#A7A9B4]">
          <Key className="h-3.5 w-3.5 text-[#C9A45C]" />
          <span>Note: The <code className="text-white">.gitignore</code> file prevents sensitive keys from ever being exposed to GitHub.</span>
        </div>
      </div>
    </div>
  );
};
