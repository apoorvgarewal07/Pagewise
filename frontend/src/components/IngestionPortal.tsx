import React, { useState } from 'react';
import { DocumentCorpus } from '../utils/ragEngine.ts';

interface IngestionPortalProps {
  onLoadDocument: (doc: DocumentCorpus) => void;
  onOpenWorkstation: () => void;
  onInspectBboxDemo: () => void;
  onFileUpload: (file: File) => void;
  onDirectQuery: (query: string) => void;
  uploadedDocuments?: DocumentCorpus[];
}

type SimState = 'idle' | 'dragover' | 'processing' | 'success';

export const IngestionPortal: React.FC<IngestionPortalProps> = ({
  onLoadDocument,
  onInspectBboxDemo,
  onFileUpload,
  onDirectQuery,
  uploadedDocuments = []
}) => {
  const [simState, setSimState] = useState<SimState>('idle');
  const [promptInput, setPromptInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSimState('processing');
      onFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSimState('processing');
      onFileUpload(files[0]);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onDirectQuery(promptInput);
  };

  return (
    <main className="relative pt-14 min-h-screen bg-background">
      <div className="relative w-full overflow-hidden pb-24">
        {/* Subtle Collect UI / Precision Glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[720px] h-[300px] bg-gradient-to-b from-blue-100/40 via-indigo-50/20 to-transparent blur-3xl opacity-80"></div>

        {/* Clamped Workstation Center Canvas (760px) */}
        <div className="mx-auto w-full max-w-[760px] px-4 sm:px-6 flex flex-col gap-7 relative z-10 pt-8">
          {/* Hero Header Section */}
          <header className="flex flex-col items-center text-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-base border border-surface-border text-ink-secondary font-mono text-[11px] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-ink-primary">Zero-Hallucination Architecture</span>
              <span className="text-ink-muted">·</span>
              <span className="text-primary font-semibold">Gemini 2.5 Flash</span>
            </div>

            <h1 className="text-[32px] sm:text-[38px] font-bold text-ink-primary tracking-tight leading-[1.15] mt-1">
              The{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600">
                measured RAG copilot.
              </span>
            </h1>

            <p className="text-[14px] sm:text-[15px] text-ink-secondary max-w-[580px] leading-relaxed">
              Upload any PDF document. Get grounded, page-wise answers with exact source citations verified against source text.
            </p>

            {/* Ground Truth Quality Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-1 text-[12px] font-mono text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                100% Verifiable Page Citations
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">model_training</span>
                Hybrid BM25 + Vector Search
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                Verbatim Ground Truth
              </span>
            </div>
          </header>

          {/* Tri-Card Feature Architecture Bento */}
          <section aria-label="Core Technical Capabilities" className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Feature 1: Hybrid Search */}
            <div className="group relative rounded-xl bg-canvas-base p-4 border border-surface-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary mb-1">
                  <span className="material-symbols-outlined text-[18px]">alt_route</span>
                </div>
                <div className="text-[14px] font-semibold text-ink-primary flex items-center justify-between">
                  <span>Hybrid Search</span>
                  <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">
                    3 Modes
                  </span>
                </div>
                <p className="text-[12px] text-ink-secondary leading-relaxed">
                  Hybrid (BM25 + Dense + RRF), Dense Vector Only, or Sparse BM25 Keyword Search.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-surface-border-subtle flex items-center justify-between text-[11px] font-mono font-medium text-primary">
                <span>Sparse + Dense</span>
                <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>

            {/* Feature 2: Traceable Citations */}
            <div
              onClick={onInspectBboxDemo}
              className="group relative rounded-xl bg-canvas-base p-4 border border-surface-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
              title="Click to preview bounding box inspector"
            >
              <div className="flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                </div>
                <div className="text-[14px] font-semibold text-ink-primary flex items-center justify-between">
                  <span>Traceable Citations</span>
                  <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">
                    Page-wise
                  </span>
                </div>
                <p className="text-[12px] text-ink-secondary leading-relaxed">
                  Pinpoint page-level citations linked directly to verified source passages.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-surface-border-subtle flex items-center justify-between text-[11px] font-mono font-medium text-emerald-600">
                <span>[Page X] Anchors</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </div>
            </div>

            {/* Feature 3: Grounded Arbiter */}
            <div className="group relative rounded-xl bg-canvas-base p-4 border border-surface-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-indigo-400/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-1">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div className="text-[14px] font-semibold text-ink-primary flex items-center justify-between">
                  <span>Zero Hallucination</span>
                  <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">
                    Thresholding
                  </span>
                </div>
                <p className="text-[12px] text-ink-secondary leading-relaxed">
                  Refuses out-of-domain questions if confidence falls below mathematical threshold.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-surface-border-subtle flex items-center justify-between text-[11px] font-mono font-medium text-indigo-700">
                <span>Auto-Audited</span>
                <span className="material-symbols-outlined text-[14px] text-indigo-500">shield</span>
              </div>
            </div>
          </section>

          {/* Primary Drop Zone Experience */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="text-[11px] font-mono font-medium text-ink-muted uppercase tracking-wider">
                Upload Document
              </div>
              <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>FastAPI + Gemini Active</span>
              </div>
            </div>

            {/* Crisp Dashed Dropzone */}
            <div
              onClick={handleTriggerUpload}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl bg-canvas-base border-2 border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-xs group ${
                isDragging || simState === 'dragover'
                  ? 'border-primary bg-blue-50/50 shadow-[0_0_24px_rgba(47,107,242,0.15)] scale-[1.008]'
                  : simState === 'processing'
                  ? 'border-indigo-300 bg-indigo-50/30 cursor-wait'
                  : 'border-surface-border hover:border-primary hover:bg-blue-50/20'
              }`}
              id="dropzone"
            >
              {/* Subtle Background Grid Vector */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-rag-light" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#000000" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-rag-light)" />
              </svg>

              {/* Upload Cloud Graphic Centerpiece */}
              <div
                className={`relative z-10 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs mb-3 ${
                  simState === 'processing'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-surface-subtle group-hover:bg-primary group-hover:text-white border border-surface-border group-hover:border-primary text-primary'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[30px] ${
                    simState === 'processing'
                      ? 'animate-spin'
                      : 'group-hover:scale-105 transition-transform'
                  }`}
                >
                  {simState === 'processing' ? 'progress_activity' : 'cloud_upload'}
                </span>
              </div>

              {/* Main Callout */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="text-[17px] font-semibold text-ink-primary tracking-tight">
                  {simState === 'processing'
                    ? 'Extracting Pages & Generating Embeddings...'
                    : 'Drop any PDF here to start'}
                </div>
                <div className="text-[13px] text-ink-secondary flex items-center gap-1.5">
                  <span>or</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleTriggerUpload();
                    }}
                    className="font-medium text-primary underline underline-offset-4 hover:text-blue-700 transition-colors"
                  >
                    browse files to upload
                  </button>
                </div>
              </div>

              {/* Supported File Specs Badge */}
              <div className="relative z-10 mt-4 px-3 py-1 rounded-full bg-surface-subtle border border-surface-border text-ink-secondary text-[11px] font-mono flex items-center gap-2">
                <span className="flex items-center gap-1 text-ink-primary font-medium">
                  <span className="material-symbols-outlined text-[14px] text-primary">picture_as_pdf</span>
                  PDF &le; 50MB
                </span>
                <span className="text-surface-dim">&bull;</span>
                <span>Automatic PyMuPDF Page Extraction &middot; Smart Chunking &middot; Gemini Embeddings</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                id="pdfFileInput"
                onChange={handleFileChange}
              />
            </div>
          </section>

          {/* User Ingested Documents (only if documents exist) */}
          {uploadedDocuments.length > 0 && (
            <section className="flex flex-col gap-2" id="recent">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[17px]">folder</span>
                  <span className="text-[14px] font-semibold text-ink-primary">Your Ingested Documents</span>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">
                  {uploadedDocuments.length} active {uploadedDocuments.length === 1 ? 'corpus' : 'corpora'}
                </span>
              </div>

              <div className="rounded-xl bg-canvas-base border border-surface-border shadow-2xs divide-y divide-surface-border-subtle overflow-hidden">
                {uploadedDocuments.map((corpus) => (
                  <div
                    key={corpus.id}
                    onClick={() => onLoadDocument(corpus)}
                    className="group flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold text-ink-primary truncate group-hover:text-primary transition-colors">
                          {corpus.filename}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-ink-muted mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-surface-subtle border border-surface-border text-ink-secondary">
                            {corpus.totalPages} pages
                          </span>
                          <span>&bull;</span>
                          <span>{corpus.chunksVectorized} chunks</span>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            100% Vectorized
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onLoadDocument(corpus);
                      }}
                      className="h-7 px-3 rounded-md bg-canvas-base border border-surface-border text-ink-primary font-medium text-[12px] flex items-center gap-1 transition-all shadow-2xs group-hover:bg-primary group-hover:text-white group-hover:border-primary"
                    >
                      <span>Load</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Precision Retrieval Architecture Visualization Card */}
          <section className="rounded-xl bg-canvas-base border border-surface-border p-4 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">schema</span>
                <span className="text-[13px] font-semibold text-ink-primary">
                  End-to-End Grounding Guarantee
                </span>
              </div>
              <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
                Strict Verification Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1">
              {/* Step 1 */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-subtle border border-surface-border-subtle">
                <div className="text-[10px] font-mono text-primary font-semibold">STAGE 01</div>
                <div className="text-[12px] font-semibold text-ink-primary">Visual OCR &amp; BBox</div>
                <p className="text-[11px] text-ink-secondary leading-snug">
                  Extracts bounding boxes with line coordinates preserved.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-subtle border border-surface-border-subtle">
                <div className="text-[10px] font-mono text-indigo-600 font-semibold">STAGE 02</div>
                <div className="text-[12px] font-semibold text-ink-primary">Hybrid Ingestion</div>
                <p className="text-[11px] text-ink-secondary leading-snug">
                  Sparse BM25 token index + Dense 1536d vectors.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-subtle border border-surface-border-subtle">
                <div className="text-[10px] font-mono text-primary font-semibold">STAGE 03</div>
                <div className="text-[12px] font-semibold text-ink-primary">Cross-Encoder</div>
                <p className="text-[11px] text-ink-secondary leading-snug">
                  Reranker scores and filters candidates by relevance.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-subtle border border-surface-border-subtle">
                <div className="text-[10px] font-mono text-emerald-600 font-semibold">STAGE 04</div>
                <div className="text-[12px] font-semibold text-ink-primary">Gemini Arbiter</div>
                <p className="text-[11px] text-ink-secondary leading-snug">
                  Gemini Flash validator eliminates hallucinations before stream.
                </p>
              </div>
            </div>
          </section>

          {/* Bottom Floating Prompt Dock */}
          <form
            onSubmit={handlePromptSubmit}
            className="sticky bottom-6 w-full rounded-2xl bg-canvas-base border border-surface-border p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.08)] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-surface-border text-ink-secondary text-[11px] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Gemini 2.5 Flash
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[13px] text-emerald-600">tune</span>
                  Strict Evidence Mode
                </span>
              </div>
              <span className="text-[11px] font-mono text-ink-muted hidden sm:inline">
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-surface-subtle border border-surface-border rounded text-[10px] text-ink-secondary font-mono">
                  Enter
                </kbd>{' '}
                to submit
              </span>
            </div>

            <div className="flex items-center gap-2 bg-surface-subtle border border-surface-border rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-ink-muted text-[18px]">search</span>
              <input
                type="text"
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                placeholder="Ask grounded questions across your uploaded PDF..."
                className="w-full bg-transparent text-ink-primary placeholder:text-ink-muted text-[13px] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!promptInput.trim()}
                className={`h-7 px-3 rounded-lg border text-[12px] font-medium flex items-center gap-1 transition-all ${
                  promptInput.trim()
                    ? 'bg-primary hover:bg-primary/95 text-white border-primary cursor-pointer'
                    : 'bg-surface-container border-surface-border text-ink-muted cursor-not-allowed'
                }`}
              >
                <span>Query</span>
                <span className="material-symbols-outlined text-[14px]">send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};
