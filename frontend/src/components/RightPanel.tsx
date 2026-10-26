import React, { useState } from 'react';
import { DocumentCorpus } from '../utils/ragEngine.ts';
import { SlidersHorizontal, X, Copy, Check } from 'lucide-react';

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
      {/* Mobile/Tablet backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        className={`fixed right-0 top-0 h-full w-[280px] bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 z-50 flex flex-col justify-between p-4 overflow-y-auto shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              <span className="text-[13px] font-semibold text-white tracking-tight">Telemetry</span>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Telemetry Panel"
              aria-label="Close Telemetry Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Corpus Telemetry Details */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-mono font-medium text-slate-400 tracked-caps px-1">
              CORPUS METRICS
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-400">Filename</span>
                <span className="font-mono text-white font-medium truncate max-w-[130px]" title={activeDoc.filename}>
                  {activeDoc.filename}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-400">Total Pages</span>
                <span className="font-mono text-white font-medium">{activeDoc.totalPages}</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-400">Chunks Vectorized</span>
                <span className="font-mono text-white font-medium">{activeDoc.chunksVectorized}</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-400">Index Status</span>
                {activeDoc.id ? (
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Synced
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Awaiting PDF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Retrieval Strategy */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-mono font-medium text-slate-400 tracked-caps px-1">
              RETRIEVAL STRATEGY
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5">
              <div className="text-[11px] font-mono text-sky-400 font-semibold leading-tight">
                {retrievalMode.includes('Hybrid')
                  ? 'BM25 + Dense Vectors → RRF → Rerank'
                  : retrievalMode.includes('Dense') || retrievalMode.includes('Vector')
                  ? 'Dense Vectors (1536d Cosine) → Rerank'
                  : 'Sparse BM25+ Token Match → Rerank'}
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed mt-1">
                {retrievalMode.includes('Hybrid')
                  ? 'Hybrid reciprocal rank fusion combining dense embeddings and sparse BM25 token index.'
                  : retrievalMode.includes('Dense') || retrievalMode.includes('Vector')
                  ? 'Dense vector similarity retrieval over Gemini 1536d embeddings.'
                  : 'Sparse lexical BM25+ inverted index token matching.'}
              </div>
              {retrievalMode.includes('Hybrid') && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>RRF Parameter (k)</span>
                  <button
                    onClick={() => setRrfK(k => (k === 60 ? 40 : k === 40 ? 80 : 60))}
                    className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 transition-colors"
                  >
                    k={rrfK}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Session */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-mono font-medium text-slate-400 tracked-caps px-1">
              ACTIVE SESSION
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-white font-medium truncate">
                {sessionId || 'session_none'}
              </span>
              <button
                onClick={handleCopySession}
                className="w-6 h-6 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy Session ID"
                aria-label="Copy Session ID"
              >
                {copiedSession ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Rewrite & Cache */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-mono font-medium text-slate-400 tracked-caps px-1">
              REWRITE &amp; CACHE
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-400">Semantic Cache</span>
                <span className="font-mono text-emerald-400 font-semibold">{cacheHitRate}</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-400">Query Expansion</span>
                <span className="font-mono text-white font-medium">
                  {latestExpandedQuery ? 'Active' : 'Standby'}
                </span>
              </div>
              {latestExpandedQuery && (
                <div className="text-[11px] font-mono text-slate-300 p-2 rounded-lg bg-slate-950/80 border border-slate-800 leading-snug break-words">
                  Rewritten: "{latestExpandedQuery}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="pt-3 border-t border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 text-center tracked-caps">
            PageWise Precision RAG
          </div>
        </div>
      </aside>
    </>
  );
};
