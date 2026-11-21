import { CATEGORIES, DEPARTMENTS, SEVERITIES, LANGUAGES } from '../types';

// Multilingual keyword dictionary for offline rule-based triage
const CATEGORY_KEYWORDS = {
  [CATEGORIES.ROADS]: {
    en: ['pothole', 'potholes', 'crater', 'broken road', 'tar', 'asphalt', 'footpath', 'pavement', 'ditch', 'speed breaker', 'road cave', 'bad road', 'sinkhole'],
    kn: ['ಗುಂಡಿ', 'ರಸ್ತೆ', 'ಫುಟ್‌ಪಾತ್', 'ಹೊಂಡ', 'ತಗ್ಗು', 'ಡಾಂಬರು', 'ಕಾಲುದಾರಿ'],
    hi: ['गड्ढा', 'गड्ढे', 'सड़क', 'रास्ता', 'फुटपाथ', 'रोड', 'डामर', 'खराब सड़क']
  },
  [CATEGORIES.WASTE]: {
    en: ['garbage', 'trash', 'waste', 'debris', 'rubbish', 'litter', 'dump', 'rotting', 'stench', 'smell', 'plastic', 'overflowing dustbin', 'bin', 'swm'],
    kn: ['ಕಸ', 'ತ್ಯಾಜ್ಯ', 'ಕೊಳೆ', 'ತಿಪ್ಪೆ', 'ದುರ್ವಾಸನೆ', 'ಪ್ಲಾಸ್ಟಿಕ್', 'ಕಸದ ತೊಟ್ಟಿ'],
    hi: ['कचरा', 'कूड़ा', 'गंदगी', 'बदबू', 'कूड़ेदान', 'प्लास्टिक', 'मलबा']
  },
  [CATEGORIES.WATER]: {
    en: ['water leak', 'water leakage', 'pipe burst', 'pipeline', 'drinking water', 'contaminated water', 'dirty water', 'water supply', 'no water', 'tap broken', 'bwssb'],
    kn: ['ನೀರು', 'ಸೋರಿಕೆ', 'ಪೈಪ್', 'ಕುಡಿಯುವ ನೀರು', 'ಕೊಳಚೆ ನೀರು', 'ನೀರು ಸರಬರಾಜು'],
    hi: ['पानी', 'लीकेज', 'पाइप', 'जल', 'नल', 'गंदा पानी', 'पानी की सप्लाई', 'पाइपलाइन']
  },
  [CATEGORIES.ELECTRICITY]: {
    en: ['electric', 'wire', 'spark', 'cable', 'pole', 'transformer', 'power cut', 'blackout', 'streetlight', 'street light', 'electrocution', 'shock', 'hanging wire', 'bescom'],
    kn: ['ವಿದ್ಯುತ್', 'ಕರೆಂಟ್', 'ತಂತಿ', 'ಕಂಬ', 'ಸ್ಪಾರ್ಕ್', 'ಬೀದಿ ದೀಪ', 'ದೀಪ', 'ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್'],
    hi: ['बिजली', 'तार', 'करंट', 'खंभा', 'चिंगारी', 'स्ट्रीट लाइट', 'ट्रांसफार्मर', 'शॉर्ट सर्किट']
  },
  [CATEGORIES.TREES]: {
    en: ['tree', 'branch', 'fallen tree', 'uprooted', 'dry branch', 'foliage', 'overgrown branch', 'falling tree', 'horticulture'],
    kn: ['ಮರ', 'ಕೊಂಬೆ', 'ಬಿದ್ದ ಮರ', 'ಬುಡಮೇಲಾದ ಮರ', 'ಒಣಗಿದ ಕೊಂಬೆ'],
    hi: ['पेड़', 'टहनी', 'शाखा', 'गिरा हुआ पेड़', 'सूखी लकड़ी', 'जड़ से उखड़ा']
  },
  [CATEGORIES.DRAINAGE]: {
    en: ['drainage', 'drain', 'gutter', 'open manhole', 'manhole lid', 'clogged drain', 'sewer', 'sewage overflow', 'stormwater', 'blocked drain', 'culvert'],
    kn: ['ಚರಂಡಿ', 'ಒಳಚರಂಡಿ', 'ಮ್ಯಾನ್‌ಹೋಲ್', 'ಕೊಳಚೆ', 'ಮುಚ್ಚಳವಿಲ್ಲದ ಮ್ಯಾನ್‌ಹೋಲ್'],
    hi: ['नाली', 'नाला', 'सीवर', 'मैनहोल', 'खुला मैनहोल', 'नाली जाम', 'गंदा नाला']
  }
};

// Patterns indicating immediate life-threatening danger -> Always CRITICAL regardless of report count
const CRITICAL_KEYWORDS = {
  en: [
    'exposed wire', 'live wire', 'electric shock', 'sparking transformer', 'hanging electric wire',
    'open manhole', 'manhole without lid', 'electrocution risk', 'child fell', 'toxic gas',
    'gas leak', 'building collapse', 'short circuit fire', 'landslide'
  ],
  kn: [
    'ತೆರೆದ ತಂತಿ', 'ಕರೆಂಟ್ ಶಾಕ್', 'ತೆರೆದ ಮ್ಯಾನ್‌ಹೋಲ್', 'ಸ್ಪಾರ್ಕ್', 'ಜೀವಕ್ಕೆ ಅಪಾಯ',
    'ಮುಚ್ಚಳವಿಲ್ಲದ ಮ್ಯಾನ್‌ಹೋಲ್', 'ಬೆಂಕಿ ಅಪಾಯ'
  ],
  hi: [
    'खुला तार', 'करंट लग रहा', 'नंगा तार', 'खुला मैनहोल', 'चिंगारी निकल रही',
    'जानलेवा', 'शॉर्ट सर्किट', 'आग का खतरा'
  ]
};

