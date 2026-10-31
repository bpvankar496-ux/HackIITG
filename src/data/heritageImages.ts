import type { HeritageMediaItem } from '../types/heritage';

/**
 * Canonical, manually verified photographs for the public heritage catalogue.
 *
 * Each source page identifies the work, photographer and licence.  Images are
 * requested through Wikimedia's FilePath endpoint with a bounded display
 * width, rather than linking to an unversioned third-party stock-photo URL.
 */
type HeritageImageDefinition = Omit<HeritageMediaItem, 'id' | 'url' | 'is_hero'> & {
  filename: string;
};

const commonsFileUrl = (filename: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename).replace(/%20/g, '_')}?width=1280`;

const commonsSourceUrl = (filename: string) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename).replace(/%20/g, '_')}`;

const image = (
  filename: string,
  alt: string,
  photographer: string,
  license: string,
): HeritageImageDefinition => ({
  filename,
  alt,
  photographer,
  license,
  source_url: commonsSourceUrl(filename),
});

export const HERITAGE_IMAGE_CATALOG: Record<string, HeritageImageDefinition> = {
  'rani-ki-vav': image('Rani ki vav 04.jpg', 'Rani ki Vav stepwell in Patan, Gujarat', 'Bernard Gagnon', 'CC BY-SA 3.0'),
  'adalaj-stepwell': image('Adalaj stepwell photo.jpg', 'Carved galleries at Adalaj Stepwell, Gujarat', 'Zaveri naznin', 'CC BY-SA 4.0'),
  'modhera-sun-temple': image('Modhera Sun Temple at Sunset.jpg', 'Modhera Sun Temple at sunset in Gujarat', 'Unmesh Dinda', 'CC BY-SA 4.0'),
  'champaner-pavagadh': image('Champaner, Jama Masjid (9840299734).jpg', 'Jama Masjid at Champaner-Pavagadh Archaeological Park', 'Arian Zwegers', 'CC BY 2.0'),
  'historic-city-ahmedabad': image('Historic City of Ahmedabad (52683813072).jpg', 'Historic streetscape in Ahmedabad, Gujarat', 'Ninara', 'CC BY 2.0'),
  dholavira: image('Dholavira archaeological site 1.jpg', 'Stone ruins at the Dholavira archaeological site', 'Bhuppigraphy', 'CC BY-SA 4.0'),
  'vadnagar-historic-town': image('Vadnagar Torana.JPG', 'Kirti Torana at Vadnagar, Gujarat', 'Mitesh51', 'CC BY-SA 3.0'),
  'sidi-saiyyed-mosque': image('Sidi Saiyyed Mosque, Ahmedabad.jpg', 'Sidi Saiyyed Mosque in Ahmedabad, Gujarat', 'Bernard Gagnon', 'CC BY-SA 3.0'),
  lothal: image('Lothal.jpg', 'Excavated remains at Lothal archaeological site, Gujarat', 'Raveesh Vyas', 'CC BY-SA 2.0'),
  'uparkot-fort': image('Uparkot fort of Junagadh.jpg', 'Uparkot Fort in Junagadh, Gujarat', 'Uddyotanasuri', 'CC BY-SA 4.0'),
  'somnath-temple': image('Somnath temple Gujarat India.jpg', 'Somnath Temple on the Gujarat coast', 'Narendralohiya', 'CC BY-SA 4.0'),
  'dwarkadhish-temple': image('Dwarkadhish Temple, Dwarka, Gujarat.JPG', 'Dwarkadhish Temple in Dwarka, Gujarat', 'Kunalmehra7', 'CC BY-SA 3.0'),
  'sarkhej-roza': image('Sarkhej.JPG', 'Sarkhej Roza complex in Ahmedabad, Gujarat', 'Museeb fakih', 'Public domain'),
  'dada-harir-stepwell': image('Into the dark, Dada Harir Stepwell, Ahmedabad, Gujarat.jpg', 'Interior stairway of Dada Harir Stepwell in Ahmedabad', 'Sharvarism', 'CC BY-SA 4.0'),
  'kumbhariya-jain-temples': image('Kumbharyaji Jain Temple.jpg', 'Jain temple at Kumbhariya, Gujarat', 'Shahnh', 'CC BY-SA 4.0'),
  'taranga-hill-temple': image('Taranga Jain temples.jpg', 'Taranga Jain temples in Gujarat', 'Capankajsmilyo', 'CC BY-SA 4.0'),
  'patan-patola': image('Loom to weave patola.jpg', 'Loom used to weave Patan patola textile', 'Bernard Gagnon', 'CC BY-SA 3.0'),
  'taj-mahal': image('Taj Mahal, Agra.jpg', 'Taj Mahal in Agra, Uttar Pradesh', 'John Kenny', 'CC BY-SA 2.0'),
  'agra-fort': image('Agra Fort Red.jpg', 'Jahangiri Mahal at Agra Fort, Uttar Pradesh', 'Dharven Panchal', 'CC BY-SA 4.0'),
  'fatehpur-sikri': image('Buland Darwaza (Fatehpur-Sikri).jpg', 'Buland Darwaza at Fatehpur Sikri, Uttar Pradesh', 'Kshitiz Sikka', 'CC BY-SA 4.0'),
  'qutb-minar-monuments': image('Qutub Minaar in delhi.jpg', 'Qutb Minar in Delhi', 'Gaurav Gupta', 'CC BY-SA 3.0'),
  'humayun-tomb': image("Humayun's Tomb Delhi.jpg", "Humayun's Tomb in Delhi", 'Ravimittalid', 'CC BY-SA 3.0'),
  'red-fort-delhi': image('Red fort, old delhi.jpg', 'Red Fort in Old Delhi', 'Sachin Sonkusare', 'CC BY-SA 4.0'),
  'khajuraho-monuments': image('Western Group of Temples Khajuraho.jpg', 'Western Group of Temples at Khajuraho', 'Jainarchit.17', 'CC BY-SA 4.0'),
  'sanchi-stupa': image('Sanchi Stupa, Sanchi.jpg', 'Great Stupa at Sanchi, Madhya Pradesh', 'achi28', 'CC BY-SA 4.0'),
  'amer-fort': image('Amer Fort Jaipur Rajasthan.jpg', 'Amer Fort near Jaipur, Rajasthan', 'Seervims', 'CC BY-SA 4.0'),
  'chittorgarh-fort': image('Chittorgarh fort.jpg', 'Temple ruins at Chittorgarh Fort, Rajasthan', 'Imanushkasingh', 'CC BY-SA 4.0'),
  'martand-sun-temple': image('Martanda sun temple.jpg', 'Ruins of the Martand Sun Temple in Kashmir', 'Shaurya', 'CC BY-SA 3.0'),
  'ajanta-caves': image('Ajanta Caves panorama view.jpg', 'Panoramic view of the Ajanta Caves in Maharashtra', 'Ms Sarah Welch', 'CC BY-SA 4.0'),
  'ellora-caves': image('Kailasa Ellora.jpg', 'Kailasa Temple at Ellora Caves, Maharashtra', 'Shishirdasika', 'CC BY-SA 4.0'),
  'elephanta-caves': image('Elephanta Caves photography.jpg', 'Elephanta Caves near Mumbai, Maharashtra', 'AniketUpasham25', 'CC BY-SA 4.0'),
  hampi: image('Stone Chariot at Vittala Temple Complex, Hampi.jpg', 'Stone Chariot at Vittala Temple Complex in Hampi', 'Prakruth Gowda', 'CC BY-SA 4.0'),
  'pattadakal-monuments': image('Pattadakal Temple Complex.jpg', 'Temples of the Pattadakal monument complex, Karnataka', 'Ladybird789', 'CC BY-SA 4.0'),
  'mahabalipuram-monuments': image('Shore Temple Mahabalipuram India.jpg', 'Shore Temple at Mahabalipuram, Tamil Nadu', 'Rvk1982', 'CC BY-SA 4.0'),
  'brihadisvara-temple': image('Brihadeeswarar Temple, Thanjavur.JPG', 'Brihadisvara Temple in Thanjavur, Tamil Nadu', 'Aalangaram', 'CC BY-SA 3.0'),
  'meenakshi-temple': image('Meenakshi Temple, Gopuram, Madurai, India.jpg', 'Gopuram of Meenakshi Temple in Madurai', 'Vyacheslav Argenberg', 'CC BY 4.0'),
  'golconda-fort': image('Golconda Fort, Hyderabad.jpg', 'Golconda Fort in Hyderabad, Telangana', 'Apar Singh Bataan', 'CC BY-SA 3.0'),
  'nalanda-mahavihara': image('Archeological Ruins of Nalanda Mahavihara.jpg', 'Archaeological ruins of Nalanda Mahavihara in Bihar', 'Uphogaphy', 'CC BY-SA 4.0'),
  'konark-sun-temple': image('Konark Sun Temple in Odisha.jpg', 'Konark Sun Temple in Odisha', 'C Ajay Karthikeyan', 'CC BY-SA 4.0'),
  'bishnupur-temples': image('Bishnupur terracotta temple.jpg', 'Terracotta temple at Bishnupur, West Bengal', 'Ronin Sen Hazra', 'CC BY-SA 4.0'),
  'kamakhya-temple': image('Kamakhya Temple, Guwahati.jpg', 'Kamakhya Temple in Guwahati, Assam', 'Kunal Dalui', 'CC BY-SA 3.0'),
  'victoria-memorial': image('Victoria memorial hall, kolkata.jpg', 'Victoria Memorial Hall in Kolkata, West Bengal', 'Subhojit.sil', 'CC BY-SA 3.0'),
};

export const getHeritageMedia = (slug: string): HeritageMediaItem | undefined => {
  const item = HERITAGE_IMAGE_CATALOG[slug];
  if (!item) return undefined;

  return {
    id: `commons-${slug}`,
    url: commonsFileUrl(item.filename),
    alt: item.alt,
    photographer: item.photographer,
    license: item.license,
    source_url: item.source_url,
    is_hero: true,
  };
};
