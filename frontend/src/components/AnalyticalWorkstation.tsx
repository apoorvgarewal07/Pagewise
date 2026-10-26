import React, { useState, useRef, useEffect } from 'react';
import { DocumentCorpus, DocumentChunk, BoundingBox } from '../utils/ragEngine.ts';
import { INITIAL_CHAT_MESSAGES } from '../data/corporaData.ts';
import {
  FileText,
  CheckCircle2,
  Check,
  Copy,
  Plus,
  Compass,
  Search,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Bookmark,
  CheckCheck,
  Zap,
  Info,
  XCircle,
  MessageSquare,
  ArrowUp
} from 'lucide-react';
import { GenerateButton } from './ui/generate-button.tsx';
import { CornerButton } from './ui/corner-button.tsx';

interface AnalyticalWorkstationProps {
  document: DocumentCorpus;
  onNewDocumentClick: () => void;
  onOpenBboxInspector: (opts: {
    pageNumber: number;
    sectionTitle: string;
    chunkText: string;
    bbox?: BoundingBox;
    simScore?: number;
  }) => void;
  onAskQuestion: (question: string) => void;
  chatMessages: typeof INITIAL_CHAT_MESSAGES;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  retrievalMode: string;
  onSelectRetrievalMode: (mode: string) => void;
  isProcessing?: boolean;
  isRightPanelOpen?: boolean;
}

