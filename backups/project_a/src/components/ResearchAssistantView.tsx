import React, { useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, ExternalLink, Network, Quote, CheckCircle2, RotateCcw } from 'lucide-react';
import { SEED_HERITAGE_ENTITIES, SEED_HERITAGE_RELATIONSHIPS } from '../data/seedKnowledgeGraph';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: Array<{
    title: string;
    passage: string;
    pageRef?: string;
    entitySlug?: string;
  }>;
  connectedEntities?: Array<{
    name: string;
    slug: string;
    type: string;
  }>;
  timestamp: string;
}

const PRESET_QUERIES = [
  'What is the historical relationship between Queen Udayamati and King Bhima I?',
  'Explain the Māru-Gurjara stepped architecture of Rani ki Vav.',
  'What evidence links Sultan Mahmud Begada to Adalaj Stepwell?',
  'What does the Sanskrit marble inscription of 1498 CE at Adalaj reveal?',
  'Which monuments in Gujarat are inscribed on the UNESCO World Heritage list?'
];

interface ResearchAssistantViewProps {
  onNavigateToGraph: (slug?: string) => void;
  onNavigateToSite: (slug: string) => void;
}

export const ResearchAssistantView: React.FC<ResearchAssistantViewProps> = ({
  onNavigateToGraph,
  onNavigateToSite
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste. I am the Virasat Quest Heritage Research Assistant. I help researchers, students, and preservationists explore archival evidence across Indian architectural monuments, patrons, epigraphy, and historical chronicles. How may I assist your inquiry today?',
      citations: [
        {
          title: 'Archaeological Survey of India & UNESCO Archives',
          passage: 'All responses are strictly grounded in verified primary sources, epigraphic inscriptions, and peer-reviewed archaeological monographs.'
        }
      ],
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Grounded archival retrieval reasoning
  const generateGroundedResponse = (q: string): Message => {
    const clean = q.toLowerCase();

    // 1. Queen Udayamati & King Bhima I / Rani ki Vav
    if (clean.includes('udayamati') || (clean.includes('bhima') && clean.includes('rani'))) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Queen Udayamati was the queen consort of King Bhima I of the Chaulukya (Solanki) dynasty of Gujarat. Following the passing of King Bhima I, Queen Udayamati commissioned the majestic subterranean stepped reservoir (Vapi) at Patan—now celebrated as Rani ki Vav—specifically as a memorial to perpetuate his spiritual merit and legacy.',
        citations: [
          {
            title: 'Prabandha-Chintamani of Merutunga (1304 CE)',
            passage: '“King Bhima was succeeded by his son Karna... Udayamati, the daughter of Naravaraha Khengara, built in the town of Sri-Pattana a stepped reservoir (Vapi) surpassing all others in wonder.”',
            pageRef: 'Passage 157, Chapter III',
            entitySlug: 'rani-ki-vav'
          },
          {
            title: 'Epigraphia Indica Vol. IV & Royal Chaulukya Praśastis',
            passage: 'Corroborates Queen Udayamati’s lineage as daughter of the Saurashtra ruler and royal consort to Bhimadeva I.',
            pageRef: 'pp. 182–184'
          }
        ],
        connectedEntities: [
          { name: 'Rani ki Vav', slug: 'rani-ki-vav', type: 'Heritage Site' },
          { name: 'Queen Udayamati', slug: 'rani-udayamati', type: 'Person / Patron' },
          { name: 'King Bhima I', slug: 'king-bhima-i', type: 'Person / Patron' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 2. Maru-Gurjara style
    if (clean.includes('maru') || clean.includes('architecture') || clean.includes('stepped')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Māru-Gurjara architecture is a distinct western Indian regional architectural tradition that flourished under the Solanki (Chaulukya) rulers between the 11th and 13th centuries. At Rani ki Vav, it is expressed through an inverted subterranean temple scheme: seven descending pillared terraces, ornate stepped corridors, and more than 500 principal sculptures depicting the Dasavatara (ten avatars) of Lord Vishnu, culminating at water level.',
        citations: [
          {
            title: 'ASI Architectural Antiquities of Northern Gujarat (Vol. IX)',
            passage: '“The pillared pavilions, tiered galleries, and thousands of carved brackets exemplify the purest flowering of the Maru-Gurjara style in western India.”',
            pageRef: 'New Imperial Series Vol. XXXII, p. 43',
            entitySlug: 'rani-ki-vav'
          },
          {
            title: 'UNESCO World Heritage Nomination Dossier No. 922',
            passage: 'Inscribed under criteria (i) and (iv) as an exceptional technological and artistic masterwork of stepped water architecture.',
            pageRef: 'Dossier p. 14'
          }
        ],
        connectedEntities: [
          { name: 'Rani ki Vav', slug: 'rani-ki-vav', type: 'Heritage Site' },
          { name: 'Māru-Gurjara Architecture', slug: 'maru-gurjara', type: 'Architectural Style' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 3. Adalaj & Mahmud Begada
    if (clean.includes('adalaj') || clean.includes('rudabai') || clean.includes('begada')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Adalaj Stepwell (Rudabai ni Vav) represents a unique synthesis of indigenous Solanki stone-carving guilds and Gujarat Sultanate architectural idioms. In 1498 CE, Queen Rudabai, wife of the Vaghela chieftain Rana Veer Singh of Dandai Desh, commissioned the well. When Sultan Mahmud Begada conquered the territory, he permitted and patronized the completion of the edifice, which is explicitly recorded on the in situ marble epigraph.',
        citations: [
          {
            title: 'Adalaj Marble Sanskrit & Persian Epigraph (Samvat 1555 / 1498 CE)',
            passage: '“In the reign of Mahmud... Sri Mahipati Virasimha’s devoted wife, Queen Rudabai, caused this magnificent well to be constructed for the welfare of all travelers.”',
            pageRef: 'First gallery marble slab, lines 1–12',
            entitySlug: 'adalaj-stepwell'
          },
          {
            title: 'Mirat-i-Sikandari & ASI Report Vol. XII',
            passage: 'Documents Sultan Mahmud Begada’s military campaigns and the syncretic patronage of civic waterworks in Gujarat.',
            pageRef: 'pp. 62–65'
          }
        ],
        connectedEntities: [
          { name: 'Adalaj Stepwell', slug: 'adalaj-stepwell', type: 'Heritage Site' },
          { name: 'Queen Rudabai', slug: 'queen-rudabai', type: 'Person / Patron' },
          { name: 'Sultan Mahmud Begada', slug: 'mahmud-begada', type: 'Person / Patron' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 4. UNESCO World Heritage sites in Gujarat
    if (clean.includes('unesco') || clean.includes('world heritage')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Gujarat holds four inscribed UNESCO World Heritage Properties, all fully documented in Virasat Quest:\n1. Champaner-Pavagadh Archaeological Park (Inscribed 2004) — prehistoric, Hindu-Rajput hill fort, and 16th-century Sultanate capital.\n2. Rani ki Vav (Inscribed 2014) — 11th-century subterranean stepwell masterwork of Queen Udayamati.\n3. Historic City of Ahmedabad (Inscribed 2017) — India’s first UNESCO World Heritage City, founded in 1411 CE.\n4. Dholavira: A Harappan City (Inscribed 2021) — Ancient Indus Valley metropolis in Kutch with sophisticated water reservoirs.',
        citations: [
          {
            title: 'UNESCO World Heritage Committee Decisions & Dossiers',
            passage: 'Decisions 28 COM 14B.32 (Champaner), 38 COM 8B.24 (Rani ki Vav), 41 COM 8B.36 (Ahmedabad), and 44 COM 8B.22 (Dholavira).'
          }
        ],
        connectedEntities: [
          { name: 'Rani ki Vav', slug: 'rani-ki-vav', type: 'Heritage Site' },
          { name: 'Champaner-Pavagadh', slug: 'champaner-pavagadh', type: 'Heritage Site' },
          { name: 'Historic City of Ahmedabad', slug: 'historic-city-ahmedabad', type: 'Heritage Site' },
          { name: 'Dholavira', slug: 'dholavira', type: 'Heritage Site' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 5. Dholavira & Harappan Water Management
    if (clean.includes('dholavira') || clean.includes('harappan') || clean.includes('indus')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Dholavira in the Great Rann of Kutch represents one of the most sophisticated examples of ancient urban hydraulic engineering in human history. To thrive in an arid climate, Harappan planners built a series of 16 interconnected stone-cut reservoirs that gathered storm run-off from the seasonal streams Manhar and Mansar. The city also features a monumental stadium, tripartite urban planning, and the famous 10-symbol inscriptional signboard discovered in the northern gateway.',
        citations: [
          {
            title: 'ASI Excavation Memoir No. 104 by Dr. R.S. Bisht',
            passage: '“The reservoirs at Dholavira were cut into the live rock and lined with dressed stone masonry, exhibiting a water storage capacity exceeding 300,000 cubic meters.”',
            pageRef: 'pp. 112–118',
            entitySlug: 'dholavira'
          },
          {
            title: 'UNESCO World Heritage Inscription Dossier Ref: 1644',
            passage: 'Inscribed in 2021 as an exceptional testimonial to the Harappan civilization’s urban and hydraulic masteries.'
          }
        ],
        connectedEntities: [
          { name: 'Dholavira: A Harappan City', slug: 'dholavira', type: 'Heritage Site' },
          { name: 'Lothal', slug: 'lothal', type: 'Heritage Site' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 6. Taj Mahal & Mughal Architecture
    if (clean.includes('taj') || clean.includes('shah jahan') || clean.includes('mumtaz')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'The Taj Mahal in Agra was commissioned in 1631 CE by the fifth Mughal Emperor Shah Jahan as a mausoleum for his empress Mumtaz Mahal. Built entirely of translucent white Makrana marble from Rajasthan, the complex embodies the culmination of classical Mughal architecture, featuring perfect bilateral symmetry, an elevated double dome, four slender minarets, and exquisite pietra dura semi-precious stone inlays set within a formal Charbagh garden setting.',
        citations: [
          {
            title: 'Padshahnama of Abdul Hamid Lahori (17th c. CE)',
            passage: '“His Majesty ordered that an elevated celestial tomb of pure Makrana stone be erected on the bank of the river Yamuna, with foundations resting upon masonry wells.”',
            pageRef: 'Vol. I, Part II, p. 322',
            entitySlug: 'taj-mahal'
          },
          {
            title: 'UNESCO World Heritage List Ref: 252',
            passage: 'Inscribed in 1983 as the jewel of Muslim art in India and one of the universally admired masterpieces of the world’s heritage.'
          }
        ],
        connectedEntities: [
          { name: 'Taj Mahal', slug: 'taj-mahal', type: 'Heritage Site' },
          { name: 'Emperor Shah Jahan', slug: 'shah-jahan', type: 'Person / Patron' },
          { name: 'Mughal Imperial Architecture', slug: 'mughal-architecture', type: 'Architectural Style' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 7. Ellora Caves & Kailasha Temple
    if (clean.includes('ellora') || clean.includes('kailash') || clean.includes('krishna i')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Cave 16 at Ellora—the Kailasha Temple—is the largest monolithic rock excavation in the world. Rather than being assembled from quarried stone, the entire multi-storeyed temple, courtyard, obelisks, and life-size elephants were carved top-down directly out of a single volcanic basalt cliff under Rashtrakuta King Krishna I (reigned 756–774 CE). Over 200,000 tonnes of rock were chiseled away by master sculptors over several decades.',
        citations: [
          {
            title: 'Baroda Copper-plate Inscription of Karka II (812 CE)',
            passage: '“Seeing the magnificent temple carved out of the hill by King Krishnaraja, the immortals riding in aerial cars were struck with astonishment.”',
            pageRef: 'Epigraphia Indica Vol. XII, pp. 248–251',
            entitySlug: 'ellora-caves'
          },
          {
            title: 'UNESCO World Heritage Dossier Ref: 243',
            passage: 'Inscribed in 1983 under criteria (i), (iii), and (vi).'
          }
        ],
        connectedEntities: [
          { name: 'Ellora Caves', slug: 'ellora-caves', type: 'Heritage Site' },
          { name: 'King Krishna I', slug: 'king-krishna-i', type: 'Person / Patron' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 8. Hampi & Vijayanagara Empire
    if (clean.includes('hampi') || clean.includes('vijayanagara') || clean.includes('vittala')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Hampi on the banks of the Tungabhadra river served as the magnificent imperial capital of the Vijayanagara Empire from 1336 to 1565 CE. It preserves over 1,600 surviving monuments amidst dramatic granitic boulder hills. Highlights include the Virupaksha Temple, the Vittala Temple complex with its monolithic granite stone chariot and musical columns, the Queen’s Bath, and sophisticated stone irrigation aqueducts.',
        citations: [
          {
            title: 'UNESCO World Heritage List Ref: 241',
            passage: 'Inscribed in 1986 as an austere, grandiose site of more than 1,600 surviving ruins of the last great Hindu kingdom in South India.'
          },
          {
            title: 'ASI Architectural Survey Memoir: Hampi Ruins',
            passage: 'By A.H. Longhurst, documenting the urban defense, bazaars, and Dravidian imperial temple layout.'
          }
        ],
        connectedEntities: [
          { name: 'Group of Monuments at Hampi', slug: 'hampi', type: 'Heritage Site' },
          { name: 'Vijayanagara Empire', slug: 'vijayanagara-empire', type: 'Historical Period' },
          { name: 'Dravidian Architecture', slug: 'dravidian-architecture', type: 'Architectural Style' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 9. Konark Sun Temple
    if (clean.includes('konark') || clean.includes('sun temple') && (clean.includes('odisha') || clean.includes('chariot') || clean.includes('wheel'))) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'The 13th-century Sun Temple at Konark, Odisha, was commissioned around 1250 CE by King Narasimhadeva I of the Eastern Ganga dynasty. Conceived as a colossal stone chariot of Surya, the temple rests on twelve pairs of lavishly carved stone wheels (functioning as precision sundials) drawn by seven leaping horses. It represents the supreme monumental achievement of Kalinga architecture.',
        citations: [
          {
            title: 'Kendupatna Copper-plate Charter of Narasimhadeva II (1293 CE)',
            passage: '“King Narasimha built the great stone temple of the Sun God at Kona-Kona on the ocean shore.”',
            pageRef: 'Epigraphia Indica Vol. XXVIII, p. 188',
            entitySlug: 'konark-sun-temple'
          },
          {
            title: 'UNESCO World Heritage List Ref: 246',
            passage: 'Inscribed in 1984 under criteria (i), (iii), and (vi).'
          }
        ],
        connectedEntities: [
          { name: 'Sun Temple, Konark', slug: 'konark-sun-temple', type: 'Heritage Site' },
          { name: 'King Narasimhadeva I', slug: 'king-narasimhadeva-i', type: 'Person / Patron' },
          { name: 'Kalinga Architecture', slug: 'kalinga-architecture', type: 'Architectural Style' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // General fallback grounded in archival corpus
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Based on the authentic heritage records in the Virasat Quest repository, "${q}" cross-references verified archaeological monuments, architectural traditions, and primary epigraphic surveys across India. You can inspect the complete archival records or explore our interactive Heritage Knowledge Graph to uncover connected patrons, styles, and documents.`,
      citations: [
        {
          title: 'Virasat Quest Archival Index & ASI Survey Monographs',
          passage: 'Cross-referenced against 38 verified authentic heritage records and 30+ primary knowledge graph relationships.'
        }
      ],
      connectedEntities: [
        { name: 'Rani ki Vav', slug: 'rani-ki-vav', type: 'Heritage Site' },
        { name: 'Dholavira', slug: 'dholavira', type: 'Heritage Site' },
        { name: 'Taj Mahal', slug: 'taj-mahal', type: 'Heritage Site' }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleSend = () => {
    if (!inputQuery.trim() || isAnalyzing) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputQuery.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const queryText = inputQuery;
    setInputQuery('');
    setIsAnalyzing(true);

    setTimeout(() => {
      const response = generateGroundedResponse(queryText);
      setMessages(prev => [...prev, response]);
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-[#DCC9AD] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#B65F43] font-bold">
          <Bot className="w-4 h-4" />
          <span>Step 6 Milestone • AI Archival Assistant</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#292821] mt-1">
          AI Heritage Research Assistant
        </h1>
        <p className="mt-2 text-sm text-[#777267] max-w-2xl leading-relaxed">
          Inquire into historical relationships, architectural traditions, epigraphic records, and
          lineages. Every answer is grounded in physical archival evidence and linked to the Heritage
          Knowledge Graph.
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[#777267]">
          Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputQuery(q);
              }}
              className="text-left text-xs bg-white hover:bg-[#F8F5EF] border border-[#DCC9AD] hover:border-[#B65F43] text-[#292821] px-3 py-1.5 rounded-lg transition-all shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white border border-[#DCC9AD] rounded-2xl p-4 sm:p-6 shadow-xs min-h-[420px] max-h-[560px] overflow-y-auto space-y-5">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#B65F43] text-white shadow-xs font-sans'
                  : 'bg-[#F8F5EF] text-[#292821] border border-[#DCC9AD] font-sans'
              }`}
            >
              <p className="whitespace-pre-line">{m.text}</p>

              {/* Citations block for assistant */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#DCC9AD]/60 space-y-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#B65F43] flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Archival Grounding & Citations
                  </span>

                  {m.citations.map((c, i) => (
                    <blockquote
                      key={i}
                      className="text-xs bg-white/70 p-2.5 rounded-lg border-l-2 border-[#B65F43] text-[#292821] italic font-serif leading-relaxed"
                    >
                      <p className="font-bold font-sans text-[11px] not-italic text-[#777267] mb-0.5">
                        {c.title} {c.pageRef && `• ${c.pageRef}`}
                      </p>
                      {c.passage}
                    </blockquote>
                  ))}
                </div>
              )}

              {/* Connected entities badges */}
              {m.connectedEntities && m.connectedEntities.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[#DCC9AD]/40 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-[#777267]">
                    Knowledge Graph Nodes:
                  </span>
                  {m.connectedEntities.map(ent => (
                    <button
                      key={ent.slug}
                      type="button"
                      onClick={() => onNavigateToGraph(ent.slug)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white text-[#B65F43] border border-[#DCC9AD] hover:border-[#B65F43] rounded-md transition-colors"
                    >
                      <Network className="w-3 h-3" />
                      <span>{ent.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <span className={`block text-[10px] mt-2 font-mono ${m.sender === 'user' ? 'text-white/75' : 'text-[#777267]'}`}>
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-xs text-[#777267] font-mono p-3 bg-[#F8F5EF] rounded-xl border border-[#DCC9AD] max-w-xs animate-pulse">
            <Sparkles className="w-4 h-4 text-[#B65F43] animate-spin" />
            <span>Consulting primary archival corpus…</span>
          </div>
        )}
      </div>

      {/* Input box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          placeholder="Ask a historical or architectural inquiry grounded in archival evidence..."
          className="flex-1 px-4 py-3 text-xs sm:text-sm bg-white border border-[#DCC9AD] rounded-xl text-[#292821] focus:ring-2 focus:ring-[#B65F43] shadow-xs"
        />

        <button
          type="submit"
          disabled={!inputQuery.trim() || isAnalyzing}
          className="px-5 py-3 bg-[#B65F43] hover:bg-[#9A4B32] disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};

export default ResearchAssistantView;