// Patterns indicating High severity
const HIGH_KEYWORDS = {
  en: ['major blockage', 'pipe burst', 'flooding', 'tree blocked road', 'traffic stopped', 'deep crater', 'sewage entering houses', 'complete darkness'],
  kn: ['ದೊಡ್ಡ ಹೊಂಡ', 'ರಸ್ತೆ ಬಂದ್', 'ಮುಳುಗಡೆ', 'ಮನೆಗೆ ಕೊಳಚೆ ನೀರು', 'ಭಾರಿ ಸೋರಿಕೆ'],
  hi: ['बड़ा गड्ढा', 'सड़क बंद', 'बाढ़', 'पानी घरों में', 'पाइप फट गया', 'जाम लग गया']
};

// Patterns indicating Low severity
const LOW_KEYWORDS = {
  en: ['minor litter', 'small puddle', 'dustbin full', 'flickering', 'sweeping needed', 'dry leaves', 'cosmetic'],
  kn: ['ಸ್ವಲ್ಪ ಕಸ', 'ಒಣ ಎಲೆಗಳು', 'ಕಸ ಗುಡಿಸುವುದು'],
  hi: ['हल्का कचरा', 'सूखे पत्ते', 'सफाई चाहिए', 'थोड़ा गंदा']
};

/**
 * Classifies an incoming complaint using local rule-based keyword matching.
 * Guarantees 100% offline predictability and transparent explanation.
 */
export function triageComplaint(text, languageCode = 'en-IN') {
  const normalizedText = (text || '').toLowerCase().trim();
  const langObj = LANGUAGES.find(l => l.code === languageCode) || LANGUAGES[0];
  const langKey = languageCode.startsWith('kn') ? 'kn' : languageCode.startsWith('hi') ? 'hi' : 'en';

  let detectedCategory = null;
  let categoryScore = 0;
  let matchedKeyword = '';

  // 1. Detect Category across dictionaries
  for (const [category, dict] of Object.entries(CATEGORY_KEYWORDS)) {
    const keywords = [...(dict[langKey] || []), ...(dict.en || [])];
    for (const kw of keywords) {
      if (normalizedText.includes(kw.toLowerCase())) {
        detectedCategory = category;
        categoryScore += 1;
        matchedKeyword = kw;
        break;
      }
    }
    if (detectedCategory) break;
  }

  // Fallback for other Indian languages without exact dictionary hit
  let requiresManualReview = false;
  if (!detectedCategory) {
    if (langKey !== 'en' && langKey !== 'kn' && langKey !== 'hi') {
      detectedCategory = CATEGORIES.OTHER;
      requiresManualReview = true;
    } else {
      detectedCategory = CATEGORIES.OTHER;
    }
  }

  const department = DEPARTMENTS[detectedCategory] || DEPARTMENTS[CATEGORIES.OTHER];

  // 2. Detect Severity (Life threatening check FIRST!)
  let severity = SEVERITIES.MEDIUM;
  let severityReason = '';

  // Check Critical
  let isCritical = false;
  let criticalMatch = '';
  const criticalList = [...(CRITICAL_KEYWORDS[langKey] || []), ...(CRITICAL_KEYWORDS.en || [])];
  for (const kw of criticalList) {
    if (normalizedText.includes(kw.toLowerCase())) {
      isCritical = true;
      criticalMatch = kw;
      break;
    }
  }

  if (isCritical) {
    severity = SEVERITIES.CRITICAL;
    severityReason = `Critical Safety Hazard: Detected life-threatening condition ("${criticalMatch}") requiring immediate emergency response within 2 hours.`;
  } else {
    // Check High
    let isHigh = false;
    let highMatch = '';
    const highList = [...(HIGH_KEYWORDS[langKey] || []), ...(HIGH_KEYWORDS.en || [])];
    for (const kw of highList) {
      if (normalizedText.includes(kw.toLowerCase())) {
        isHigh = true;
        highMatch = kw;
        break;
      }
    }

    if (isHigh) {
      severity = SEVERITIES.HIGH;
      severityReason = `High Impact: Severe operational disruption detected ("${highMatch}") blocking public mobility or essential utility lines.`;
    } else {
      // Check Low
      let isLow = false;
      let lowMatch = '';
      const lowList = [...(LOW_KEYWORDS[langKey] || []), ...(LOW_KEYWORDS.en || [])];
      for (const kw of lowList) {
        if (normalizedText.includes(kw.toLowerCase())) {
          isLow = true;
          lowMatch = kw;
          break;
        }
      }

      if (isLow) {
        severity = SEVERITIES.LOW;
        severityReason = `Low Impact: Minor civic maintenance item ("${lowMatch}") with no immediate public safety or mobility hazard.`;
      } else {
        // Default category-specific medium reasoning
        severity = SEVERITIES.MEDIUM;
        if (requiresManualReview) {
          severityReason = `Manual Review Flagged: Multilingual report in ${langObj.native} (${langObj.name}) preserved in full for human triage confirmation.`;
        } else {
          severityReason = `Medium Impact: Standard municipal service request for ${detectedCategory} requiring scheduled field crew inspection.`;
        }
      }
    }
  }

  return {
    category: detectedCategory,
    department,
    severity,
    severityReason,
    requiresManualReview,
    matchedKeyword: matchedKeyword || 'general',
    classifierMetadata: {
      type: 'Rule-Based Local Heuristic Classifier',
      confidence: detectedCategory !== CATEGORIES.OTHER ? 'High (Rule Match)' : 'Pending Manual Review',
      timestamp: new Date().toISOString()
    }
  };
}
