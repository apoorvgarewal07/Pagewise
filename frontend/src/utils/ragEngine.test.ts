import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenize,
  computeBM25Score,
  computeRRF,
  expandQuery,
  evaluateVerificationThreshold,
  formatBBox
} from './ragEngine.ts';

test('tokenize splits and filters punctuation and short tokens', () => {
  const terms = tokenize('Revenue grew by 18.4% YoY in Q3 2024!');
  assert.ok(terms.includes('revenue'));
  assert.ok(terms.includes('grew'));
  assert.ok(terms.includes('2024'));
  assert.equal(terms.includes('by'), false); // 'by' <= 2 chars
});

test('computeBM25Score returns positive score for matching terms', () => {
  const query = 'revenue growth cloud infrastructure';
  const doc = 'Consolidated revenue reached $4,821 million with strong cloud infrastructure growth.';
  const score = computeBM25Score(query, doc);
  assert.ok(score > 0, `Expected score > 0, got ${score}`);
});

test('computeBM25Score returns zero when no terms overlap', () => {
  const query = 'autonomous automotive self-driving';
  const doc = 'Clinical trials showed positive primary endpoint outcomes for patients.';
  const score = computeBM25Score(query, doc);
  assert.equal(score, 0);
});

test('computeRRF correctly fuses dense and sparse ranks', () => {
  const rrf = computeRRF(1, 1, 60);
  // 1/61 + 1/61 = 2/61 ≈ 0.033
  assert.ok(rrf > 0.03 && rrf < 0.035, `Unexpected RRF: ${rrf}`);
});

test('expandQuery produces query expansion string', () => {
  const exp = expandQuery('What was the revenue growth?');
  assert.ok(exp.includes('revenue'));
  assert.ok(exp.length > 20);
});

test('evaluateVerificationThreshold gates high vs low scores', () => {
  // Pass threshold (>= 0.70)
  const groundedResult = evaluateVerificationThreshold(0.92, 0.70);
  assert.equal(groundedResult.isGrounded, true);
  assert.ok(groundedResult.confidence >= 90);

  // Sub-threshold (< 0.70)
  const subResult = evaluateVerificationThreshold(0.48, 0.70);
  assert.equal(subResult.isGrounded, false);
  assert.ok(subResult.confidence < 50);
});

test('formatBBox formats bounding box string', () => {
  const bbox = { page: 4, x: 12.5, y: 34.0, width: 75.2, height: 18.0 };
  const str = formatBBox(bbox);
  assert.equal(str, 'p.4 [12.5%, 34.0%, 75.2%x18.0%]');
});
