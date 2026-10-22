import React, { useState } from 'react';
import { DocumentCorpus } from '../utils/ragEngine.ts';

interface RightPanelProps {
  activeDoc: DocumentCorpus;
  isOpen: boolean;
  onToggle: () => void;
  latestExpandedQuery?: string;
  cacheHitRate?: string;
  retrievalMode?: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  activeDoc,
  isOpen,
  onToggle,
  latestExpandedQuery = '',
  cacheHitRate = '92.4%',
  retrievalMode = 'Hybrid Search (Dense + BM25)'
}) => {
  const [copiedSession, setCopiedSession] = useState(false);
  const [rrfK, setRrfK] = useState(60);

  const sessionId = activeDoc.id;

  const handleCopySession = () => {
    navigator.clipboard.writeText(sessionId);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        className={`fixed right-0 top-0 h-full w-[280px] bg-canvas-base border-l border-surface-border z-50 flex flex-col justify-between p-4 overflow-y-auto shadow-sm transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-1 border-b border-surface-border-subtle">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">insights</span>
              <span className="text-[13px] font-semibold text-ink-primary tracking-tight">Intelligence</span>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded bg-surface-subtle hover:bg-surface-container border border-surface-border flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
              title="Close Inspection Panel"
              aria-label="Close Inspection Panel"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>

        {/* Corpus Telemetry Details */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-mono font-medium text-ink-muted uppercase tracking-wider px-1">
            Corpus Telemetry
          </div>
          <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border-subtle flex flex-col gap-2">
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-ink-secondary">Filename</span>
              <span className="font-mono text-ink-primary font-medium truncate max-w-[130px]" title={activeDoc.filename}>
                {activeDoc.filename}
              </span>
            </div>
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-ink-secondary">Total Pages</span>
              <span className="font-mono text-ink-primary font-medium">{activeDoc.totalPages}</span>
            </div>
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-ink-secondary">Chunks Vectorized</span>
              <span className="font-mono text-ink-primary font-medium">{activeDoc.chunksVectorized}</span>
            </div>
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-ink-secondary">Index Status</span>
              {activeDoc.id ? (
                <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Synced
                </span>
              ) : (
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Awaiting PDF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Retrieval Strategy */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-mono font-medium text-ink-muted uppercase tracking-wider px-1">
            Retrieval Strategy
          </div>
          <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border-subtle flex flex-col gap-1.5">
            <div className="text-[11px] font-mono text-primary font-semibold leading-tight">
              {retrievalMode.includes('Dense')
                ? 'Dense Vectors (1536d Cosine) → Rerank'
                : retrievalMode.includes('Sparse') || (retrievalMode.includes('BM25') && !retrievalMode.includes('Hybrid'))
                ? 'Sparse BM25+ Token Match → Rerank'
                : 'BM25 + Dense Vectors → RRF → Rerank'}
            </div>
            <div className="text-[11px] text-ink-secondary leading-relaxed mt-1">
              {retrievalMode.includes('Dense')
                ? 'Pure dense semantic vector similarity retrieval over Gemini 1536-dimensional embeddings.'
                : retrievalMode.includes('Sparse') || (retrievalMode.includes('BM25') && !retrievalMode.includes('Hybrid'))
                ? 'Pure sparse lexical BM25+ inverted index token matching with positive score bounds.'
                : 'Hybrid reciprocal rank fusion combining dense embeddings and sparse BM25 token index.'}
            </div>
            {retrievalMode.includes('Hybrid') && (
              <div className="mt-2 pt-2 border-t border-surface-border flex items-center justify-between text-[10px] font-mono text-ink-muted">
                <span>RRF Parameter (k)</span>
                <button
                  onClick={() => setRrfK(k => (k === 60 ? 40 : k === 40 ? 80 : 60))}
                  className="px-1.5 py-0.5 rounded bg-canvas-base border border-surface-border text-ink-primary font-medium hover:bg-slate-100 transition-colors"
                >
                  k={rrfK}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Session */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-mono font-medium text-ink-muted uppercase tracking-wider px-1">
            Active Session
          </div>
          <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border-subtle flex items-center justify-between">
            <span className="text-[11px] font-mono text-ink-primary font-medium truncate">
              {sessionId}
            </span>
            <button
              onClick={handleCopySession}
              className="w-6 h-6 rounded bg-canvas-base border border-surface-border hover:bg-surface-container-high flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
              title="Copy Session ID"
              aria-label="Copy Session ID"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copiedSession ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Rewrite & Cache */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-mono font-medium text-ink-muted uppercase tracking-wider px-1">
            Rewrite &amp; Cache
          </div>
          <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border-subtle flex flex-col gap-2">
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-ink-secondary">Semantic Cache</span>
              <span className="font-mono text-emerald-700 font-semibold">{cacheHitRate}</span>
            </div>
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-ink-secondary">Query Expansion</span>
              <span className="font-mono text-ink-primary font-medium">
                {latestExpandedQuery ? 'Active' : 'Standby'}
              </span>
            </div>
            {latestExpandedQuery && (
              <div className="text-[11px] font-mono text-ink-secondary p-2 rounded bg-canvas-base border border-surface-border leading-snug break-words">
                Rewritten: "{latestExpandedQuery}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel Footer */}
      <div className="pt-3 border-t border-surface-border-subtle">
        <div className="text-[10px] font-mono text-ink-muted text-center">
          PageWise v2.4.1 · Precision RAG
        </div>
      </div>
    </aside>
  </>
);
};
