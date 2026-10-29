/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArchivalDocument } from '../types';

export const ARCHIVE_DOCUMENTS: ArchivalDocument[] = [
  {
    id: 'doc-burgess-1876',
    slug: 'burgess-western-india-survey-1876',
    title: 'Report on the Antiquities of Kathiawad and Kachh (Archaeological Survey of Western India, Vol. II)',
    author_or_creator: 'Dr. James Burgess, F.R.G.S., M.R.A.S.',
    document_type: 'survey_report',
    period_date: '1876 CE',
    original_language: 'English with Sanskrit & Gujarati transcriptions',
    source_archive: 'Archaeological Survey of India / Imperial Secretariat Calcutta',
    license: 'Public Domain (Digitised Historical Archive)',
    original_scan_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
    transcription_status: 'verified',
    total_pages: 3,
    related_site_slugs: ['rani-ki-vav', 'modhera-sun-temple', 'adalaj-stepwell'],
    summary:
      'Colonial architectural survey detailing the subterranean stepwells of Gujarat and the Surya temple at Modhera, with ground plans, folio elevations, and epigraphic notes.',
    historical_context:
      'Compiled during the initial systematic architectural survey of the Bombay Presidency under the direction of the Government of India in 1874–1875.',
    created_at: '1876-05-15T00:00:00Z',
    passages: [
      {
        id: 'p-1',
        document_id: 'doc-burgess-1876',
        page_number: 1,
        passage_text:
          '“The stepwell or Vav at Patan, commonly called the Rani-ki-Vav or Queen’s Well, is universally attributed to Udayamati, the queen consort of Bhima I (1022–1064 A.D.). Though the greater portion has been despoiled of its upper colonnades for building material in modern Patan, the remaining shafts exhibit stone carving of extraordinary richness, portraying Vishnu in his various avataras, accompanied by celestial nymphs (apsarases) draped in diaphanous garments.”',
        key_entities: ['Rani ki Vav', 'Queen Udayamati', 'King Bhima I', 'Chaulukya Dynasty', 'Vishnu Avataras'],
      },
      {
        id: 'p-2',
        document_id: 'doc-burgess-1876',
        page_number: 2,
        passage_text:
          '“At Modhera, situated eighteen miles south of Patan on the Pushpavati river, stands the ruined temple of the Sun. It consists of two detached structures: the Sabha-mandapa or assembly hall, supported on 52 intricately carved columns representing the weeks of the solar year, and the sanctum proper with its pradakshina-patha. In front lies the great tank known as Rama-kund or Surya-kund, descending by pyramidal steps to the water’s edge with miniature shrines at every turn.”',
        key_entities: ['Modhera Sun Temple', 'Surya Kund', 'Sabha Mandapa', 'Solar Architecture', 'Chaulukya'],
      },
      {
        id: 'p-3',
        document_id: 'doc-burgess-1876',
        page_number: 3,
        passage_text:
          '“The inscription on the stepwell at Adalaj, 12 miles north of Ahmedabad, is dated Samvat 1555 (A.D. 1498). It explicitly records that the work was commenced by Rana Vira Simha of the Vaghela clan and completed by his queen Rudadevi after his demise, with an expenditure of five lakhs of tankas. The architecture presents a striking amalgamation of Hindu sculptural motifs with Islamic cusped archways.”',
        key_entities: ['Adalaj Stepwell', 'Queen Rudadevi', 'Rana Veer Singh', 'Vaghela Clan', 'Samvat 1555'],
      },
    ],
  },
  {
    id: 'doc-epigraph-1063',
    slug: 'prabandha-chintamani-udayamati-chronicle',
    title: 'Prabandha-Chintamani (Folio Chronicle on Queen Udayamati’s Subterranean Vav)',
    author_or_creator: 'Acharya Merutunga Suri',
    document_type: 'manuscript',
    period_date: '1305 CE (recording 1063 CE)',
    original_language: 'Sanskrit in Devanagari script',
    source_archive: 'Bhandarkar Oriental Research Institute & Jain Granth Mala',
    license: 'Public Domain (Ancient Literary Heritage)',
    original_scan_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    transcription_status: 'verified',
    total_pages: 2,
    related_site_slugs: ['rani-ki-vav'],
    summary:
      'Medieval Sanskrit text recording historical events, royal charters, and monumental building activities under the Solanki rulers of Anahilapataka (modern Patan).',
    historical_context:
      'Merutunga composed this chronicle in Vardhamana (Wadhwan) to record court genealogies, charitable endowments, and architectural undertakings of Solanki monarchs.',
    created_at: '1305-01-01T00:00:00Z',
    passages: [
      {
        id: 'p-4',
        document_id: 'doc-epigraph-1063',
        page_number: 1,
        passage_text:
          '“उदयमती नाम्न्या राज्ञ्या श्रीभीमदेवस्य देव्या पत्तने नवो जलप्रपातः कारितः। यश्च सहस्रलिंगसरोवरस्यापि शोभां व्यतिशेते स्म। अस्याम् वाप्यां शिलासंघाताः सप्तभूमिपरिमितं निखाताः।”\n\n(Translation: Queen Udayamati, beloved queen of King Bhimadeva, caused a magnificent stepwell to be constructed at Pattana. It eclipsed in artistic grandeur even the great Sahasralinga reservoir. Within this stepwell, tiers of carved stones were excavated across seven subterranean storeys.)',
        key_entities: ['Queen Udayamati', 'Bhimadeva', 'Pattana', 'Seven Subterranean Storeys', 'Sahasralinga'],
      },
    ],
  },
  {
    id: 'doc-asi-dholavira-1968',
    slug: 'asi-dholavira-excavation-log-1968',
    title: 'Field Survey Logbook: Discovery of Ancient Kotada at Dholavira, Kutch',
    author_or_creator: 'Jagat Pati Joshi, Director General of ASI',
    document_type: 'field_notes',
    period_date: '1968 CE',
    original_language: 'English',
    source_archive: 'Archaeological Survey of India Excavation Branch',
    license: 'Academic Reference / Public Archive',
    original_scan_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
    transcription_status: 'ocr_extracted',
    total_pages: 2,
    related_site_slugs: ['dholavira'],
    summary:
      'Initial excavation field notes by J.P. Joshi documenting the discovery of massive dressed stone fortifications and rainwater catchment reservoirs on the island of Khadir.',
    historical_context:
      'First documented record proving that Harappan settlements utilized dressed sandstone rather than merely mudbrick, adapted to the seasonal desert torrents of the Rann.',
    created_at: '1968-11-20T00:00:00Z',
    passages: [
      {
        id: 'p-5',
        document_id: 'doc-asi-dholavira-1968',
        page_number: 1,
        passage_text:
          '“Surveying Khadir bet in the Great Rann of Kutch: Found enormous citadel mound locally designated Kotada. Distinct from Mohenjo-daro and Harappa, the ramparts here are built of massive ashlar masonry composed of dressed calcareous sandstone slabs bedded in mud mortar. Immediate evidence of monumental water reservoirs cutting deep into the bedrock with stone-cut inlets and settling chambers.”',
        key_entities: ['Dholavira', 'Kotada', 'Khadir Bet', 'Water Catchment', 'Ashlar Masonry', 'J.P. Joshi'],
      },
    ],
  },
];
