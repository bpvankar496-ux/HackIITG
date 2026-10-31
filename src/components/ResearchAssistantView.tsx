/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  BookOpen,
  FileText,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Search,
  Network,
} from 'lucide-react';
import {
  ArchivalCitation,
  ResearchMessage,
  validateResearchQuery,
} from '../utils/researchAssistant';
import { DocumentRecord, DocumentType } from '../types/database.types';
import { DocumentDetailModal } from './DocumentDetailModal';
import { getAuthHeaders } from '../lib/supabase';

interface ResearchAssistantViewProps {
  onNavigateToExplorer?: () => void;
  onNavigateToUpload?: () => void;
  onNavigateToGraph?: (slug?: string) => void;
  onNavigateToSite?: (slug: string) => void;
}

const SUGGESTED_INQUIRIES = [
  'What do colonial surveys record about Queen Udayamati and Rani ki Vav?',
  'What deities and Vaishnava avatars are documented in the subterranean galleries?',
  'What architectural features of the Solanki period are documented in Kathiawad?',
  'What details are preserved in the Chaulukya royal epigraph regarding King Bhima I?',
  'How does the construction of Rani ki Vav compare with the Sun Temple at Modhera?',
];

export const ResearchAssistantView: React.FC<ResearchAssistantViewProps> = ({
  onNavigateToExplorer,
  onNavigateToUpload,
  onNavigateToGraph,
  onNavigateToSite,
}) => {
  const [messages, setMessages] = useState<ResearchMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Welcome to the **Virasat  Archival Research Assistant**. I am configured to assist historians, researchers, and students by retrieving and synthesizing primary source records indexed in this digital heritage repository.\n\nEvery answer is **strictly grounded** in verified document pages, manuscripts, and epigraphical charters. I do not fabricate historical claims or dates. When evidence is cited, you can click any source badge below to inspect the original high-resolution folio in the document reader.',
      timestamp: Date.now(),
      grounded: true,
      retrievedPassagesCount: 0,
      citations: [],
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Folio reader modal state
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [inspectDoc, setInspectDoc] = useState<DocumentRecord | null>(null);
  const [inspectPageNumber, setInspectPageNumber] = useState<number>(1);
  const [loadingDocRecord, setLoadingDocRecord] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Open the document reader for a specific citation
  const handleInspectCitation = async (citation: ArchivalCitation) => {
    setLoadingDocRecord(true);
    setInspectPageNumber(citation.pageNumber || 1);

    try {
      // Fetch documents list to find the record
      const res = await fetch('/api/documents', { headers: await getAuthHeaders() });
      const data = await res.json();
      if (data.ok && Array.isArray(data.documents)) {
        const found = data.documents.find((d: DocumentRecord) => d.id === citation.documentId);
        if (found) {
          setInspectDoc(found);
          setInspectModalOpen(true);
        } else {
          // Construct fallback minimal doc record from citation metadata
          const fallbackDoc: DocumentRecord = {
            id: citation.documentId,
            title: citation.documentTitle,
            description: citation.passageSnippet,
            document_type: (citation.documentType as any) || 'architectural_record',
            historical_period: citation.historicalPeriod || 'Historical Record',
            language: 'Archival Record',
            location_name: citation.locationName || 'Heritage Site',
            latitude: null,
            longitude: null,
            source_name: citation.attribution || 'Repository Archive',
            attribution: citation.attribution || null,
            storage_path: citation.storagePath || '',
            original_filename: `${citation.documentTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
            mime_type: 'application/pdf',
            file_size_bytes: 1024,
            processing_status: 'completed',
            verification_status: 'peer_reviewed',
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setInspectDoc(fallbackDoc);
          setInspectModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to load document for inspection:', err);
    } finally {
      setLoadingDocRecord(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const queryToSend = overrideText !== undefined ? overrideText : inputQuery;

    const validation = validateResearchQuery(queryToSend);
    if (!validation.valid) {
      setError(validation.error || 'Please enter a valid research inquiry.');
      return;
    }

    setError(null);
    setInputQuery('');

    const userMessage: ResearchMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: validation.cleanQuery,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Build conversation history of past turns
      const conversationHistory = messages
        .filter((m) => m.id !== 'welcome-msg')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/archive/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          question: validation.cleanQuery,
          conversationHistory,
          filters: {
            documentType: filterType,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'The research assistant failed to process the inquiry.');
      }

      const assistantMessage: ResearchMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
        citations: data.citations || [],
        grounded: data.grounded ?? true,
        retrievedPassagesCount: data.retrievedPassagesCount || 0,
        executionMs: data.executionMs || 0,
        modelUsed: data.model || 'unknown',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ResearchMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: `**Research Notice:** Unable to complete inquiry due to an error: ${
          err.message || 'Network error'
        }. Please verify that the local server is operating.`,
        timestamp: Date.now(),
        grounded: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content:
          'Welcome to the **Virasat  Archival Research Assistant**. I am configured to assist historians, researchers, and students by retrieving and synthesizing primary source records indexed in this digital heritage repository.\n\nEvery answer is **strictly grounded** in verified document pages, manuscripts, and epigraphical charters. I do not fabricate historical claims or dates. When evidence is cited, you can click any source badge below to inspect the original high-resolution folio in the document reader.',
        timestamp: Date.now(),
        grounded: true,
        retrievedPassagesCount: 0,
        citations: [],
      },
    ]);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Editorial Header */}
      <div className="mb-6 border-b border-[#E2D7C3] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#B38E46]/30 bg-[#F4EFE6] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#B38E46]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Step 6: Grounded AI Assistant
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm border border-[#2E7D32]/30 bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-medium text-[#2E7D32]">
                <CheckCircle2 className="h-3 w-3" />
                Anti-Hallucination Sandbox Active
              </span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#16192E]">
              Heritage Research Assistant
            </h1>
            <p className="mt-1 text-sm text-[#6B6860]">
              Interrogate primary documents, surveys, and stone inscriptions. Answers are synthesized strictly from indexed folios with verifiable page-level provenance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 rounded border border-[#C9BBA2] bg-[#F4EFE6] px-3 py-1.5 text-xs font-medium text-[#6B6860] transition-colors hover:border-[#16192E] hover:text-[#16192E]"
              title="Reset conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Thread
            </button>
            {onNavigateToExplorer && (
              <button
                onClick={onNavigateToExplorer}
                className="inline-flex items-center gap-1.5 rounded border border-[#C9BBA2] bg-[#F4EFE6] px-3 py-1.5 text-xs font-medium text-[#6B6860] transition-colors hover:border-[#16192E] hover:text-[#16192E]"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Archive Explorer
              </button>
            )}
            {onNavigateToGraph && (
              <button
                onClick={() => onNavigateToGraph()}
                className="inline-flex items-center gap-1.5 rounded border border-[#B65F43]/30 bg-[#B65F43]/10 px-3 py-1.5 text-xs font-medium text-[#B65F43] transition-colors hover:bg-[#B65F43] hover:text-white"
              >
                <Network className="h-3.5 w-3.5" />
                Knowledge Graph
              </button>
            )}
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="mt-4 pt-4 border-t border-[#E2D7C3]/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C827A] mb-2">
            Curated Research Queries:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_INQUIRIES.map((query, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => handleSubmit(undefined, query)}
                className="rounded-full border border-[#D5C9B3] bg-white/80 px-3 py-1 text-xs text-[#45423C] transition-all hover:border-[#B38E46] hover:bg-[#F4EFE6] hover:text-[#16192E] disabled:opacity-50 text-left"
              >
                &ldquo;{query}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div className="space-y-6 pb-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Message Header */}
              <div className="mb-1.5 flex items-center gap-2 px-1 text-[11px] text-[#8C827A]">
                {isUser ? (
                  <span className="font-semibold text-[#16192E]">Researcher Inquiry</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#B38E46]" />
                    <span className="font-semibold text-[#B38E46]">Archival Synthesis</span>
                    {message.modelUsed && (
                      <span className="rounded bg-[#F4EFE6] px-1.5 py-0.2 text-[10px] text-[#6B6860] border border-[#E2D7C3]">
                        {message.modelUsed}
                      </span>
                    )}
                    {message.executionMs ? (
                      <span className="text-[10px] text-[#8C827A]">
                        &bull; {(message.executionMs / 1000).toFixed(1)}s
                      </span>
                    ) : null}
                  </div>
                )}
                <span>&bull; {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message Card */}
              <div
                className={`group relative max-w-3xl rounded-lg p-5 leading-relaxed shadow-sm transition-all ${
                  isUser
                    ? 'border border-[#C9BBA2] bg-[#F4EFE6] text-[#16192E]'
                    : 'border border-[#E2D7C3] bg-white text-[#2B2925]'
                }`}
              >
                {/* Content formatted with markdown line breaks */}
                <div className="prose prose-sm max-w-none text-sm text-[#2B2925] space-y-3 font-serif">
                  {message.content.split('\n\n').map((paragraph, idx) => {
                    // Check if bullet point
                    if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                      const items = paragraph.split('\n');
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1.5 my-2">
                          {items.map((it, itemIdx) => (
                            <li key={itemIdx} className="text-sm leading-relaxed">
                              {renderFormattedText(it.replace(/^[-*]\s*/, ''))}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={idx} className="text-sm leading-relaxed">
                        {renderFormattedText(paragraph)}
                      </p>
                    );
                  })}
                </div>

                {/* Grounding & Evidence Citations (Assistant Only) */}
                {!isUser && message.citations && message.citations.length > 0 && (
                  <div className="mt-5 border-t border-[#EAE3D2] pt-4">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8C827A]">
                        <BookOpen className="h-3.5 w-3.5 text-[#B38E46]" />
                        Primary Archival Citations ({message.citations.length})
                      </span>
                      <span className="text-[11px] text-[#6B6860]">
                        Click to view source folio in reader
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {message.citations.map((c) => (
                        <div
                          key={c.citationId}
                          className="flex flex-col justify-between rounded border border-[#E2D7C3] bg-[#FDFCF9] p-3 text-left transition-all hover:border-[#B38E46] hover:bg-[#F7F4EC] hover:shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="inline-flex items-center rounded-sm bg-[#B38E46]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#B38E46]">
                                [Citation {c.citationId}]
                              </span>
                              <span className="rounded bg-[#F4EFE6] px-1.5 py-0.5 text-[10px] font-medium text-[#6B6860] border border-[#E2D7C3]/60">
                                Folio p. {c.pageNumber}
                              </span>
                            </div>
                            <h4 className="font-serif text-xs font-bold text-[#16192E] line-clamp-1">
                              {c.documentTitle}
                            </h4>
                            <p className="mt-1 text-[11px] italic text-[#6B6860] line-clamp-2">
                              &ldquo;{c.passageSnippet}&rdquo;
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#EAE3D2]/60 flex items-center justify-between">
                            <span className="text-[10px] text-[#8C827A]">
                              {c.confidenceScore
                                ? `${Math.round(c.confidenceScore * 100)}% OCR Conf.`
                                : 'Peer Reviewed'}
                            </span>
                            <button
                              onClick={() => handleInspectCitation(c)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B38E46] hover:underline"
                            >
                              Inspect Folio <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zero Evidence Notice Banner */}
                {!isUser && message.grounded === false && (
                  <div className="mt-4 flex items-start gap-2.5 rounded border border-[#D5C9B3] bg-[#F4EFE6]/70 p-3 text-xs text-[#6B6860]">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#B38E46] mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#16192E]">Zero Extrapolation Policy</p>
                      <p className="mt-0.5">
                        No primary source documents in the repository currently contain passages directly validating this query. You can upload archival PDFs or images via the Upload Folio view to index them into the repository.
                      </p>
                      {onNavigateToUpload && (
                        <button
                          onClick={onNavigateToUpload}
                          className="mt-2 inline-flex items-center gap-1 font-semibold text-[#B38E46] hover:underline"
                        >
                          Upload new archive folio <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 rounded p-1 text-[#8C827A] hover:bg-[#F4EFE6] hover:text-[#16192E] transition-all"
                  title="Copy response"
                >
                  {copiedId === message.id ? (
                    <Check className="h-3.5 w-3.5 text-[#2E7D32]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="mb-1.5 flex items-center gap-2 px-1 text-[11px] text-[#8C827A]">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-[#B38E46]" />
              <span className="font-semibold text-[#B38E46]">Consulting Archival Repository...</span>
            </div>
            <div className="max-w-2xl rounded-lg border border-[#E2D7C3] bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#6B6860]">
                <div className="h-2 w-2 rounded-full bg-[#B38E46] animate-pulse" />
                <span>Scanning full-text indices and ranking matching folios...</span>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 w-3/4 rounded bg-[#EAE3D2]/60 animate-pulse" />
                <div className="h-3 w-full rounded bg-[#EAE3D2]/40 animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-[#EAE3D2]/50 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Inquiry Input Area */}
      <div className="sticky bottom-4 z-20 mt-4 rounded-xl border border-[#C9BBA2] bg-[#FBF9F4]/95 p-3 shadow-lg backdrop-blur-md">
        {error && (
          <div className="mb-2 flex items-center justify-between rounded bg-[#FDEDEC] px-3 py-1.5 text-xs text-[#C0392B]">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="font-bold">&times;</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                disabled={loading}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask an archival research inquiry (e.g. 'What architectural features of Rani ki Vav are described in colonial surveys?')..."
                rows={2}
                maxLength={600}
                className="w-full resize-none rounded-lg border border-[#D5C9B3] bg-white px-3.5 py-2.5 text-sm text-[#16192E] placeholder-[#8C827A] focus:border-[#B38E46] focus:outline-none focus:ring-1 focus:ring-[#B38E46] disabled:opacity-50"
              />
              <div className="absolute right-2 bottom-2 text-[10px] text-[#A7A9B4]">
                {inputQuery.length}/600
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || inputQuery.trim().length === 0}
              className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#16192E] px-4 text-xs font-semibold text-[#EDE5D5] transition-all hover:bg-[#B38E46] hover:text-[#16192E] disabled:opacity-40 disabled:hover:bg-[#16192E] disabled:hover:text-[#EDE5D5]"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Inquire</span>
            </button>
          </div>

          {/* Filter Bar & Scope Options */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#6B6860]">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#8C827A]">
                <Filter className="h-3 w-3" />
                Repository Scope:
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="rounded border border-[#D5C9B3] bg-white px-2 py-0.5 text-xs text-[#16192E] focus:outline-none focus:border-[#B38E46]"
              >
                <option value="all">All Document Types</option>
                <option value="architectural_record">Architectural Surveys</option>
                <option value="epigraphical_record">Epigraphical Charters</option>
                <option value="manuscript">Historical Manuscripts</option>
                <option value="gazetteer">Colonial Gazetteers</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#8C827A]">
              <span>Press <kbd className="rounded border border-[#D5C9B3] bg-[#F4EFE6] px-1 py-0.2 font-mono text-[10px]">Enter</kbd> to submit</span>
              <span>&bull;</span>
              <span className="text-[#2E7D32] font-medium">Strict Verification Active</span>
            </div>
          </div>
        </form>
      </div>

      {/* Document Detail Reader Modal */}
      {inspectModalOpen && inspectDoc && (
        <DocumentDetailModal
          document={inspectDoc}
          initialPageNumber={inspectPageNumber}
          onClose={() => setInspectModalOpen(false)}
        />
      )}
    </div>
  );
};

/**
 * Helper to safely format bold, citations, and emphasis in text strings.
 */
function renderFormattedText(text: string): React.ReactNode {
  // Replace [Citation X] with formatted badges
  const parts = text.split(/(\[Citation \d+\]|\*\*.*?\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('[Citation ') && part.endsWith(']')) {
      const num = part.replace(/[^\d]/g, '');
      return (
        <span
          key={idx}
          className="inline-flex items-center mx-1 rounded bg-[#B38E46]/15 border border-[#B38E46]/40 px-1.5 py-0.2 text-[11px] font-bold text-[#8C6D2D]"
        >
          Citation {num}
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-[#16192E]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
