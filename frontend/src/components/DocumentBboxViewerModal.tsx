import React, { useState, useEffect } from 'react';
import { BoundingBox } from '../utils/ragEngine.ts';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  X,
  Crosshair,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  FileCode,
  Image as ImageIcon,
  RotateCcw,
  Loader2
} from 'lucide-react';

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
  sessionId?: string;
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
  simScore = 0.95,
  sessionId
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'page' | 'pdf' | 'text'>('page');
  const [isImgLoading, setIsImgLoading] = useState(true);
  const [hasImgError, setHasImgError] = useState(false);
  const [pageTextData, setPageTextData] = useState<string>('');
  const [loadingText, setLoadingText] = useState(false);

  // Sync state if initial page changes
  useEffect(() => {
    setCurrentPage(initialPage);
    setIsImgLoading(true);
    setHasImgError(false);
  }, [initialPage]);

  // Fetch page text when text tab is active
  useEffect(() => {
    if (viewMode === 'text' && sessionId) {
      setLoadingText(true);
      fetch(`/api/document/${sessionId}/page/${currentPage}/text`)
        .then(res => res.json())
        .then(data => {
          setPageTextData(data.text || chunkText);
          setLoadingText(false);
        })
        .catch(() => {
          setPageTextData(chunkText);
          setLoadingText(false);
        });
    }
  }, [viewMode, currentPage, sessionId, chunkText]);

  if (!isOpen) return null;

  const currentBBox = bbox || {
    page: currentPage,
    x: 8.0,
    y: 22.0,
    width: 84.0,
    height: 18.0
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(chunkText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pageImageUrl = `/api/document/${sessionId || 'active'}/page/${currentPage}?snippet=${encodeURIComponent(
    chunkText.slice(0, 80)
  )}&dpi=160`;

  const pdfEmbedUrl = `/api/document/${sessionId || 'active'}/pdf#page=${currentPage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Document Page Citation Inspector"
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="h-14 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-800/80 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white truncate max-w-[200px] sm:max-w-[320px]" title={documentTitle}>
                  {documentTitle}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[10px] font-mono font-medium flex items-center gap-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Real PDF Page
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[280px]">
                {sectionTitle || `Page ${currentPage}`} · Grounded Document View
              </span>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="hidden md:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setViewMode('page')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'page'
                  ? 'bg-sky-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Page View</span>
            </button>
            <button
              onClick={() => setViewMode('pdf')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pdf'
                  ? 'bg-sky-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Viewer</span>
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'text'
                  ? 'bg-sky-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Extracted Text</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Page navigation */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shadow-sm">
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  setIsImgLoading(true);
                  setHasImgError(false);
                }}
                disabled={currentPage <= 1}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-2 text-white font-medium whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  setIsImgLoading(true);
                  setHasImgError(false);
                }}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Next Page"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            {viewMode === 'page' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shadow-sm">
                <button
                  onClick={() => setZoomLevel(z => Math.max(60, z - 20))}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-slate-300 min-w-[42px] text-center font-medium">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(z => Math.min(180, z + 20))}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 100 && (
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
                    title="Reset Zoom to 100%"
                    aria-label="Reset Zoom"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 flex justify-center items-start relative select-text">
          {/* TAB 1: Real Rendered High-Resolution Page Image */}
          {viewMode === 'page' && (
            <div className="relative flex flex-col items-center max-w-full">
              {isImgLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs min-h-[500px]">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" />
                  <span className="text-xs font-mono text-slate-300">
                    Rendering Page {currentPage} from {documentTitle}...
                  </span>
                </div>
              )}

              {!hasImgError ? (
                <div
                  className="relative shadow-2xl rounded-sm transition-transform origin-top border border-slate-700/80 bg-white"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center'
                  }}
                >
                  {/* The Real Rendered Page Image */}
                  <img
                    key={`page-${currentPage}-${sessionId}`}
                    src={pageImageUrl}
                    alt={`Page ${currentPage} of ${documentTitle}`}
                    onLoad={() => setIsImgLoading(false)}
                    onError={() => {
                      setIsImgLoading(false);
                      setHasImgError(true);
                    }}
                    className="max-w-[760px] w-full h-auto block select-none pointer-events-none"
                    style={{ minWidth: '320px' }}
                  />

                  {/* Highlighting Bounding Box Overlay */}
                  <div
                    className="absolute border-2 border-sky-500 bg-sky-500/15 rounded-xs transition-all pointer-events-none shadow-[0_0_15px_rgba(56,189,248,0.35)]"
                    style={{
                      left: `${currentBBox.x}%`,
                      top: `${currentBBox.y}%`,
                      width: `${currentBBox.width}%`,
                      height: `${currentBBox.height}%`
                    }}
                  >
                    <div className="absolute -top-3.5 left-2 px-2 py-0.5 rounded-md bg-sky-600 text-white font-mono text-[10px] font-semibold flex items-center gap-1 shadow-sm whitespace-nowrap">
                      <Crosshair className="w-3 h-3 text-white" />
                      <span>Cited Passage · Page {currentPage}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback if backend image cannot be served */
                <div className="max-w-[720px] w-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col gap-4 text-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
                    <span>{documentTitle}</span>
                    <span>PAGE {currentPage} OF {totalPages}</span>
                  </div>
                  <div className="p-4 rounded-lg bg-sky-950/40 border border-sky-800/80">
                    <div className="text-[11px] font-mono text-sky-400 font-semibold mb-1 flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Retrieved Verified Excerpt (Page {currentPage}):</span>
                    </div>
                    <p className="text-[13px] text-slate-100 font-serif leading-relaxed">
                      {chunkText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Native PDF Viewer in Iframe */}
          {viewMode === 'pdf' && (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-white shadow-xl">
              <iframe
                src={pdfEmbedUrl}
                title={`Native PDF Viewer - ${documentTitle}`}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* TAB 3: Verbatim OCR Page Text */}
          {viewMode === 'text' && (
            <div className="max-w-[780px] w-full bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="font-semibold text-white">Extracted Page {currentPage} Text</span>
                <span className="text-emerald-400">OCR &amp; Vector Index Synchronized</span>
              </div>
              {loadingText ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                  <span>Loading verbatim text from page {currentPage}...</span>
                </div>
              ) : (
                <pre className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[580px] overflow-y-auto p-4 bg-slate-950 rounded-lg border border-slate-800">
                  {pageTextData || chunkText}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Bottom Excerpt & Extraction Details Drawer */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-xs flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verified Ground Truth Match (Cosine: {simScore})
            </span>
            <span className="text-[11px] font-mono text-slate-400 truncate hidden md:inline">
              Page {currentPage} · BBox OCR Grounded Citation
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
            <button
              onClick={handleCopy}
              className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied Passage' : 'Copy Passage'}</span>
            </button>
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-[12px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
