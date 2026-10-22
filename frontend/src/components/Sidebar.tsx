import React from 'react';
import { DocumentCorpus } from '../utils/ragEngine.ts';

interface SidebarProps {
  currentView: 'portal' | 'workstation';
  onNavigate: (view: 'portal' | 'workstation') => void;
  activeDoc: DocumentCorpus;
  onUploadClick: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeDoc,
  onUploadClick,
  isMobileOpen = false,
  onCloseMobile
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-[240px] bg-canvas-base border-r border-surface-border z-50 flex flex-col justify-between p-4 shadow-sm transition-transform duration-200 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Brand & Workstation Identifier */}
          <div
            className="flex items-center gap-2.5 px-1 py-1 cursor-pointer group"
            onClick={() => {
              onNavigate('portal');
              if (onCloseMobile) onCloseMobile();
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[19px]">auto_awesome</span>
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight text-ink-primary leading-none">
                PageWise
              </div>
              <div className="text-[10px] font-mono font-medium text-ink-muted uppercase tracking-wider mt-1">
                Doc Intelligence
              </div>
            </div>
          </div>

          {/* Primary Action: Upload PDF */}
          <div>
            <button
              onClick={onUploadClick}
              className="w-full h-9 rounded-lg bg-primary hover:bg-primary-container text-white font-medium text-[13px] flex items-center justify-center gap-1.5 shadow-[0_1px_3px_rgba(47,107,242,0.3)] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">upload_file</span>
              <span>Upload PDF</span>
            </button>
            <div className="text-[11px] font-mono text-ink-muted text-center mt-1">
              or drag &amp; drop file
            </div>
          </div>

          {/* Navigation Tree */}
          <nav className="flex flex-col gap-0.5 mt-1" aria-label="Main Navigation">
            <button
              onClick={() => {
                onNavigate('portal');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-[13px] transition-colors text-left ${
                currentView === 'portal'
                  ? 'bg-surface-container-low text-ink-primary border border-surface-border shadow-2xs font-semibold'
                  : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
              <span>All Documents</span>
            </button>

            <button
              onClick={() => {
                onNavigate('workstation');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors text-left ${
                currentView === 'workstation'
                  ? 'bg-surface-container-low text-ink-primary border border-surface-border shadow-2xs font-semibold'
                  : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-primary">rate_review</span>
              <span>Active Workstation</span>
            </button>

            <a
              href="#recent"
              onClick={e => {
                e.preventDefault();
                onNavigate('portal');
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink-secondary hover:bg-surface-subtle hover:text-ink-primary text-[13px] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-ink-muted">schedule</span>
              <span>Recent</span>
            </a>

            <a
              href="#starred"
              onClick={e => {
                e.preventDefault();
                onNavigate('portal');
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink-secondary hover:bg-surface-subtle hover:text-ink-primary text-[13px] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-ink-muted">star</span>
              <span>Starred</span>
            </a>

            <a
              href="#archived"
              onClick={e => {
                e.preventDefault();
                onNavigate('portal');
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink-secondary hover:bg-surface-subtle hover:text-ink-primary text-[13px] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-ink-muted">archive</span>
              <span>Archived</span>
            </a>
          </nav>

          {/* Active Corpus Section Card */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-border-subtle">
            <div className="text-[11px] font-mono font-medium text-ink-muted uppercase tracking-wider px-1">
              Active Corpus
            </div>
            {activeDoc.id ? (
              <div
                onClick={() => {
                  onNavigate('workstation');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border hover:border-primary/40 cursor-pointer transition-all flex flex-col gap-2 group"
                title="Open document in workstation"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                    description
                  </span>
                  <span className="text-[12px] font-semibold text-ink-primary truncate flex-1 group-hover:text-primary transition-colors">
                    {activeDoc.filename}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-canvas-base border border-surface-border text-ink-secondary">
                    {activeDoc.totalPages} pgs
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-canvas-base border border-surface-border text-ink-secondary">
                    {activeDoc.chunksVectorized} chunks
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onUploadClick}
                className="p-2.5 rounded-lg bg-surface-subtle border border-dashed border-surface-border hover:border-primary/50 text-left transition-all flex items-center gap-2 text-ink-secondary hover:text-ink-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">add_circle</span>
                <span className="text-[11px] font-mono">Upload a PDF to start</span>
              </button>
            )}
          </div>
        </div>

        {/* Live FastAPI Backend Status Indicator */}
        <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-ink-primary font-mono leading-tight">
                FastAPI RAG
              </span>
              <span className="text-[10px] font-mono text-ink-muted leading-tight">Connected</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded font-medium">
            24ms
          </span>
        </div>
      </aside>
    </>
  );
};
