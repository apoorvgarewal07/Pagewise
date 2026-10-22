import { DocumentCorpus, RagResponseResult } from '../utils/ragEngine.ts';

export const SAMPLE_CORPORA: DocumentCorpus[] = [
  {
    id: 'sec-q3-10k',
    filename: 'sec-q3-form-10k.pdf',
    totalPages: 48,
    chunksVectorized: 312,
    status: 'Synced',
    analyzedTimeAgo: 'Analyzed 45m ago',
    vectorizationPercent: 100,
    sparseAndDenseSync: true,
    executiveSummary:
      'Q3 fiscal performance shows marked acceleration with consolidated revenue outperforming consensus projections by 4.2%. Strong margin expansion in enterprise cloud infrastructure offset softer cyclical enterprise hardware refresh cycles.',
    groundedAnchors: [
      {
        label: '[Page 2 · Exec Summary]',
        page: 2,
        section: 'Executive Summary & Operational Review',
        bbox: { page: 2, x: 8, y: 18, width: 84, height: 22 }
      },
      {
        label: '[Page 4 · Highlights Table]',
        page: 4,
        section: 'Financial Performance Highlights',
        bbox: { page: 4, x: 8, y: 28, width: 84, height: 35 }
      }
    ],
    sampleQuestions: [
      'What was the year-over-year revenue growth and what were the primary operational drivers?',
      'Are there any mentions of supply chain disruptions impacting Q4 projections?',
      'What is the operating cash flow compared to capital expenditures?'
    ],
    chunks: [
      {
        id: 'chunk-p4-1',
        docId: 'sec-q3-10k',
        pageNumber: 4,
        sectionTitle: 'Financial Highlights',
        content:
          'Consolidated revenue reached $4,821 million, an 18.4% increase from $4,072 million reported in Q3 of the prior fiscal period. Net income totaled $1,180 million, compared to $915 million in the comparative prior period.',
        bbox: { page: 4, x: 8.5, y: 26.0, width: 83.0, height: 18.5 },
        denseSim: 0.94,
        bm25Score: 18.42,
        rrfScore: 0.884
      },
      {
        id: 'chunk-p12-1',
        docId: 'sec-q3-10k',
        pageNumber: 12,
        sectionTitle: 'Segment Breakdown',
        content:
          'Cloud infrastructure revenues advanced to $2,140M as hyperscale demand persisted, marking continuous segment expansion. Enterprise subscription renewals increased by 32% year-over-year.',
        bbox: { page: 12, x: 8.5, y: 38.0, width: 83.0, height: 21.0 },
        denseSim: 0.89,
        bm25Score: 14.15,
        rrfScore: 0.842
      },
      {
        id: 'chunk-p18-1',
        docId: 'sec-q3-10k',
        pageNumber: 18,
        sectionTitle: 'Operational Review',
        content:
          'Operating margin leverage reflected lower unit server energy consumption and supply-chain negotiated discounts. Cloud gross margin widened by 280 bps to 71.4% driven by custom ASIC utilization.',
        bbox: { page: 18, x: 8.5, y: 52.0, width: 83.0, height: 19.0 },
        denseSim: 0.82,
        bm25Score: 11.80,
        rrfScore: 0.798
      },
      {
        id: 'chunk-p51-1',
        docId: 'sec-q3-10k',
        pageNumber: 51,
        sectionTitle: 'Forward-Looking Risks',
        content:
          'General macroeconomic volatility, currency fluctuations, and geopolitical risks may impact future periods. The company does not provide specific quarterly manufacturing unit projections.',
        bbox: { page: 51, x: 10.0, y: 60.0, width: 80.0, height: 15.0 },
        denseSim: 0.48,
        bm25Score: 3.10,
        rrfScore: 0.320
      }
    ]
  },
  {
    id: 'q3-financial-report',
    filename: 'Q3_2024_Financial_Report.pdf',
    totalPages: 64,
    chunksVectorized: 192,
    status: 'Ready',
    analyzedTimeAgo: 'Analyzed 2h ago',
    vectorizationPercent: 100,
    sparseAndDenseSync: true,
    executiveSummary:
      'Q3 fiscal performance shows marked acceleration with consolidated revenue outperforming consensus projections by 4.2%. Strong margin expansion in enterprise cloud infrastructure offset softer cyclical enterprise hardware refresh cycles.',
    groundedAnchors: [
      {
        label: '[Page 2 · Exec Summary]',
        page: 2,
        section: 'Executive Summary',
        bbox: { page: 2, x: 8, y: 15, width: 84, height: 24 }
      },
      {
        label: '[Page 4 · Highlights Table]',
        page: 4,
        section: 'Highlights Table',
        bbox: { page: 4, x: 8, y: 28, width: 84, height: 32 }
      }
    ],
    sampleQuestions: [
      'What was the year-over-year revenue growth and what were the primary operational drivers?',
      'Are there any mentions of supply chain disruptions impacting Q4 projections?',
      'How did gross margins trend across Cloud Core Infra vs Platform SaaS?'
    ],
    chunks: [
      {
        id: 'chunk-fin-p4',
        docId: 'q3-financial-report',
        pageNumber: 4,
        sectionTitle: 'Financial Highlights',
        content:
          'Consolidated revenue reached $4,821 million, an 18.4% increase from $4,072 million reported in Q3 of the prior fiscal period. Free cash flow surged 29% to $1,420M.',
        bbox: { page: 4, x: 9.0, y: 25.0, width: 82.0, height: 20.0 },
        denseSim: 0.94,
        bm25Score: 18.42,
        rrfScore: 0.884
      },
      {
        id: 'chunk-fin-p12',
        docId: 'q3-financial-report',
        pageNumber: 12,
        sectionTitle: 'Segment Breakdown',
        content:
          'Cloud infrastructure revenues advanced to $2,140M as hyperscale demand persisted, marking continuous segment expansion. Enterprise customers with >$1M ARR rose 24% to 892 accounts.',
        bbox: { page: 12, x: 9.0, y: 36.0, width: 82.0, height: 22.0 },
        denseSim: 0.89,
        bm25Score: 14.15,
        rrfScore: 0.842
      },
      {
        id: 'chunk-fin-p18',
        docId: 'q3-financial-report',
        pageNumber: 18,
        sectionTitle: 'Operational Review',
        content:
          'Operating margin leverage reflected lower unit server energy consumption and supply-chain negotiated discounts. Overall non-GAAP operating margin reached 31.8%.',
        bbox: { page: 18, x: 9.0, y: 50.0, width: 82.0, height: 20.0 },
        denseSim: 0.82,
        bm25Score: 11.80,
        rrfScore: 0.798
      },
      {
        id: 'chunk-fin-p51',
        docId: 'q3-financial-report',
        pageNumber: 51,
        sectionTitle: 'Forward-Looking Risks',
        content:
          'Section 4 touches upon general macroeconomic risk factors and foreign exchange headwinds, but contains no specific Q4 supply chain impacts or quantitative forecasts.',
        bbox: { page: 51, x: 10.0, y: 55.0, width: 80.0, height: 18.0 },
        denseSim: 0.48,
        bm25Score: 3.10,
        rrfScore: 0.320
      }
    ]
  },
  {
    id: 'msa-v4',
    filename: 'Master_Services_Agreement_v4.pdf',
    totalPages: 28,
    chunksVectorized: 84,
    status: 'Synced',
    analyzedTimeAgo: 'Analyzed Yesterday',
    vectorizationPercent: 100,
    sparseAndDenseSync: true,
    executiveSummary:
      'Standard Master Services Agreement governing enterprise software licensing, data privacy, SLA commitments (99.95% availability), and mutual indemnity caps ($5.0M aggregate limit).',
    groundedAnchors: [
      {
        label: '[Page 3 · SLA Terms]',
        page: 3,
        section: 'Service Level Commitments',
        bbox: { page: 3, x: 10, y: 20, width: 80, height: 25 }
      },
      {
        label: '[Page 11 · Liability Cap]',
        page: 11,
        section: 'Limitation of Liability',
        bbox: { page: 11, x: 10, y: 40, width: 80, height: 20 }
      }
    ],
    sampleQuestions: [
      'What is the aggregate limitation of liability for direct damages?',
      'What are the contractual SLA uptime guarantees and credit remedies?'
    ],
    chunks: [
      {
        id: 'chunk-msa-p3',
        docId: 'msa-v4',
        pageNumber: 3,
        sectionTitle: 'SLA Commitments',
        content:
          'Vendor commits to 99.95% Monthly Uptime Percentage. In the event of availability between 99.0% and 99.95%, Customer is entitled to a 15% service credit on recurring subscription fees.',
        bbox: { page: 3, x: 10.0, y: 22.0, width: 80.0, height: 22.0 },
        denseSim: 0.93,
        bm25Score: 16.5,
        rrfScore: 0.87
      },
      {
        id: 'chunk-msa-p11',
        docId: 'msa-v4',
        pageNumber: 11,
        sectionTitle: 'Limitation of Liability',
        content:
          'Except for gross negligence or willful misconduct, either party’s maximum aggregate liability shall be capped at the total amounts paid or payable in the 12 months preceding the incident, not to exceed $5,000,000.',
        bbox: { page: 11, x: 10.0, y: 42.0, width: 80.0, height: 24.0 },
        denseSim: 0.96,
        bm25Score: 19.8,
        rrfScore: 0.92
      }
    ]
  },
  {
    id: 'clinical-trial',
    filename: 'Clinical_Trial_Protocol_Phase3.pdf',
    totalPages: 112,
    chunksVectorized: 340,
    status: 'Synced',
    analyzedTimeAgo: 'Analyzed 3d ago',
    vectorizationPercent: 100,
    sparseAndDenseSync: true,
    executiveSummary:
      'Phase III randomized, double-blind, multicenter trial evaluating efficacy and safety profile across N=840 cohort participants with PFS primary endpoint verification.',
    groundedAnchors: [
      {
        label: '[Page 5 · Study Endpoints]',
        page: 5,
        section: 'Primary and Secondary Objectives',
        bbox: { page: 5, x: 10, y: 25, width: 80, height: 25 }
      },
      {
        label: '[Page 14 · Dosing Regimen]',
        page: 14,
        section: 'Administration and Cohort Dosing',
        bbox: { page: 14, x: 10, y: 45, width: 80, height: 20 }
      }
    ],
    sampleQuestions: [
      'What is the primary efficacy endpoint and targeted hazard ratio?',
      'What are the exclusion criteria regarding prior systemic therapies?'
    ],
    chunks: [
      {
        id: 'chunk-ct-p5',
        docId: 'clinical-trial',
        pageNumber: 5,
        sectionTitle: 'Study Objectives',
        content:
          'The primary endpoint is Progression-Free Survival (PFS) as assessed by blinded independent central review. Target sample size of N=840 yields 90% statistical power to detect a hazard ratio of 0.68 with alpha=0.05.',
        bbox: { page: 5, x: 10.0, y: 24.0, width: 80.0, height: 24.0 },
        denseSim: 0.95,
        bm25Score: 17.8,
        rrfScore: 0.91
      },
      {
        id: 'chunk-ct-p14',
        docId: 'clinical-trial',
        pageNumber: 14,
        sectionTitle: 'Dosage and Administration',
        content:
          'Patients will receive 200mg orally twice daily (b.i.d.) on a continuous 28-day cycle until documented disease progression or unacceptable toxicity.',
        bbox: { page: 14, x: 10.0, y: 46.0, width: 80.0, height: 20.0 },
        denseSim: 0.91,
        bm25Score: 15.2,
        rrfScore: 0.86
      }
    ]
  }
];