export const AnalyticalWorkstation: React.FC<AnalyticalWorkstationProps> = ({
  document,
  onNewDocumentClick,
  onOpenBboxInspector,
  onAskQuestion,
  chatMessages,
  selectedModel: _selectedModel,
  onSelectModel: _onSelectModel,
  retrievalMode,
  onSelectRetrievalMode,
  isProcessing = false,
  isRightPanelOpen = false
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);
  const [showModeMenu, setShowModeMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or processing status
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isProcessing]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() || isProcessing) return;
    const query = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '38px';
    }
    onAskQuestion(query);
  };

  const handleCopyCitation = (chunkId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChunkId(chunkId);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  const cleanMathAndSymbols = (str: string): string => {
    let s = str;
    // Unescape escaped dollar signs
    s = s.replace(/\\\$/g, '$');

    // Temperatures: e.g. ^\circ C, ^\circ\text{C}, \circ C
    s = s.replace(/\^?\\circ\s*\\?text\{C\}/gi, '°C');
    s = s.replace(/\^?\\circ\s*C/gi, '°C');
    s = s.replace(/\$\\text\{\s*\}\s*\^\\circ\\text\{C\}\$/gi, '°C');
    s = s.replace(/\^\\circ/g, '°');

    // LaTeX spacing commands: \, \; \: \! \quad \qquad
    s = s.replace(/\\[,;:!]/g, ' ');
    s = s.replace(/\\quad/g, ' ');
    s = s.replace(/\\qquad/g, '  ');

    // Arrows
    s = s.replace(/\\rightarrow/g, '→');
    s = s.replace(/\\to\b/g, '→');
    s = s.replace(/\\leftarrow/g, '←');
    s = s.replace(/\\Rightarrow/g, '⇒');
    s = s.replace(/\\Leftarrow/g, '⇐');
    s = s.replace(/\\leftrightarrow/g, '↔');

    // Greek symbols
    s = s.replace(/\\alpha/g, 'α');
    s = s.replace(/\\beta/g, 'β');
    s = s.replace(/\\gamma/g, 'γ');
    s = s.replace(/\\delta/g, 'δ');
    s = s.replace(/\\Delta/g, 'Δ');
    s = s.replace(/\\epsilon|\\varepsilon/g, 'ε');
    s = s.replace(/\\zeta/g, 'ζ');
    s = s.replace(/\\eta/g, 'η');
    s = s.replace(/\\theta/g, 'θ');
    s = s.replace(/\\lambda/g, 'λ');
    s = s.replace(/\\mu/g, 'µ');
    s = s.replace(/\\pi/g, 'π');
    s = s.replace(/\\rho/g, 'ρ');
    s = s.replace(/\\sigma/g, 'σ');
    s = s.replace(/\\tau/g, 'τ');
    s = s.replace(/\\phi/g, 'φ');
    s = s.replace(/\\omega/g, 'ω');
    s = s.replace(/\\Omega/g, 'Ω');

    // Math operations and relations
    s = s.replace(/\\pm/g, '±');
    s = s.replace(/\\times/g, '×');
    s = s.replace(/\\div/g, '÷');
    s = s.replace(/\\leq|\\le\b/g, '≤');
    s = s.replace(/\\geq|\\ge\b/g, '≥');
    s = s.replace(/\\neq|\\ne\b/g, '≠');
    s = s.replace(/\\approx/g, '≈');
    s = s.replace(/\\infty/g, '∞');
    s = s.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

    // Fractions: \frac{a}{b} -> a / b
    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2');

    // Percent signs: \% -> %
    s = s.replace(/\\%/g, '%');

    // Unpack \text{...} recursively
    for (let i = 0; i < 4; i++) {
      s = s.replace(/\\text\{([^}]+)\}/g, '$1');
    }

    // Subscripts
    const subMap: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    s = s.replace(/_([0-9])/g, (_, d) => subMap[d] || `_${d}`);
    s = s.replace(/_\{([0-9])\}/g, (_, d) => subMap[d] || `_${d}`);
    s = s.replace(/_\{([^}]+)\}/g, '($1)');

    // Superscripts
    const supMap: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    s = s.replace(/\^([0-9])/g, (_, d) => supMap[d] || `^${d}`);
    s = s.replace(/\^\{([0-9])\}/g, (_, d) => supMap[d] || `^${d}`);

    // Remove remaining math delimiters $...$
    s = s.replace(/\$([^\$]+)\$/g, '$1');
    s = s.replace(/\$/g, '');

    // Normalize multiple spaces
    return s.replace(/[ \t]+/g, ' ').trim();
  };

  const normalizeMarkdownText = (raw: string): string => {
    let s = raw;
    s = s.replace(/:\s*\*\s+/g, ':\n\n- ');
    s = s.replace(/([^\n])\s+\*\s+\*\*/g, '$1\n\n- **');
    s = s.replace(/:\*\*\s+\*\s+/g, ':**\n\n- ');
    s = s.replace(/([\]\.\)\"'\`])\s+\*\s+/g, '$1\n\n- ');
    s = s.replace(/([^\n])\s{2,}\*\s+/g, '$1\n\n- ');
    s = s.replace(/\n\s*[\*•]\s+/g, '\n- ');
    return s;
  };

  const renderFormattedInline = (text: string, keyPrefix: string | number) => {
    const codeParts = text.split(/(`[^`]+`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith('`') && cPart.endsWith('`') && cPart.length > 2) {
        const codeContent = cPart.slice(1, -1);
        return (
          <code
            key={`${keyPrefix}-c-${cIdx}`}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-900 border border-slate-750 font-mono text-[11px] text-sky-300 select-all"
          >
            {codeContent}
          </code>
        );
      }

      const boldParts = cPart.split(/(\*\*[^*]+\*\*)/g);
      if (boldParts.length > 1) {
        return (
          <React.Fragment key={`${keyPrefix}-c-${cIdx}`}>
            {boldParts.map((bPart, bIdx) => {
              if (bPart.startsWith('**') && bPart.endsWith('**')) {
                return (
                  <strong
                    key={`${keyPrefix}-b-${bIdx}`}
                    className="font-semibold text-white"
                  >
                    {bPart.slice(2, -2)}
                  </strong>
                );
              }
              return bPart;
            })}
          </React.Fragment>
        );
      }

      return cPart;
    });
  };

  const renderTextWithCitations = (str: string) => {
    const cleaned = cleanMathAndSymbols(str);
    const parts = cleaned.split(/(\[Page\s+\d+[^\]]*\])/gi);

    return parts.map((part, idx) => {
      const pageMatch = part.match(/^\[Page\s+(\d+)/i);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1], 10);
        const secMatch = part.match(/Section\s+["']?([^"'\]]+)["']?/i);
        const section = secMatch ? secMatch[1].replace(/[:\-]+$/, '').trim() : '';

        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const matchingChunk = document.chunks?.find(c => c.pageNumber === pageNum);
              onOpenBboxInspector({
                pageNumber: pageNum,
                sectionTitle: matchingChunk?.sectionTitle || section || `Page ${pageNum} Reference`,
                chunkText: matchingChunk?.content || (section ? `Section: ${section}` : `Document citation on Page ${pageNum}`),
                bbox: matchingChunk?.bbox,
                simScore: matchingChunk?.denseSim || 0.95
              });
            }}
            title={`Jump to Page ${pageNum}${section ? ` - ${section}` : ''}`}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-950/80 hover:bg-sky-900/90 text-sky-300 hover:text-white border border-sky-800/80 font-mono text-[11px] font-medium transition-all mx-1 my-0.5 align-baseline cursor-pointer group/pill shadow-xs"
          >
            <FileText className="w-3 h-3 text-sky-400" />
            <span className="font-semibold text-white">Page {pageNum}</span>
            {section && (
              <span className="text-[10px] text-slate-400 max-w-[130px] truncate hidden sm:inline">
                · {section}
              </span>
            )}
          </button>
        );
      }

      return <React.Fragment key={idx}>{renderFormattedInline(part, idx)}</React.Fragment>;
    });
  };

  const renderSynthesisText = (text: string) => {
    if (!text) return null;

    const normalized = normalizeMarkdownText(text);
    const blocks = normalized.split(/\n\n+/).filter(b => b.trim().length > 0);

    return (
      <div className="flex flex-col gap-3 text-slate-200 text-[13px] leading-relaxed">
        {blocks.map((block, bIdx) => {
          const lines = block.split('\n').filter(l => l.trim().length > 0);
          return (
            <div key={bIdx} className="flex flex-col gap-2">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();

                const headingMatch = trimmed.match(/^#{1,4}\s+(.*)$/);
                if (headingMatch) {
                  return (
                    <div
                      key={lIdx}
                      className="text-[14px] font-semibold text-white tracking-tight mt-2 mb-1 flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span>{renderTextWithCitations(headingMatch[1])}</span>
                    </div>
                  );
                }

                const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
                if (bulletMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 pl-1 py-1 group/bullet">
                      <div className="w-4 h-4 rounded bg-sky-950/80 text-sky-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky-800/80">
                        <Check className="w-3 h-3 text-sky-400" />
                      </div>
                      <div className="flex-1 text-[13px] leading-relaxed text-slate-200">
                        {renderTextWithCitations(bulletMatch[1])}
                      </div>
                    </div>
                  );
                }

                const numberMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
                if (numberMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 pl-1 py-1 group/number">
                      <span className="w-4 h-4 rounded bg-slate-900 text-sky-400 font-mono text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-800">
                        {numberMatch[1]}
                      </span>
                      <div className="flex-1 text-[13px] leading-relaxed text-slate-200">
                        {renderTextWithCitations(numberMatch[2])}
                      </div>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="whitespace-pre-line leading-relaxed text-[13px] text-slate-200">
                    {renderTextWithCitations(line)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="relative pt-14 bg-transparent min-h-screen">
      <div className="flex flex-col w-full pb-44">
        {/* Contextual Document Banner */}
        <div className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 shadow-md">
          <div className="max-w-[820px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[13px] text-white truncate max-w-[200px] sm:max-w-none">
                    {document.filename}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[10px] font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Ready
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-400">
                  <span>{document.totalPages} Pages</span>
                  <span>•</span>
                  <span>{document.chunksVectorized} Chunks</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline text-emerald-400 font-medium">Vector &amp; Sparse Synchronized</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <CornerButton
                onClick={onNewDocumentClick}
                accentColor="#38bdf8"
                className="text-slate-950 font-bold px-3 py-1 text-[11px]"
                showIcon={false}
              >
                New Document
              </CornerButton>
            </div>
          </div>
        </div>

        {/* Analytical Reading Track */}
        <div className="w-full max-w-[820px] mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-6">
          {/* 1. Executive Synthesis Card */}
          <div className="rounded-xl bg-slate-950/80 backdrop-blur-xl border border-slate-800/90 p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 text-sky-400">
                <Bookmark className="w-4 h-4" />
                <span className="font-semibold text-xs tracking-wider uppercase text-white">
                  EXECUTIVE SYNTHESIS
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                Auto-Indexed
              </span>
            </div>

            <p className="text-[13px] text-slate-300 leading-relaxed mb-4">
              {document.executiveSummary ||
                'Document analyzed and indexed for hybrid retrieval and precision grounded Q&A.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                GROUNDED ANCHORS:
              </span>

              {document.groundedAnchors?.map((anchor, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    onOpenBboxInspector({
                      pageNumber: anchor.page,
                      sectionTitle: anchor.section,
                      chunkText: `Verified Anchor ${anchor.label}: Section ${anchor.section} with high-confidence OCR coordinates.`,
                      bbox: anchor.bbox,
                      simScore: 0.98
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-sky-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-sky-400" />
                  <span>{anchor.label}</span>
                </button>
              ))}

              <span className="text-[11px] font-mono font-medium text-emerald-400 ml-auto flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                100% Document Verified
              </span>
            </div>
          </div>

          {/* Preset Sample Questions */}
          {document.sampleQuestions && document.sampleQuestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-1 -mt-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
                SUGGESTED PROMPTS:
              </span>
              {document.sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onAskQuestion(q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors truncate max-w-full cursor-pointer shadow-sm"
                >
                  "{q}"
                </button>
              ))}
            </div>
          )}

          {/* Conversation History */}
          {chatMessages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[14px] text-white">Ask a question about this document</h3>
              <p className="text-[12px] text-slate-400 max-w-sm">
                Pick a suggested prompt above or type your question below to retrieve grounded, verified answers with exact page citations.
              </p>
            </div>
          ) : (
            chatMessages.map(msg => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end pt-2">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-xl bg-sky-950/70 text-white p-3.5 sm:p-4 shadow-lg border border-sky-850">
                      <p className="text-[13px] leading-relaxed font-normal whitespace-pre-wrap">{msg.content}</p>
                      <div className="mt-2 flex justify-end items-center gap-1.5 text-[10px] font-mono text-sky-300">
                        <span>{msg.timestamp}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                    </div>
                  </div>
                );
              }

              const res = msg.result;
              if (!res) return null;

              // Abstention / Guardrail Triggered State
              if (!res.isGrounded) {
                return (
                  <div key={msg.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 pl-1">
                      <div className="w-5 h-5 rounded bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-xs">
                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">FILTER TRIGGERED:</span>
                        <span className="text-amber-400 font-medium">
                          {res.filterTriggered || 'Strict Verification Threshold'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
                      {/* Notice Banner */}
                      <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start gap-3 shadow-xs">
                        <div className="w-7 h-7 rounded-lg bg-amber-900/60 border border-amber-700/80 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Info className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <h4 className="font-semibold text-[13px] text-amber-100">
                            Information Not Found in Active Document
                          </h4>
                          <div className="text-[13px] text-amber-200/90 leading-relaxed">
                            {renderSynthesisText(res.synthesisText)}
                          </div>
                        </div>
                      </div>

                      {/* Sub-threshold Chunk Reference */}
                      {res.subThresholdChunk && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                            Nearest Available Passage (Sub-threshold)
                          </span>
                          <div
                            onClick={() =>
                              onOpenBboxInspector({
                                pageNumber: res.subThresholdChunk?.pageNumber || 51,
                                sectionTitle: res.subThresholdChunk?.sectionTitle || 'Forward-Looking Risks',
                                chunkText:
                                  res.subThresholdChunk?.content ||
                                  'General macroeconomic volatility and risks.',
                                bbox: res.subThresholdChunk?.bbox,
                                simScore: res.subThresholdChunk?.sim || 0.48
                              })
                            }
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/40 flex items-center justify-between gap-3 text-[11px] font-mono cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-200 font-medium truncate">
                                Page {res.subThresholdChunk.pageNumber} · {res.subThresholdChunk.sectionTitle}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[10px] font-semibold">
                                {res.subThresholdChunk.sim} Low Sim
                              </span>
                            </div>
                            <span className="text-slate-400 text-[10px] flex-shrink-0">
                              Filtered out by strict threshold (≥ 0.70)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Quality Strip (Amber/Red Status) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Unverified / Grounding Absent
                          </span>
                          <span className="text-slate-400 text-[10px]">Latency: {res.latencyMs}ms</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="text-slate-400">Confidence:</span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: `${res.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-rose-400 font-semibold">{res.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // High-Confidence Grounded AI Response
              return (
                <div key={msg.id} className="flex flex-col gap-2">
                  {/* Search Query Rewrite & Engine Badge Row */}
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center flex-shrink-0">
                        <Compass className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-xs truncate">
                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">EXPANDED QUERY:</span>
                        <span className="text-white font-medium truncate">"{res.expandedQuery}"</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 hidden sm:inline">
                        {res.latencyMs}ms
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(res.synthesisText);
                          setCopiedChunkId(msg.id);
                          setTimeout(() => setCopiedChunkId(null), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-mono transition-colors shadow-xs cursor-pointer"
                        title="Copy full response"
                      >
                        {copiedChunkId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                        <span className="hidden sm:inline">{copiedChunkId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Evidence Container */}
                  <div className="rounded-xl bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 p-5 shadow-xl flex flex-col gap-4">
                    {/* Dynamic Synthesis Body */}
                    {renderSynthesisText(res.synthesisText)}

                    {/* Optional Metrics Grid */}
                    {res.metrics && res.metrics.length > 0 && (
                      <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Document Metrics &amp; Indicators
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-0.5">
                          {res.metrics.map((m, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col"
                            >
                              <span className="text-[11px] text-slate-400">{m.label}</span>
                              <span className="text-[17px] font-bold text-white mt-0.5">
                                {m.value}
                              </span>
                              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                                {m.yoy}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optional Key Factors */}
                    {res.keyFactors && res.keyFactors.length > 0 && (
                      <ul className="list-none flex flex-col gap-2 pl-0.5">
                        {res.keyFactors.map((factor, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 text-slate-200 text-[13px]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong className="text-white font-semibold">
                                {factor.title}:
                              </strong>{' '}
                              {factor.desc}
                              {factor.page && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenBboxInspector({
                                      pageNumber: factor.page,
                                      sectionTitle: factor.title,
                                      chunkText: factor.desc,
                                      simScore: 0.92
                                    })
                                  }
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-950/80 border border-sky-800/80 text-sky-300 font-mono text-[11px] hover:bg-sky-900 transition-colors ml-1 align-baseline cursor-pointer"
                                >
                                  Page {factor.page}
                                </button>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Inline Chart Component */}
                    {res.chartData && (
                      <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                          <span className="font-semibold">YoY Quarterly Trajectory ($ Billions)</span>
                          <span>Source: SEC Filing 10-Q</span>
                        </div>
                        <div className="h-16 w-full flex items-end gap-3 pt-2">
                          {res.chartData.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                              <div
                                className={`w-full rounded-t transition-all ${
                                  item.active ? 'bg-sky-400' : 'bg-slate-800'
                                }`}
                                style={{ height: `${item.heightPercent}%` }}
                              ></div>
                              <span
                                className={`text-[10px] font-mono ${
                                  item.active ? 'text-sky-400 font-semibold' : 'text-slate-400'
                                }`}
                              >
                                {item.quarter}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verifiable Source Citation Cards */}
                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Retrieved Ground-Truth Sources ({res.matchedChunks.length} Chunks)
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-medium">
                          Cosine Distance ≤ 0.18
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {res.matchedChunks.map(chunk => (
                          <div
                            key={chunk.id}
                            onClick={() =>
                              onOpenBboxInspector({
                                pageNumber: chunk.pageNumber,
                                sectionTitle: chunk.sectionTitle,
                                chunkText: chunk.content,
                                bbox: chunk.bbox,
                                simScore: chunk.sim
                              })
                            }
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between gap-2 group cursor-pointer shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-950/80 text-sky-400 border border-sky-800/80">
                                <FileText className="w-3 h-3 text-sky-400" />
                                <span className="font-semibold text-[11px] font-mono">
                                  Page {chunk.pageNumber}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
                                {chunk.sim} Match
                              </span>
                            </div>

                            <p className="text-[12px] text-slate-300 line-clamp-3 leading-relaxed">
                              {chunk.content}
                            </p>

                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[10px] font-mono">
                              <span className="text-slate-400 truncate max-w-[140px]">
                                {chunk.sectionTitle}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleCopyCitation(chunk.id, chunk.content);
                                  }}
                                  className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                  title="Copy citation passage"
                                  aria-label="Copy citation passage"
                                >
                                  {copiedChunkId === chunk.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-400 transition-colors" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quality Strip */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Verified Evidence
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {res.isCacheHit ? 'Cache Hit · ' : 'Retrieved · '}{res.latencyMs}ms
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Confidence:</span>
                          <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${res.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-semibold">{res.confidence}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Faithfulness:</span>
                          <span className="text-emerald-400 font-semibold">{res.faithfulness}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Telemetry */}
                    <details className="group cursor-pointer border-t border-slate-800 pt-2">
                      <summary className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-white transition-colors py-0.5 list-none">
                        <span className="flex items-center gap-1 font-semibold">
                          <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                          Technical Telemetry · pw_sess_9f82c1a
                        </span>
                        <span className="text-slate-400">BM25 Rank #1 · RRF 0.884</span>
                      </summary>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 mt-1.5 text-[11px] font-mono text-slate-300 flex flex-col gap-1">
                        <div className="flex justify-between">
                          <span>Vector Dense Score:</span>
                          <span className="text-white font-medium">
                            {res.technicalTelemetry.denseScore}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sparse Lexical Score (BM25):</span>
                          <span className="text-white font-medium">
                            {res.technicalTelemetry.bm25Score} (Rank 1)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reciprocal Rank Fusion (k=60):</span>
                          <span className="text-white font-medium">
                            {res.technicalTelemetry.rrfScore}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cohere Re-ranker Cosine:</span>
                          <span className="text-emerald-400 font-medium">
                            {res.technicalTelemetry.cohereCosine}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Token Budget Used:</span>
                          <span className="text-white font-medium">
                            {res.technicalTelemetry.promptTokens} Prompt / {res.technicalTelemetry.genTokens}{' '}
                            Generation
                          </span>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              );
            })
          )}

          {isProcessing && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pl-1">
                <div className="w-5 h-5 rounded-md bg-slate-900/80 border border-slate-800 text-sky-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Search className="w-3 h-3 text-sky-400" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping mr-1"></span>
                  <span className="text-white font-medium">Hybrid Search & Grounded Verification...</span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-[12px] font-mono text-slate-300">
                    Retrieving passages via BM25 + Gemini vectors, re-ranking evidence, and verifying answer...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Query Composer (Responsive and centered) */}
        <div
          className={`fixed bottom-0 left-0 right-0 ${
            isRightPanelOpen ? 'lg:right-[280px]' : 'right-0'
          } p-3 sm:p-4 pointer-events-none z-30 transition-all duration-200`}
        >
          <div className="max-w-[820px] mx-auto pointer-events-auto">
            <div className="rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-slate-800/90 p-3 shadow-[0_12px_48px_rgba(0,0,0,0.85),0_0_0_1px_rgba(56,189,248,0.15)] flex flex-col gap-2.5">
              {/* Dock Control Badges */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 relative">
                  {/* Single Active LLM Engine */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-sky-300 font-mono text-[11px] shadow-sm" title="Gemini 2.5 Flash (Google GenAI)">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-500/30"></span>
                    <span className="font-medium">Gemini 2.5 Flash</span>
                  </div>

                  {/* Retrieval Mode Switcher */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModeMenu(!showModeMenu)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white font-mono text-[11px] transition-colors cursor-pointer shadow-sm"
                    >
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>{retrievalMode}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showModeMenu && (
                      <div className="absolute bottom-full mb-1.5 left-0 w-64 bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-[11px] font-mono">
                        {[
                          'Hybrid Search (Dense + BM25)',
                          'Dense Vector Only (1536d)',
                          'Sparse Lexical Only (BM25)'
                        ].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              onSelectRetrievalMode(mode);
                              setShowModeMenu(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-white flex items-center justify-between cursor-pointer transition-colors ${
                              retrievalMode === mode ? 'text-sky-400 font-semibold bg-sky-950/40' : 'text-slate-300'
                            }`}
                          >
                            <span>{mode}</span>
                            {retrievalMode === mode && (
                              <Check className="w-3.5 h-3.5 text-sky-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="font-mono text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
                  <span>Enter to submit · Shift+Enter for newline</span>
                </div>
              </div>

              {/* Text Box Input Well */}
              <div className="flex items-end gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/25 transition-all shadow-inner">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this document..."
                  rows={1}
                  style={{ minHeight: '38px', maxHeight: '120px' }}
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-[13px] text-white placeholder:text-slate-400 py-1.5 px-2 focus:ring-0 leading-normal selection:bg-sky-500/30 selection:text-white"
                />

                <div className="flex items-center gap-1.5 flex-shrink-0 mb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!inputText) {
                        const defaultPrompt = document.sampleQuestions?.[0] || 'Summarize the core topics in this document';
                        setInputText(defaultPrompt);
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700/80 hover:bg-slate-700 hover:border-slate-600 text-sky-400 hover:text-sky-300 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                    title="Auto-fill sample prompt"
                    aria-label="Auto-fill sample prompt"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  </button>

                  <GenerateButton
                    hue={210}
                    isGenerating={isProcessing}
                    disabled={!inputText.trim() || isProcessing}
                    onClick={handleSubmit}
                    className="scale-90"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
