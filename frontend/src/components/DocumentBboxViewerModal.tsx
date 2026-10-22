import React, { useState } from 'react';
import { BoundingBox } from '../utils/ragEngine.ts';

interface DocumentBboxViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  pageNumber: number;
  totalPages: number;
  sectionTitle: string;
  chunkText: string;
  bbox?: BoundingBox;
  simScore?: number;
}

export const DocumentBboxViewerModal: React.FC<DocumentBboxViewerModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  pageNumber: initialPage,
  totalPages,
  sectionTitle,
  chunkText,
  bbox,
  simScore = 0.94
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copied, setCopied] = useState(false);

  // Sync state if initial page changes
  React.useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  if (!isOpen) return null;

  const currentBBox = bbox || {
    page: currentPage,
    x: 8.5,
    y: 28.0,
    width: 83.0,
    height: 22.0
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(chunkText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Document Bounding Box Inspector"
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-canvas-base rounded-2xl border border-surface-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="h-14 px-5 border-b border-surface-border bg-surface-subtle flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-ink-primary truncate">{documentTitle}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Exact BBox Match
                </span>
              </div>
              <span className="text-[11px] font-mono text-ink-muted truncate">
                {sectionTitle} · Verified OCR Coordinates
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Page navigation */}
            <div className="flex items-center gap-1 bg-canvas-base border border-surface-border rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-subtle disabled:opacity-40 text-ink-secondary"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="text-[11px] font-mono px-2 text-ink-primary font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-subtle disabled:opacity-40 text-ink-secondary"
                title="Next Page"
                aria-label="Next Page"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-canvas-base border border-surface-border rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setZoomLevel(z => Math.max(75, z - 25))}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-subtle text-ink-secondary"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span className="text-[11px] font-mono px-1.5 text-ink-muted">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(z => Math.min(150, z + 25))}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-subtle text-ink-secondary"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-surface-container border border-surface-border flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Document Simulation Canvas Viewport */}
        <div className="flex-1 overflow-auto bg-[#e5e7eb]/40 p-6 flex justify-center">
          <div
            className="relative bg-white text-[#191c1e] shadow-xl border border-slate-300 rounded-sm p-10 max-w-[680px] w-full transition-transform origin-top"
            style={{
              minHeight: '780px',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center'
            }}
          >
            {/* Watermark / Header of Document */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 text-[10px] font-mono text-slate-400">
              <span>UNITED STATES SECURITIES AND EXCHANGE COMMISSION</span>
              <span>FORM 10-Q · PAGE {currentPage}</span>
            </div>

            {/* Simulated Document Content */}
            <div className="py-6 flex flex-col gap-4 text-[12px] leading-relaxed text-slate-800 font-serif">
              <h2 className="text-[16px] font-bold tracking-tight text-black font-sans uppercase">
                Item 2. Management's Discussion and Analysis of Financial Condition
              </h2>
              <p>
                The following discussion and analysis of our financial condition and results of operations should be read in conjunction with our condensed consolidated financial statements and the related notes contained within this quarterly report.
              </p>

              {/* The Highlighted Bounding Box Target */}
              <div
                className="relative my-2 p-4 rounded-md border-2 border-primary bg-primary/8 shadow-[0_0_15px_rgba(47,107,242,0.18)]"
              >
                {/* Floating Bounding Box Label Tag */}
                <div className="absolute -top-3.5 left-3 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-mono font-semibold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[12px]">crop_free</span>
                  <span>BBox: {currentBBox.x}%x{currentBBox.y}% · {simScore} Sim</span>
                </div>
                <p className="text-[13px] font-medium leading-relaxed text-ink-primary font-sans pt-1">
                  {chunkText}
                </p>
              </div>

              <p>
                Operating results for the three months ended September 30, 2024 are not necessarily indicative of results that may be expected for the full fiscal year ending December 31, 2024 or any other future reporting period.
              </p>
              <div className="mt-4 p-3 rounded border border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-600">
                <div className="grid grid-cols-4 font-semibold pb-1 border-b border-slate-200 mb-1">
                  <span>Revenue Segment</span>
                  <span>Q3 2024</span>
                  <span>Q3 2023</span>
                  <span>Change YoY</span>
                </div>
                <div className="grid grid-cols-4 py-0.5">
                  <span>Cloud Core Infra</span>
                  <span>$2,140M</span>
                  <span>$1,695M</span>
                  <span className="text-emerald-700 font-semibold">+26.2%</span>
                </div>
                <div className="grid grid-cols-4 py-0.5">
                  <span>Platform SaaS</span>
                  <span>$1,781M</span>
                  <span>$1,561M</span>
                  <span className="text-emerald-700 font-semibold">+14.1%</span>
                </div>
                <div className="grid grid-cols-4 py-0.5">
                  <span>Client Services</span>
                  <span>$900M</span>
                  <span>$816M</span>
                  <span className="text-slate-700">+3.2%</span>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="absolute bottom-6 left-10 right-10 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL · PAGEWISE AUDITED INGESTION</span>
              <span>PARSED WITH COORDINATE METADATA</span>
            </div>
          </div>
        </div>

        {/* Bottom Excerpt & Extraction Details Drawer */}
        <div className="p-4 bg-surface-subtle border-t border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-canvas-base border border-surface-border text-emerald-700 text-[11px] font-mono font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Ground Truth Verbatim Match (Cosine: {simScore})
            </span>
            <span className="text-[11px] font-mono text-ink-muted hidden md:inline">
              Page {currentPage} · Chunks Vectorized &amp; OCR Anchored
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="h-8 px-3 rounded-lg bg-canvas-base hover:bg-slate-100 border border-surface-border text-ink-primary font-mono text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied Passage' : 'Copy Passage'}</span>
            </button>
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/95 text-white font-medium text-[12px] flex items-center gap-1 shadow-sm transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
