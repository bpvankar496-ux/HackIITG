/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getGeminiModel } from './geminiModels.ts';
import { GoogleGenAI } from '@google/genai';
import { searchArchivalPassages } from './searchRepository.ts';
import {
  validateResearchQuery,
  buildGroundedAssistantPrompt,
  extractCitationsFromAnswer,
  generateFallbackGroundedAnswer,
  ArchivalCitation,
} from '../utils/researchAssistant.ts';
import type { SearchFilters, ArchivePassageResult } from '../utils/archiveSearch.ts';

export interface AssistantQueryPayload {
  question: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  filters?: SearchFilters;
  viewerUserId?: string | null;
}

export interface AssistantQueryResponse {
  ok: boolean;
  answer: string;
  citations: ArchivalCitation[];
  retrievedPassagesCount: number;
  grounded: boolean;
  executionMs: number;
  model: string;
  warning?: string;
  error?: string;
}

/**
 * Handles a grounded archival research question by querying repository passages,
 * synthesizing an evidence-grounded response via Gemini 3.8 Flash, and extracting citations.
 */
export async function executeArchivalAssistantInquiry(
  payload: AssistantQueryPayload
): Promise<AssistantQueryResponse> {
  const startTime = Date.now();

  // 1. Validate inquiry
  const val = validateResearchQuery(payload.question);
  if (!val.valid) {
    return {
      ok: false,
      answer: '',
      citations: [],
      retrievedPassagesCount: 0,
      grounded: false,
      executionMs: Date.now() - startTime,
      model: 'grounded_synthesizer',
      error: val.error,
    };
  }

  const cleanQuestion = val.cleanQuery;
  const history = payload.conversationHistory || [];

  // 2. Search archival passages across repository records
  const searchResult = await searchArchivalPassages(
    {
      query: cleanQuestion,
      documentType: payload.filters?.documentType || 'all',
      historicalPeriod: payload.filters?.historicalPeriod || 'all',
      location: payload.filters?.location || 'all',
      language: payload.filters?.language || 'all',
      verificationStatus: payload.filters?.verificationStatus || 'all',
    },
    8,
    0,
    payload.viewerUserId || null
  );

  const matchedPassages = searchResult.results || [];

  // Filter passages that have meaningful text or positive relevance score
  const validPassages: ArchivePassageResult[] = matchedPassages.filter(
    (p) => (p.extractedText && p.extractedText.trim().length > 10) || p.relevanceScore > 0
  );

  // If no passages found in the repository, refuse to hallucinate
  if (validPassages.length === 0) {
    const elapsed = Date.now() - startTime;
    return {
      ok: true,
      answer: `The current archival records in the Virasat Quest repository do not contain documented evidence regarding "${cleanQuestion}".\n\nAs an AI research assistant committed to strict archival integrity, I do not extrapolate or introduce unsubstantiated claims. You may explore related folios in the Archive Explorer, upload primary documents, or adjust your historical inquiry terms.`,
      citations: [],
      retrievedPassagesCount: 0,
      grounded: false,
      executionMs: elapsed,
      model: 'grounded_synthesizer',
    };
  }

  // Cap passages to top 4 to maintain tight context
  const topPassages = validPassages.slice(0, 4);

  // 3. Check for GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const { systemInstruction, userPrompt } = buildGroundedAssistantPrompt(
        cleanQuestion,
        topPassages,
        history
      );

      // Timeout race: if upstream Gemini is experiencing high demand / 503 retries,
      // fail fast to deterministic grounded synthesizer within 8 seconds.
      const generatePromise = ai.models.generateContent({
        model: getGeminiModel(),
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.15, // Low temperature for high factual adherence
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 8s')), 8000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawAnswer = response.text?.trim() || '';

      if (rawAnswer) {
        const citations = extractCitationsFromAnswer(rawAnswer, topPassages);
        const elapsed = Date.now() - startTime;

        return {
          ok: true,
          answer: rawAnswer,
          citations,
          retrievedPassagesCount: topPassages.length,
          grounded: true,
          executionMs: elapsed,
          model: getGeminiModel(),
        };
      }
    } catch (apiErr: any) {
      console.warn('Gemini API call failed, falling back to deterministic synthesizer:', apiErr?.message);
    }
  }

  // 4. Deterministic Grounded Synthesizer Fallback (Zero Hallucination)
  const fallback = generateFallbackGroundedAnswer(cleanQuestion, topPassages);
  const elapsed = Date.now() - startTime;

  return {
    ok: true,
    answer: fallback.answer,
    citations: fallback.citations,
    retrievedPassagesCount: topPassages.length,
    grounded: true,
    executionMs: elapsed,
    model: 'grounded_synthesizer',
    warning: apiKey ? undefined : 'Synthesized using archival extractor (GEMINI_API_KEY not configured).',
  };
}
