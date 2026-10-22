export interface BoundingBox {
  page: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number;
  height: number;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  pageNumber: number;
  sectionTitle: string;
  content: string;
  bbox: BoundingBox;
  denseVector?: number[];
  denseSim?: number;
  bm25Score?: number;
  rrfScore?: number;
}

export interface GroundedAnchor {
  label: string;
  page: number;
  section: string;
  bbox: BoundingBox;
}

export interface DocumentCorpus {
  id: string;
  filename: string;
  totalPages: number;
  chunksVectorized: number;
  status: 'Synced' | 'Ready' | 'Processing' | 'Failed';
  analyzedTimeAgo: string;
  vectorizationPercent: number;
  sparseAndDenseSync: boolean;
  executiveSummary?: string;
  groundedAnchors?: GroundedAnchor[];
  chunks: DocumentChunk[];
  sampleQuestions?: string[];
}

export interface RagResponseResult {
  query: string;
  expandedQuery: string;
  isGrounded: boolean;
  confidence: number;
  faithfulness: number;
  latencyMs: number;
  isCacheHit: boolean;
  matchedChunks: (DocumentChunk & { sim: number; rank: number })[];
  subThresholdChunk?: DocumentChunk & { sim: number };
  synthesisText: string;
  metrics?: { label: string; value: string; yoy: string }[];
  keyFactors?: { title: string; desc: string; page: number }[];
  chartData?: { quarter: string; heightPercent: number; active?: boolean }[];
  filterTriggered?: string;
  technicalTelemetry: {
    denseScore: number;
    bm25Score: number;
    rrfScore: number;
    cohereCosine: number;
    promptTokens: number;
    genTokens: number;
  };
}

/**
 * Basic word tokenizer for BM25 lexical matching
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

/**
 * Computes BM25 lexical score for a query against a document chunk
 */
export function computeBM25Score(query: string, documentText: string, k1 = 1.2, b = 0.75): number {
  const queryTerms = tokenize(query);
  const docTerms = tokenize(documentText);
  if (queryTerms.length === 0 || docTerms.length === 0) return 0;

  const docLength = docTerms.length;
  const avgDocLength = 50; // normalized baseline length

  let score = 0;
  const docTermFreqs: Record<string, number> = {};
  for (const term of docTerms) {
    docTermFreqs[term] = (docTermFreqs[term] || 0) + 1;
  }

  for (const term of queryTerms) {
    const f = docTermFreqs[term] || 0;
    if (f > 0) {
      const idf = 2.5; // approximated IDF for single-document corpus
      const numerator = f * (k1 + 1);
      const denominator = f + k1 * (1 - b + b * (docLength / avgDocLength));
      score += idf * (numerator / denominator);
    }
  }

  return Math.round(score * 100) / 100;
}

/**
 * Reciprocal Rank Fusion (RRF) computation
 * formula: score = 1 / (k + rank_bm25) + 1 / (k + rank_dense)
 */
export function computeRRF(bm25Rank: number, denseRank: number, k = 60): number {
  const rrf = (1 / (k + bm25Rank)) + (1 / (k + denseRank));
  return Math.round(rrf * 1000) / 1000;
}

/**
 * Query expansion generator to enhance retrieval recall
 */
export function expandQuery(query: string): string {
  const cleaned = query.trim().replace(/[?!.,]/g, '');
  if (/revenue|growth|operational drivers/i.test(cleaned)) {
    return 'YoY revenue growth Q3 2024 primary drivers operational segments';
  }
  if (/supply chain|disruptions|shortage/i.test(cleaned)) {
    return 'Q4 supply chain logistics disruptions inventory lead-time projections';
  }
  if (/margin|profit|ebitda/i.test(cleaned)) {
    return 'operating margin cloud gross margin datacenter silicon leverage';
  }
  return `${cleaned} primary quantitative evidence and source metrics`;
}

/**
 * Strict verification threshold arbiter
 * If cosine similarity / grounding score < 0.70, triggers abstention guardrail
 */
export function evaluateVerificationThreshold(
  topChunkScore: number,
  threshold = 0.70
): { isGrounded: boolean; confidence: number; faithfulness: number } {
  if (topChunkScore >= threshold) {
    const confidence = Math.min(99, Math.round(topChunkScore * 100 + 4));
    const faithfulness = Math.min(99.5, Math.round(topChunkScore * 100 + 6.4 * 10) / 10);
    return { isGrounded: true, confidence, faithfulness };
  } else {
    const confidence = Math.max(15, Math.round(topChunkScore * 80));
    return { isGrounded: false, confidence, faithfulness: 0 };
  }
}

/**
 * Formats bounding box string for display
 */
export function formatBBox(bbox: BoundingBox): string {
  return `p.${bbox.page} [${bbox.x.toFixed(1)}%, ${bbox.y.toFixed(1)}%, ${bbox.width.toFixed(1)}%x${bbox.height.toFixed(1)}%]`;
}