export const INITIAL_CHAT_MESSAGES: {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  content: string;
  result?: RagResponseResult;
}[] = [
  {
    id: 'msg-u1',
    role: 'user',
    timestamp: '14:24:02 UTC',
    content: 'What was the year-over-year revenue growth and what were the primary operational drivers?'
  },
  {
    id: 'msg-a1',
    role: 'assistant',
    timestamp: '14:24:04 UTC',
    content: '',
    result: {
      query: 'What was the year-over-year revenue growth and what were the primary operational drivers?',
      expandedQuery: 'YoY revenue growth Q3 2024 primary drivers operational segments',
      isGrounded: true,
      confidence: 96,
      faithfulness: 98.4,
      latencyMs: 42,
      isCacheHit: true,
      synthesisText:
        'During Q3 2024, the company recorded consolidated GAAP revenue of $4.82B, representing an +18.4% YoY expansion compared to $4.07B in Q3 2023 [Page 4].\n\nOperational momentum was predominantly guided by three structural factors outlined in the filing:\n- Hyperscale Cloud Workload Migration: Accelerated enterprise commitments yielded a 32% increase in multi-year committed recurring contracts [Page 12].\n- Operating Margin Leverage: Cloud gross margin widened by 280 bps to 71.4%, driven by internal datacenter silicon efficiency initiatives [Page 18].\n- Enterprise ARPU Uplift: Net revenue retention remained robust at 119% as existing accounts provisioned inference capabilities.',
      metrics: [
        { label: 'Cloud Core Infra', value: '$2.14B', yoy: '+26.2% YoY' },
        { label: 'Platform SaaS', value: '$1.78B', yoy: '+14.1% YoY' },
        { label: 'Client Services', value: '$0.90B', yoy: '+3.2% YoY' }
      ],
      keyFactors: [
        {
          title: 'Hyperscale Cloud Workload Migration',
          desc: 'Accelerated enterprise commitments yielded a 32% increase in multi-year committed recurring contracts',
          page: 12
        },
        {
          title: 'Operating Margin Leverage',
          desc: 'Cloud gross margin widened by 280 bps to 71.4%, driven by internal datacenter silicon efficiency initiatives',
          page: 18
        },
        {
          title: 'Enterprise ARPU Uplift',
          desc: 'Net revenue retention remained robust at 119% as existing accounts provisioned inference capabilities.',
          page: 18
        }
      ],
      chartData: [
        { quarter: "Q3 '23", heightPercent: 65 },
        { quarter: "Q4 '23", heightPercent: 72 },
        { quarter: "Q1 '24", heightPercent: 76 },
        { quarter: "Q2 '24", heightPercent: 82 },
        { quarter: "Q3 '24", heightPercent: 100, active: true }
      ],
      matchedChunks: [
        {
          id: 'chunk-p4-1',
          docId: 'sec-q3-10k',
          pageNumber: 4,
          sectionTitle: 'Financial Highlights',
          content:
            '"Consolidated revenue reached $4,821 million, an 18.4% increase from $4,072 million reported in Q3 of the prior fiscal period..."',
          bbox: { page: 4, x: 8.5, y: 26.0, width: 83.0, height: 18.5 },
          denseSim: 0.94,
          sim: 0.94,
          rank: 1
        },
        {
          id: 'chunk-p12-1',
          docId: 'sec-q3-10k',
          pageNumber: 12,
          sectionTitle: 'Segment Breakdown',
          content:
            '"Cloud infrastructure revenues advanced to $2,140M as hyperscale demand persisted, marking continuous segment expansion..."',
          bbox: { page: 12, x: 8.5, y: 38.0, width: 83.0, height: 21.0 },
          denseSim: 0.89,
          sim: 0.89,
          rank: 2
        },
        {
          id: 'chunk-p18-1',
          docId: 'sec-q3-10k',
          pageNumber: 18,
          sectionTitle: 'Operational Review',
          content:
            '"Operating margin leverage reflected lower unit server energy consumption and supply-chain negotiated discounts..."',
          bbox: { page: 18, x: 8.5, y: 52.0, width: 83.0, height: 19.0 },
          denseSim: 0.82,
          sim: 0.82,
          rank: 3
        }
      ],
      technicalTelemetry: {
        denseScore: 0.912,
        bm25Score: 18.42,
        rrfScore: 0.884,
        cohereCosine: 0.942,
        promptTokens: 842,
        genTokens: 218
      }
    }
  },
  {
    id: 'msg-u2',
    role: 'user',
    timestamp: '14:26:40 UTC',
    content: 'Are there any mentions of supply chain disruptions impacting Q4 projections?'
  },
  {
    id: 'msg-a2',
    role: 'assistant',
    timestamp: '14:26:41 UTC',
    content: '',
    result: {
      query: 'Are there any mentions of supply chain disruptions impacting Q4 projections?',
      expandedQuery: 'Strict Verification Threshold',
      filterTriggered: 'Strict Verification Threshold',
      isGrounded: false,
      confidence: 38,
      faithfulness: 0,
      latencyMs: 380,
      isCacheHit: false,
      synthesisText:
        'The available document evidence is insufficient to answer this question reliably. Section 4 touches upon general macroeconomic risk factors, but no specific Q4 supply chain impacts or quantitative forecasts are documented in this filing.',
      subThresholdChunk: {
        id: 'chunk-p51-1',
        docId: 'sec-q3-10k',
        pageNumber: 51,
        sectionTitle: 'Forward-Looking Risks',
        content:
          'Page 51 · Forward-Looking Risks (0.48 Low Sim) Filtered out by strict threshold (≥ 0.70)',
        bbox: { page: 51, x: 10.0, y: 60.0, width: 80.0, height: 15.0 },
        denseSim: 0.48,
        sim: 0.48
      },
      matchedChunks: [],
      technicalTelemetry: {
        denseScore: 0.481,
        bm25Score: 3.10,
        rrfScore: 0.320,
        cohereCosine: 0.48,
        promptTokens: 412,
        genTokens: 88
      }
    }
  }
];
