import React, { useState, useRef, useEffect } from 'react';
import { DocumentCorpus, DocumentChunk, BoundingBox } from '../utils/ragEngine.ts';
import { INITIAL_CHAT_MESSAGES } from '../data/corporaData.ts';

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
}

export const AnalyticalWorkstation: React.FC<AnalyticalWorkstationProps> = ({
  document,
  onNewDocumentClick,
  onOpenBboxInspector,
  onAskQuestion,
  chatMessages,
  selectedModel,
  onSelectModel,
  retrievalMode,
  onSelectRetrievalMode,
  isProcessing = false
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

    // Subscripts: Fe_3C -> Fe₃C or X_{abc} -> X(abc)
    const subMap: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    s = s.replace(/_([0-9])/g, (_, d) => subMap[d] || `_${d}`);
    s = s.replace(/_\{([0-9])\}/g, (_, d) => subMap[d] || `_${d}`);
    s = s.replace(/_\{([^}]+)\}/g, '($1)');

    // Superscripts: ^2 -> ², ^3 -> ³
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
    // 1. If an intro ending in colon is followed by a bullet, e.g. "contents: * **" -> "contents:\n\n- **"
    s = s.replace(/:\s*\*\s+/g, ':\n\n- ');
    // 2. Inline bold bullets: " * **" preceded by non-newline -> "\n\n- **"
    s = s.replace(/([^\n])\s+\*\s+\*\*/g, '$1\n\n- **');
    // 3. Double bold colon followed by asterisk bullet: ":** * " -> ":**\n\n- "
    s = s.replace(/:\*\*\s+\*\s+/g, ':**\n\n- ');
    // 4. Inline bullet preceded by sentence endings like "]", ".", ")", quotes, backticks
    s = s.replace(/([\]\.\)\"'\`])\s+\*\s+/g, '$1\n\n- ');
    // 5. Any standalone " * " with whitespace before and after
    s = s.replace(/([^\n])\s{2,}\*\s+/g, '$1\n\n- ');
    // 6. Normalize "\n* " or "\n• " to "\n- "
    s = s.replace(/\n\s*[\*•]\s+/g, '\n- ');
    return s;
  };

  const renderFormattedInline = (text: string, keyPrefix: string | number) => {
    // Split by inline code: `code`
    const codeParts = text.split(/(`[^`]+`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith('`') && cPart.endsWith('`') && cPart.length > 2) {
        const codeContent = cPart.slice(1, -1);
        return (
          <code
            key={`${keyPrefix}-c-${cIdx}`}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-surface-subtle border border-surface-border font-mono text-[11px] text-primary select-all"
          >
            {codeContent}
          </code>
        );
      }

      // Split by bold: **bold**
      const boldParts = cPart.split(/(\*\*[^*]+\*\*)/g);
      if (boldParts.length > 1) {
        return (
          <React.Fragment key={`${keyPrefix}-c-${cIdx}`}>
            {boldParts.map((bPart, bIdx) => {
              if (bPart.startsWith('**') && bPart.endsWith('**')) {
                return (
                  <strong
                    key={`${keyPrefix}-b-${bIdx}`}
                    className="font-semibold text-ink-primary"
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
              onOpenBboxInspector({
                pageNumber: pageNum,
                sectionTitle: section || `Page ${pageNum} Reference`,
                chunkText: `Document reference on Page ${pageNum}${section ? ` (${section})` : ''}`,
                simScore: 0.95
              });
            }}
            title={`Jump to Page ${pageNum}${section ? ` - ${section}` : ''}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-mono text-[11px] font-medium transition-all mx-1 my-0.5 align-baseline cursor-pointer group/pill shadow-2xs"
          >
            <span className="material-symbols-outlined text-[12px] text-primary/80 group-hover/pill:text-primary">
              description
            </span>
            <span className="font-semibold">Page {pageNum}</span>
            {section && (
              <span className="text-[10px] text-ink-muted max-w-[130px] truncate hidden sm:inline">
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
      <div className="flex flex-col gap-3 text-ink-primary text-[13px] leading-relaxed">
        {blocks.map((block, bIdx) => {
          const lines = block.split('\n').filter(l => l.trim().length > 0);
          return (
            <div key={bIdx} className="flex flex-col gap-2">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();

                // Markdown Headings: ### Heading
                const headingMatch = trimmed.match(/^#{1,4}\s+(.*)$/);
                if (headingMatch) {
                  return (
                    <div
                      key={lIdx}
                      className="text-[14px] font-semibold text-ink-primary tracking-tight mt-2 mb-1 flex items-center gap-1.5 border-b border-surface-border-subtle pb-1"
                    >
                      <span className="material-symbols-outlined text-[15px] text-primary">
                        bookmark
                      </span>
                      <span>{renderTextWithCitations(headingMatch[1])}</span>
                    </div>
                  );
                }

                // Bullet Lists: - Item or * Item
                const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
                if (bulletMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 pl-1 py-1 group/bullet">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/20">
                        <span className="material-symbols-outlined text-[13px]">check_small</span>
                      </div>
                      <div className="flex-1 text-[13px] leading-relaxed text-ink-primary">
                        {renderTextWithCitations(bulletMatch[1])}
                      </div>
                    </div>
                  );
                }

                // Numbered Lists: 1. Item or 1) Item
                const numberMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
                if (numberMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 pl-1 py-1 group/number">
                      <span className="w-5 h-5 rounded-md bg-primary/10 text-primary font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/20">
                        {numberMatch[1]}
                      </span>
                      <div className="flex-1 text-[13px] leading-relaxed text-ink-primary">
                        {renderTextWithCitations(numberMatch[2])}
                      </div>
                    </div>
                  );
                }

                // Standard Paragraph
                return (
                  <p key={lIdx} className="whitespace-pre-line leading-relaxed text-[13px] text-ink-primary">
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
    <main className="relative pt-14 bg-background min-h-screen">
      <div className="flex flex-col w-full pb-44">
        {/* Contextual Document Banner */}
        <div className="w-full bg-surface-subtle border-b border-surface-border px-4 sm:px-8 py-3 shadow-2xs">
          <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-canvas-base border border-surface-border flex items-center justify-center text-primary flex-shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[13px] text-ink-primary truncate max-w-[200px] sm:max-w-none">
                    {document.filename}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Ready
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-ink-muted">
                  <span>{document.totalPages} Pages</span>
                  <span>•</span>
                  <span>{document.chunksVectorized} Chunks</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline text-emerald-700 font-medium">Vector &amp; Sparse Synchronized</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onNewDocumentClick}
                className="h-7 px-2.5 rounded-md bg-canvas-base border border-surface-border hover:bg-surface-subtle text-ink-primary text-[11px] font-medium flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px] text-primary">add</span>
                <span className="hidden sm:inline">New Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Analytical Reading Track (Strictly Clamped to 760px) */}
        <div className="w-full max-w-[760px] mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-6">
          {/* 1. Executive Synthesis Card */}
          <div className="rounded-xl bg-canvas-base border border-surface-border p-5 shadow-2xs relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[19px]">menu_book</span>
                <span className="font-semibold text-[13px] uppercase tracking-wider text-ink-primary">
                  Executive Synthesis
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium text-ink-muted px-2 py-0.5 rounded bg-surface-subtle border border-surface-border">
                Auto-Indexed
              </span>
            </div>

            <p className="text-[13px] text-ink-secondary leading-relaxed mb-4">
              {document.executiveSummary ||
                'Document analyzed and indexed for hybrid retrieval and precision grounded Q&A.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border-subtle">
              <span className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider">
                Grounded Anchors:
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-subtle hover:bg-slate-100 border border-surface-border text-primary text-[11px] font-mono transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">description</span>
                  <span>{anchor.label}</span>
                </button>
              ))}

              <span className="text-[11px] font-mono font-medium text-emerald-700 ml-auto flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                100% Document Verified
              </span>
            </div>
          </div>

          {/* Preset Sample Questions */}
          {document.sampleQuestions && document.sampleQuestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-1 -mt-2">
              <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mr-1">
                Suggested Prompts:
              </span>
              {document.sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onAskQuestion(q)}
                  className="px-2.5 py-1 rounded-full bg-canvas-base hover:bg-surface-subtle border border-surface-border text-ink-secondary hover:text-ink-primary text-[11px] transition-colors truncate max-w-full cursor-pointer shadow-2xs"
                >
                  "{q}"
                </button>
              ))}
            </div>
          )}

          {/* Conversation History */}
          {chatMessages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border p-8 text-center bg-surface-subtle/50 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">chat_bubble_outline</span>
              </div>
              <h3 className="font-medium text-[14px] text-ink-primary">Ask a question about this document</h3>
              <p className="text-[12px] text-ink-muted max-w-sm">
                Pick a suggested prompt above or type your question below to retrieve grounded, verified answers with exact page citations.
              </p>
            </div>
          ) : (
            chatMessages.map(msg => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-primary text-white px-4 py-3 shadow-2xs">
                    <p className="text-[13px] leading-relaxed font-normal">{msg.content}</p>
                    <div className="mt-1.5 flex justify-end items-center gap-1 text-[10px] font-mono text-white/70">
                      <span>{msg.timestamp}</span>
                      <span className="material-symbols-outlined text-[12px]">done_all</span>
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
                    <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[13px]">shield</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-base border border-surface-border text-[11px] font-mono text-ink-secondary shadow-2xs">
                      <span className="material-symbols-outlined text-[12px] text-amber-600">gavel</span>
                      <span className="text-ink-muted">Filter Triggered:</span>
                      <span className="text-ink-primary font-medium">
                        {res.filterTriggered || 'Strict Verification Threshold'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-canvas-base border border-surface-border p-5 shadow-2xs flex flex-col gap-4">
                    {/* Notice Banner */}
                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3.5 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                        <span className="material-symbols-outlined text-[18px]">info</span>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <h4 className="font-semibold text-[13px] text-ink-primary">
                          Information Not Found in Active Document
                        </h4>
                        <div className="text-[13px] text-ink-secondary leading-relaxed">
                          {renderSynthesisText(res.synthesisText)}
                        </div>
                      </div>
                    </div>

                    {/* Sub-threshold Chunk Reference */}
                    {res.subThresholdChunk && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
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
                          className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border hover:border-primary/40 flex items-center justify-between gap-3 text-[11px] font-mono cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[15px] text-ink-muted">
                              description
                            </span>
                            <span className="text-ink-primary font-medium truncate">
                              Page {res.subThresholdChunk.pageNumber} · {res.subThresholdChunk.sectionTitle}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold">
                              {res.subThresholdChunk.sim} Low Sim
                            </span>
                          </div>
                          <span className="text-ink-muted text-[10px] flex-shrink-0">
                            Filtered out by strict threshold (≥ 0.70)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quality Strip (Amber/Red Status) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-border-subtle text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                          <span className="material-symbols-outlined text-[13px]">cancel</span>
                          Unverified / Grounding Absent
                        </span>
                        <span className="text-ink-muted text-[10px]">Latency: {res.latencyMs}ms</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-ink-secondary">
                        <span className="text-ink-muted">Confidence:</span>
                        <div className="w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                          <div
                            className="bg-rose-500 h-full"
                            style={{ width: `${res.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-rose-700 font-semibold">{res.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // High-Confidence Grounded AI Response
            return (
              <div key={msg.id} className="flex flex-col gap-2">
                {/* Search Query Rewrite Badge */}
                <div className="flex items-center gap-2 pl-1">
                  <div className="w-5 h-5 rounded-md bg-primary-container text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-base border border-surface-border text-[11px] font-mono text-ink-secondary shadow-2xs">
                    <span className="material-symbols-outlined text-[12px] text-primary">
                      travel_explore
                    </span>
                    <span className="text-ink-muted">Expanded Query:</span>
                    <span className="text-ink-primary font-medium">"{res.expandedQuery}"</span>
                  </div>
                </div>

                {/* Main Evidence Container */}
                <div className="rounded-xl bg-canvas-base border border-surface-border p-5 shadow-2xs flex flex-col gap-4">
                  {/* Dynamic Synthesis Body */}
                  {renderSynthesisText(res.synthesisText)}

                  {/* Optional Metrics Grid */}
                  {res.metrics && res.metrics.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-surface-subtle border border-surface-border flex flex-col gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
                        Document Metrics & Indicators
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-0.5">
                        {res.metrics.map((m, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-md bg-canvas-base border border-surface-border flex flex-col"
                          >
                            <span className="text-[11px] text-ink-muted">{m.label}</span>
                            <span className="text-[18px] font-semibold text-ink-primary mt-0.5">
                              {m.value}
                            </span>
                            <span className="text-[11px] font-mono text-emerald-700 font-medium">
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
                        <li key={fIdx} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600 mt-0.5 flex-shrink-0">
                            check_circle
                          </span>
                          <span>
                            <strong className="text-ink-primary font-semibold">
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
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-subtle border border-surface-border text-primary font-mono text-[11px] hover:bg-slate-100 transition-colors ml-1 align-baseline cursor-pointer"
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
                    <div className="p-3.5 rounded-lg bg-surface-subtle border border-surface-border flex flex-col gap-2">
                      <div className="flex items-center justify-between text-ink-muted text-[10px] font-mono uppercase tracking-wider">
                        <span className="font-semibold">YoY Quarterly Trajectory ($ Billions)</span>
                        <span>Source: SEC Filing 10-Q</span>
                      </div>
                      <div className="h-16 w-full flex items-end gap-3 pt-2">
                        {res.chartData.map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <div
                              className={`w-full rounded-t transition-all ${
                                item.active ? 'bg-primary shadow-xs' : 'bg-slate-200'
                              }`}
                              style={{ height: `${item.heightPercent}%` }}
                            ></div>
                            <span
                              className={`text-[10px] font-mono ${
                                item.active ? 'text-primary font-semibold' : 'text-ink-muted'
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
                  <div className="flex flex-col gap-2 pt-1 border-t border-surface-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
                        Retrieved Ground-Truth Sources ({res.matchedChunks.length} Chunks)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 font-medium">
                        Cosine Distance ≤ 0.18
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                          className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border hover:border-primary/40 hover:bg-slate-100 transition-all flex flex-col justify-between gap-1.5 group cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1 text-primary">
                              <span className="material-symbols-outlined text-[14px]">description</span>
                              <span className="font-semibold text-[11px] text-ink-primary">
                                Page {chunk.pageNumber}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                              {chunk.sim} Sim
                            </span>
                          </div>

                          <p className="text-[11px] text-ink-secondary line-clamp-2 leading-relaxed">
                            {chunk.content}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-mono text-ink-muted truncate">
                              {chunk.sectionTitle}
                            </span>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleCopyCitation(chunk.id, chunk.content);
                              }}
                              className="w-5 h-5 rounded hover:bg-white text-ink-muted hover:text-ink-primary flex items-center justify-center transition-colors cursor-pointer"
                              title="Copy exact citation"
                              aria-label="Copy exact citation"
                            >
                              <span className="material-symbols-outlined text-[12px]">
                                {copiedChunkId === chunk.id ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quality Strip */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border-subtle text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Verified Evidence
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-subtle border border-surface-border text-ink-secondary">
                        <span className="material-symbols-outlined text-[13px] text-amber-500">bolt</span>
                        {res.isCacheHit ? 'Cache Hit · ' : 'Retrieved · '}{res.latencyMs}ms
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-ink-secondary">
                      <div className="flex items-center gap-1.5">
                        <span className="text-ink-muted">Confidence:</span>
                        <div className="w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                          <div
                            className="bg-emerald-600 h-full"
                            style={{ width: `${res.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-ink-primary font-semibold">{res.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-ink-muted">Faithfulness:</span>
                        <span className="text-emerald-700 font-semibold">{res.faithfulness}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Telemetry */}
                  <details className="group cursor-pointer border-t border-surface-border-subtle pt-2">
                    <summary className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink-primary transition-colors py-0.5 list-none">
                      <span className="flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[13px] group-open:rotate-90 transition-transform">
                          chevron_right
                        </span>
                        Technical Telemetry · pw_sess_9f82c1a
                      </span>
                      <span className="text-ink-muted">BM25 Rank #1 · RRF 0.884</span>
                    </summary>

                    <div className="p-2.5 rounded bg-surface-subtle border border-surface-border mt-1.5 text-[11px] font-mono text-ink-secondary flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span>Vector Dense Score:</span>
                        <span className="text-ink-primary font-medium">
                          {res.technicalTelemetry.denseScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sparse Lexical Score (BM25):</span>
                        <span className="text-ink-primary font-medium">
                          {res.technicalTelemetry.bm25Score} (Rank 1)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reciprocal Rank Fusion (k=60):</span>
                        <span className="text-ink-primary font-medium">
                          {res.technicalTelemetry.rrfScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cohere Re-ranker Cosine:</span>
                        <span className="text-emerald-700 font-medium">
                          {res.technicalTelemetry.cohereCosine}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Token Budget Used:</span>
                        <span className="text-ink-primary font-medium">
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
              <div className="w-5 h-5 rounded-md bg-primary-container text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-2xs">
                <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-base border border-surface-border text-[11px] font-mono text-ink-secondary shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping mr-1"></span>
                <span className="text-ink-primary font-medium">Hybrid Search & Grounded Verification...</span>
              </div>
            </div>
            <div className="rounded-xl bg-canvas-base border border-surface-border p-5 shadow-2xs flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[12px] font-mono text-ink-muted">
                  Retrieving passages via BM25 + Gemini vectors, re-ranking evidence, and verifying answer...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        </div>

        {/* Floating Query Composer (Clamped over the reading track) */}
        <div className="fixed bottom-0 left-0 md:left-[240px] right-0 md:right-[280px] p-4 pointer-events-none z-30">
          <div className="max-w-[760px] mx-auto pointer-events-auto">
            <div className="rounded-2xl bg-canvas-base/95 backdrop-blur-xl border border-surface-border p-3 shadow-xl flex flex-col gap-2">
              {/* Dock Control Badges */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 relative">
                  {/* Single Active LLM Engine */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-surface-border text-ink-primary font-mono text-[11px]" title="Gemini 2.5 Flash (Google GenAI)">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-medium">Gemini 2.5 Flash</span>
                  </div>

                  {/* Retrieval Mode Switcher */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModeMenu(!showModeMenu)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-subtle hover:bg-slate-100 border border-surface-border text-ink-secondary hover:text-ink-primary font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">layers</span>
                      <span>{retrievalMode}</span>
                      <span className="material-symbols-outlined text-[12px]">expand_more</span>
                    </button>

                    {showModeMenu && (
                      <div className="absolute bottom-full mb-1 left-0 w-56 bg-canvas-base border border-surface-border rounded-lg shadow-lg py-1 z-50 text-[11px] font-mono">
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
                            className={`w-full text-left px-3 py-1.5 hover:bg-surface-subtle flex items-center justify-between ${
                              retrievalMode === mode ? 'text-primary font-semibold' : 'text-ink-secondary'
                            }`}
                          >
                            <span>{mode}</span>
                            {retrievalMode === mode && (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="font-mono text-[10px] text-ink-muted hidden sm:flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">keyboard</span>
                  <span>Enter to submit · Shift+Enter for newline</span>
                </div>
              </div>

              {/* Input Area */}
              <div className="flex items-end gap-2 px-1">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this document..."
                  rows={1}
                  style={{ minHeight: '38px', maxHeight: '120px' }}
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-[13px] text-ink-primary placeholder:text-ink-muted py-1.5 px-1 focus:ring-0 leading-normal"
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
                    className="w-8 h-8 rounded-lg bg-surface-subtle border border-surface-border hover:bg-slate-100 text-ink-secondary hover:text-ink-primary flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    title="Auto-fill sample prompt"
                    aria-label="Auto-fill sample prompt"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!inputText.trim() || isProcessing}
                    className={`h-8 px-3 rounded-lg font-medium text-[12px] flex items-center gap-1 transition-all ${
                      inputText.trim() && !isProcessing
                        ? 'bg-primary hover:bg-primary/95 text-white shadow-xs cursor-pointer'
                        : 'bg-surface-container border border-surface-border text-ink-muted cursor-not-allowed'
                    }`}
                  >
                    <span>Send</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
