// PhoneticEngine.js - Core detection algorithms for React Native
// This contains ALL our advanced phonetic detection functions

import { Platform } from 'react-native';

// Simplified CMU Dictionary (expand with full 130k+ words in production)
const CMU_DICTIONARY = {
  // Common words with phonetic representations
  'eat': 'IY T',
  'rapper': 'R AE P ER',
  'alive': 'AH L AY V',
  'screams': 'S K R IY M Z',
  'fuel': 'F Y UW L',
  'me': 'M IY',
  'please': 'P L IY Z',
  'fight': 'F AY T',
  'useless': 'Y UW S L AH S',
  'toothless': 'T UW TH L AH S',
  'libless': 'L IH B L AH S',
  'eyes': 'AY Z',
  'gauged': 'G EY JH D',
  'out': 'AW T',
  'mouth': 'M AW TH',
  'foul': 'F AW L',
  'foule': 'F AW L',
  'fowl': 'F AW L',
  'mine': 'M AY N',
  'now': 'N AW',
  'fire': 'F AY ER',
  'fills': 'F IH L Z',
  'sky': 'S K AY',
  'flames': 'F L EY M Z',
  'spout': 'S P AW T',
  'found': 'F AW N D',
  'gawd': 'G AA D',
  'god': 'G AA D',
  'gods': 'G AA D Z',
  'broad': 'B R AA D',
  'broads': 'B R AA D Z',
  'sound': 'S AW N D',
  'noun': 'N AW N',
  'renowned': 'R IH N AW N D',
  'unknown': 'AH N N OW N',
  'around': 'ER AW N D',
  'here': 'HH IY R',
  'hear': 'HH IY R',
  'flow': 'F L OW',
  'window': 'W IH N D OW',
  'widow': 'W IH D OW',
  'through': 'TH R UW',
  'thru': 'TH R UW',
  'threw': 'TH R UW',
  // Add more as needed
};

// Double Metaphone Algorithm
export const doubleMetaphone = (word) => {
  if (!word) return '';
  
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  
  // Primary phonetic patterns
  const patterns = {
    'ph': 'F',
    'gh': '',
    'ough': 'O',
    'augh': 'O',
    'gn': 'N',
    'kn': 'N',
    'wr': 'R',
    'ck': 'K',
    'dge': 'J',
    'tch': 'CH',
    'tion': 'SHN',
    'sion': 'ZHN',
    'ci': 'SH',
    'ce': 'S',
    'sc': 'S',
    'qu': 'KW',
    'x': 'KS',
    'wh': 'W'
  };
  
  let result = cleaned;
  for (const [pattern, replacement] of Object.entries(patterns)) {
    result = result.replace(new RegExp(pattern, 'g'), replacement);
  }
  
  return result.toUpperCase();
};

// Get phonetic representation of a word
export const getPhonetic = (word) => {
  if (!word) return '';
  
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  
  // Check CMU dictionary first
  if (CMU_DICTIONARY[cleaned]) {
    return CMU_DICTIONARY[cleaned];
  }
  
  // Handle common suffixes
  if (cleaned.endsWith('ing')) {
    const root = cleaned.slice(0, -3);
    if (CMU_DICTIONARY[root]) {
      return CMU_DICTIONARY[root] + ' IH NG';
    }
  }
  
  if (cleaned.endsWith('ed')) {
    const root = cleaned.slice(0, -2);
    if (CMU_DICTIONARY[root]) {
      return CMU_DICTIONARY[root] + ' D';
    }
  }
  
  if (cleaned.endsWith('s')) {
    const root = cleaned.slice(0, -1);
    if (CMU_DICTIONARY[root]) {
      return CMU_DICTIONARY[root] + ' Z';
    }
  }
  
  // Fallback to double metaphone
  return doubleMetaphone(cleaned);
};

// Extract phonetic ending for rhyme detection
export const getPhoneticEnding = (phonetic) => {
  if (!phonetic) return '';
  
  const parts = phonetic.split(' ');
  
  // Find last stressed vowel and everything after
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].match(/[AEIOU]/)) {
      return parts.slice(Math.max(0, i - 1)).join(' ');
    }
  }
  
  return parts[parts.length - 1] || '';
};

// Vowel sounds in CMU notation
export const VOWEL_SOUNDS = [
  'IY', 'IH', 'EY', 'EH', 'AE', 'AA', 'AO', 
  'OW', 'UH', 'UW', 'AH', 'AY', 'AW', 'OY', 'ER'
];

// Consonant clusters for consonance detection
export const CONSONANT_CLUSTERS = [
  'ST', 'SK', 'SP', 'SM', 'SN', 'SW', 'SL', 'SH', 'SCH',
  'TR', 'DR', 'PR', 'BR', 'KR', 'GR', 'FR', 'THR',
  'FL', 'BL', 'KL', 'GL', 'PL', 'SL',
  'TS', 'DS', 'PS', 'KS', 'FS', 'THS',
  'MP', 'NT', 'ND', 'NK', 'NG', 'NCH',
  'FT', 'PT', 'KT', 'LT', 'RT', 'RD', 'RK', 'RM', 'RN'
];

// ============================================
// CORE DETECTION FUNCTIONS
// ============================================

// 1. PHONETIC RHYME DETECTION
export const detectPhoneticRhymes = (lines) => {
  const rhymes = {
    perfect: [],
    slant: [],
    near: [],
    internal: []
  };
  
  // Extract all words with positions
  const words = [];
  lines.forEach((line, lineIndex) => {
    const lineWords = line.split(/\s+/);
    lineWords.forEach((word, wordIndex) => {
      const cleaned = word.replace(/[^a-z]/gi, '').toLowerCase();
      if (cleaned.length > 1) {
        const phonetic = getPhonetic(cleaned);
        const ending = getPhoneticEnding(phonetic);
        words.push({
          word,
          cleaned,
          phonetic,
          ending,
          lineIndex,
          wordIndex,
          isLineEnd: wordIndex === lineWords.length - 1
        });
      }
    });
  });
  
  // Find rhyme pairs
  const rhymeGroups = new Map();
  
  words.forEach((w1, i) => {
    words.slice(i + 1).forEach(w2 => {
      if (w1.cleaned === w2.cleaned) return; // Skip same word
      
      // Perfect rhyme - exact phonetic ending match
      if (w1.ending && w2.ending && w1.ending === w2.ending) {
        const key = w1.ending;
        if (!rhymeGroups.has(key)) {
          rhymeGroups.set(key, new Set());
        }
        rhymeGroups.get(key).add(w1.cleaned);
        rhymeGroups.get(key).add(w2.cleaned);
      }
      // Slant rhyme - partial ending match
      else if (w1.ending && w2.ending) {
        const ending1Parts = w1.ending.split(' ');
        const ending2Parts = w2.ending.split(' ');
        const commonParts = ending1Parts.filter(p => ending2Parts.includes(p));
        
        if (commonParts.length >= 1 && commonParts.some(p => VOWEL_SOUNDS.includes(p))) {
          rhymes.slant.push({
            words: [w1.cleaned, w2.cleaned],
            phonetics: [w1.ending, w2.ending]
          });
        }
      }
      
      // Internal rhyme detection
      if (w1.lineIndex === w2.lineIndex && !w1.isLineEnd) {
        if (w1.ending === w2.ending) {
          rhymes.internal.push({
            line: w1.lineIndex,
            words: [w1.cleaned, w2.cleaned]
          });
        }
      }
    });
  });
  
  // Convert rhyme groups to array
  rhymeGroups.forEach((words, ending) => {
    rhymes.perfect.push({
      words: Array.from(words),
      phonetic: ending,
      count: words.size
    });
  });
  
  return rhymes;
};

// 2. SOUND-BASED ALLITERATION
export const detectSoundAlliteration = (lines) => {
  const alliterations = [];
  
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/).filter(w => w.length > 0);
    
    for (let i = 0; i < words.length - 1; i++) {
      const phonetic1 = getPhonetic(words[i]);
      const phonetic2 = getPhonetic(words[i + 1]);
      
      if (phonetic1 && phonetic2) {
        // Compare first phonetic sound (not spelling!)
        const sound1 = phonetic1.split(' ')[0];
        const sound2 = phonetic2.split(' ')[0];
        
        if (sound1 && sound2 && sound1[0] === sound2[0]) {
          alliterations.push({
            words: [words[i], words[i + 1]],
            sound: sound1[0],
            phonetics: [phonetic1, phonetic2],
            lineIndex,
            type: 'alliteration'
          });
        }
      }
    }
  });
  
  return alliterations;
};

// 3. ASSONANCE (Vowel Sound Patterns)
export const detectAssonance = (lines) => {
  const assonances = [];
  
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/).filter(w => w.length > 2);
    
    words.forEach((word1, i) => {
      const phonetic1 = getPhonetic(word1);
      const vowels1 = VOWEL_SOUNDS.filter(v => phonetic1.includes(v));
      
      // Check next 2-3 words for matching vowel sounds
      words.slice(i + 1, i + 4).forEach((word2, j) => {
        const phonetic2 = getPhonetic(word2);
        const vowels2 = VOWEL_SOUNDS.filter(v => phonetic2.includes(v));
        
        const sharedVowels = vowels1.filter(v => vowels2.includes(v));
        if (sharedVowels.length > 0) {
          assonances.push({
            words: [word1, word2],
            vowelSounds: sharedVowels,
            phonetics: [phonetic1, phonetic2],
            lineIndex,
            distance: j + 1,
            type: 'assonance'
          });
        }
      });
    });
  });
  
  return assonances;
};

// 4. CONSONANCE (Consonant Sound Patterns)
export const detectConsonance = (lines) => {
  const consonances = [];
  
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/).filter(w => w.length > 2);
    
    words.forEach((word1, i) => {
      const phonetic1 = getPhonetic(word1);
      
      words.slice(i + 1, i + 4).forEach((word2, j) => {
        const phonetic2 = getPhonetic(word2);
        
        // Check for matching consonant clusters
        const matchingClusters = CONSONANT_CLUSTERS.filter(cluster => 
          phonetic1.includes(cluster) && phonetic2.includes(cluster)
        );
        
        if (matchingClusters.length > 0) {
          consonances.push({
            words: [word1, word2],
            clusters: matchingClusters,
            phonetics: [phonetic1, phonetic2],
            lineIndex,
            distance: j + 1,
            type: 'consonance'
          });
        }
      });
    });
  });
  
  return consonances;
};

// 5. HOMOPHONE DETECTION
export const detectHomophones = (lines) => {
  const homophones = [];
  
  // Common homophones database
  const HOMOPHONE_SETS = [
    ['here', 'hear'],
    ['there', 'their', 'theyre'],
    ['to', 'too', 'two'],
    ['know', 'no'],
    ['knew', 'new'],
    ['through', 'threw', 'thru'],
    ['your', 'youre'],
    ['its', 'its'],
    ['write', 'right', 'rite'],
    ['site', 'sight', 'cite'],
    ['break', 'brake'],
    ['peace', 'piece'],
    ['wait', 'weight'],
    ['waste', 'waist'],
    ['hole', 'whole'],
    ['soul', 'sole'],
    ['roll', 'role'],
    ['throne', 'thrown']
  ];
  
  lines.forEach((line, lineIndex) => {
    const lineLower = line.toLowerCase();
    const words = line.split(/\s+/);
    
    // Check for known homophones
    HOMOPHONE_SETS.forEach(set => {
      const found = set.filter(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lineLower);
      });
      
      if (found.length > 0) {
        homophones.push({
          words: found,
          set: set,
          lineIndex,
          type: 'homophone'
        });
      }
    });
    
    // Check for phonetic homophones (same sound, different spelling)
    words.forEach((word1, i) => {
      const phonetic1 = getPhonetic(word1);
      
      words.slice(i + 1).forEach(word2 => {
        const phonetic2 = getPhonetic(word2);
        
        if (phonetic1 === phonetic2 && word1.toLowerCase() !== word2.toLowerCase()) {
          homophones.push({
            words: [word1, word2],
            phonetic: phonetic1,
            lineIndex,
            type: 'phonetic_homophone'
          });
        }
      });
    });
  });
  
  return homophones;
};

// 6. WORDPLAY DETECTION
export const detectWordplay = (lines) => {
  const wordplay = [];
  
  const WORDPLAY_PATTERNS = [
    {
      type: 'spelling_variant',
      examples: [['foule', 'foul', 'fowl'], ['gawd', 'god']]
    },
    {
      type: 'bilingual',
      examples: [['casa', 'house'], ['mi', 'my'], ['si', 'yes']]
    },
    {
      type: 'phonetic_transformation',
      examples: [['window', 'widow']]
    },
    {
      type: 'double_meaning',
      keywords: ['fly', 'dope', 'sick', 'ill', 'fire', 'cold', 'hot', 'bars']
    }
  ];
  
  lines.forEach((line, lineIndex) => {
    const lineLower = line.toLowerCase();
    
    WORDPLAY_PATTERNS.forEach(pattern => {
      if (pattern.examples) {
        pattern.examples.forEach(group => {
          const matches = group.filter(word => 
            lineLower.includes(word.toLowerCase())
          );
          
          if (matches.length > 0) {
            wordplay.push({
              type: pattern.type,
              words: matches,
              lineIndex
            });
          }
        });
      }
      
      if (pattern.keywords) {
        pattern.keywords.forEach(keyword => {
          if (lineLower.includes(keyword)) {
            wordplay.push({
              type: 'double_meaning',
              word: keyword,
              lineIndex
            });
          }
        });
      }
    });
  });
  
  return wordplay;
};

// 7. METAPHOR & SIMILE DETECTION
export const detectMetaphorsSimiles = (lines) => {
  const results = [];
  
  // Simile markers
  const SIMILE_MARKERS = ['like', 'as', 'than'];
  
  // Common metaphor patterns
  const METAPHOR_PATTERNS = [
    /(\w+)\s+is\s+(?:a|an|the)?\s*(\w+)/,  // X is Y
    /(\w+)\s+of\s+(\w+)/,                   // X of Y
    /my\s+(\w+)\s+(\w+)/,                   // my X Y (possessive metaphor)
  ];
  
  lines.forEach((line, lineIndex) => {
    // Check for similes
    SIMILE_MARKERS.forEach(marker => {
      const regex = new RegExp(`\\b\\w+\\s+${marker}\\s+\\w+`, 'gi');
      const matches = line.match(regex);
      
      if (matches) {
        matches.forEach(match => {
          results.push({
            type: 'simile',
            phrase: match,
            marker,
            lineIndex
          });
        });
      }
    });
    
    // Check for metaphor patterns
    METAPHOR_PATTERNS.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        results.push({
          type: 'metaphor',
          phrase: matches[0],
          lineIndex
        });
      }
    });
    
    // Check for action metaphors (non-literal actions)
    const ACTION_METAPHORS = [
      'eat a rapper',
      'drop bombs',
      'spit fire',
      'murder the beat',
      'kill the game',
      'catch bodies'
    ];
    
    ACTION_METAPHORS.forEach(metaphor => {
      if (line.toLowerCase().includes(metaphor)) {
        results.push({
          type: 'action_metaphor',
          phrase: metaphor,
          lineIndex
        });
      }
    });
  });
  
  return results;
};

// 8. REPETITION DETECTION (Anaphora, Epistrophe, etc.)
export const detectRepetition = (lines) => {
  const repetitions = {
    anaphora: [],      // Same beginning
    epistrophe: [],    // Same ending
    symploce: [],      // Both
    word: [],          // Repeated words
    phrase: []         // Repeated phrases
  };
  
  // Check for anaphora (repeated beginnings)
  const beginnings = lines.map(line => {
    const words = line.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    return words;
  });
  
  beginnings.forEach((beginning, i) => {
    const matches = beginnings
      .map((b, j) => ({ beginning: b, index: j }))
      .filter((item, j) => j !== i && item.beginning === beginning);
    
    if (matches.length > 0) {
      repetitions.anaphora.push({
        phrase: beginning,
        lines: [i, ...matches.map(m => m.index)]
      });
    }
  });
  
  // Check for epistrophe (repeated endings)
  const endings = lines.map(line => {
    const words = line.split(/\s+/);
    return words.slice(-3).join(' ').toLowerCase();
  });
  
  endings.forEach((ending, i) => {
    const matches = endings
      .map((e, j) => ({ ending: e, index: j }))
      .filter((item, j) => j !== i && item.ending === ending);
    
    if (matches.length > 0) {
      repetitions.epistrophe.push({
        phrase: ending,
        lines: [i, ...matches.map(m => m.index)]
      });
    }
  });
  
  // Check for repeated words
  const wordFrequency = {};
  lines.forEach((line, lineIndex) => {
    const words = line.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 3) {  // Only track significant words
        if (!wordFrequency[cleaned]) {
          wordFrequency[cleaned] = [];
        }
        wordFrequency[cleaned].push(lineIndex);
      }
    });
  });
  
  Object.entries(wordFrequency).forEach(([word, lineIndices]) => {
    if (lineIndices.length > 2) {  // Word appears 3+ times
      repetitions.word.push({
        word,
        count: lineIndices.length,
        lines: lineIndices
      });
    }
  });
  
  return repetitions;
};

// 9. REFERENCE & ALLUSION DETECTION
export const detectReferences = (lines) => {
  const references = [];
  
  const REFERENCE_DATABASE = {
    cultural: {
      'danny ocean': "Ocean's Eleven reference",
      'pokemon': 'Pokemon reference',
      'kaiju': 'Japanese monster movies',
      'godzilla': 'Godzilla reference'
    },
    gaming: {
      'umbasa': "Demon's Souls reference",
      'boss battle': 'Video game reference',
      'level up': 'Gaming terminology'
    },
    religious: {
      'gawd': 'God (stylized)',
      'pray': 'Religious reference',
      'heaven': 'Religious reference',
      'hell': 'Religious reference',
      'demon': 'Religious reference'
    },
    hiphop: {
      'bars': 'Rap terminology',
      'cypher': 'Hip-hop culture',
      'flow': 'Rap terminology',
      'spit': 'Rap terminology',
      'freestyle': 'Hip-hop culture'
    },
    linguistic: {
      'su casa mi casa': 'Spanish phrase',
      'cest la vie': 'French phrase',
      'carpe diem': 'Latin phrase'
    }
  };
  
  lines.forEach((line, lineIndex) => {
    const lineLower = line.toLowerCase();
    
    Object.entries(REFERENCE_DATABASE).forEach(([category, refs]) => {
      Object.entries(refs).forEach(([term, description]) => {
        if (lineLower.includes(term)) {
          references.push({
            category,
            term,
            description,
            lineIndex
          });
        }
      });
    });
  });
  
  return references;
};

// 10. SYLLABLE & STRESS PATTERN ANALYSIS
export const analyzeSyllablePatterns = (lines) => {
  const patterns = [];
  
  lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/).filter(w => w);
    let syllableCount = 0;
    const stressPattern = [];
    
    words.forEach(word => {
      const phonetic = getPhonetic(word);
      
      // Count syllables (vowel sounds)
      const vowelMatches = phonetic.match(/[AEIOU]/g);
      const wordSyllables = vowelMatches ? vowelMatches.length : 1;
      syllableCount += wordSyllables;
      
      // Detect stress (CMU notation: 0=no stress, 1=primary, 2=secondary)
      if (phonetic.includes('1')) {
        stressPattern.push('S');  // Stressed
      } else {
        stressPattern.push('u');  // Unstressed
      }
    });
    
    patterns.push({
      lineIndex,
      syllableCount,
      stressPattern: stressPattern.join(''),
      iambic: stressPattern.join('').includes('uS'),
      trochaic: stressPattern.join('').includes('Su')
    });
  });
  
  return patterns;
};

// 11. FLOW COMPLEXITY SCORING
export const calculateFlowComplexity = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  const metrics = {
    rhymeDensity: 0,
    internalRhymes: 0,
    multisyllabicRhymes: 0,
    literaryDevices: 0,
    vocabularyDiversity: 0,
    syllableConsistency: 0,
    phoneticDiversity: 0
  };
  
  // Calculate rhyme density
  const rhymes = detectPhoneticRhymes(lines);
  const totalWords = text.split(/\s+/).length;
  const rhymingWords = new Set();
  
  rhymes.perfect.forEach(group => {
    group.words.forEach(word => rhymingWords.add(word));
  });
  
  metrics.rhymeDensity = (rhymingWords.size / totalWords) * 100;
  metrics.internalRhymes = rhymes.internal.length;
  
  // Count multisyllabic rhymes
  rhymes.perfect.forEach(group => {
    group.words.forEach(word => {
      if (getPhonetic(word).split(' ').length > 2) {
        metrics.multisyllabicRhymes++;
      }
    });
  });
  
  // Count literary devices
  const devices = [
    detectSoundAlliteration(lines),
    detectAssonance(lines),
    detectConsonance(lines),
    detectHomophones(lines),
    detectWordplay(lines),
    detectMetaphorsSimiles(lines)
  ];
  
  metrics.literaryDevices = devices.reduce((sum, device) => sum + device.length, 0);
  
  // Calculate vocabulary diversity
  const words = text.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
  const uniqueWords = new Set(words);
  metrics.vocabularyDiversity = (uniqueWords.size / words.length) * 100;
  
  // Calculate syllable consistency
  const syllablePatterns = analyzeSyllablePatterns(lines);
  const avgSyllables = syllablePatterns.reduce((sum, p) => sum + p.syllableCount, 0) / lines.length;
  const variance = syllablePatterns.reduce((sum, p) => 
    sum + Math.abs(p.syllableCount - avgSyllables), 0
  ) / lines.length;
  metrics.syllableConsistency = Math.max(0, 100 - (variance * 10));
  
  // Calculate overall complexity score (0-100)
  const complexityScore = Math.min(100, 
    (metrics.rhymeDensity * 0.25) +
    (metrics.internalRhymes * 2) +
    (metrics.multisyllabicRhymes * 1.5) +
    (metrics.literaryDevices * 0.5) +
    (metrics.vocabularyDiversity * 0.2) +
    (metrics.syllableConsistency * 0.15)
  );
  
  return {
    score: Math.round(complexityScore),
    metrics,
    level: 
      complexityScore >= 80 ? 'Expert' :
      complexityScore >= 60 ? 'Advanced' :
      complexityScore >= 40 ? 'Intermediate' :
      'Beginner'
  };
};

// 12. MASTER ANALYSIS FUNCTION
export const analyzeText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  const analysis = {
    rhymes: detectPhoneticRhymes(lines),
    alliteration: detectSoundAlliteration(lines),
    assonance: detectAssonance(lines),
    consonance: detectConsonance(lines),
    homophones: detectHomophones(lines),
    wordplay: detectWordplay(lines),
    metaphorsSimiles: detectMetaphorsSimiles(lines),
    repetition: detectRepetition(lines),
    references: detectReferences(lines),
    syllablePatterns: analyzeSyllablePatterns(lines),
    flowComplexity: calculateFlowComplexity(text)
  };
  
  // Generate color map for visualization
  const colorMap = generateColorMap(analysis.rhymes);
  
  return {
    analysis,
    colorMap,
    statistics: generateStatistics(analysis, text)
  };
};

// Helper function to generate color map for rhyme highlighting
export const generateColorMap = (rhymes) => {
  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
    '#EF4444', '#06B6D4', '#EC4899', '#14B8A6',
    '#F97316', '#84CC16', '#6366F1', '#FB923C'
  ];
  
  const colorMap = new Map();
  let colorIndex = 0;
  
  // Assign colors to perfect rhyme groups
  rhymes.perfect.forEach(group => {
    const color = colors[colorIndex % colors.length];
    group.words.forEach(word => {
      colorMap.set(word.toLowerCase(), {
        color,
        type: 'perfect',
        opacity: 0.4
      });
    });
    colorIndex++;
  });
  
  // Add slant rhymes with reduced opacity
  rhymes.slant.forEach(pair => {
    pair.words.forEach(word => {
      if (!colorMap.has(word.toLowerCase())) {
        colorMap.set(word.toLowerCase(), {
          color: colors[colorIndex % colors.length],
          type: 'slant',
          opacity: 0.25
        });
      }
    });
    colorIndex++;
  });
  
  return colorMap;
};

// Generate comprehensive statistics
export const generateStatistics = (analysis, text) => {
  const words = text.split(/\s+/).filter(w => w);
  const lines = text.split('\n').filter(l => l.trim());
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
  
  return {
    totalWords: words.length,
    totalLines: lines.length,
    uniqueWords: uniqueWords.size,
    vocabularyDiversity: Math.round((uniqueWords.size / words.length) * 100),
    
    rhymes: {
      perfect: analysis.rhymes.perfect.length,
      slant: analysis.rhymes.slant.length,
      internal: analysis.rhymes.internal.length,
      density: Math.round((analysis.rhymes.perfect.length * 2 / lines.length) * 100)
    },
    
    devices: {
      alliteration: analysis.alliteration.length,
      assonance: analysis.assonance.length,
      consonance: analysis.consonance.length,
      homophones: analysis.homophones.length,
      wordplay: analysis.wordplay.length,
      metaphors: analysis.metaphorsSimiles.length
    },
    
    flow: {
      complexity: analysis.flowComplexity.score,
      level: analysis.flowComplexity.level,
      avgSyllablesPerLine: Math.round(
        analysis.syllablePatterns.reduce((sum, p) => sum + p.syllableCount, 0) / lines.length
      )
    }
  };
};

// Export all functions as a module
export default {
  // Core functions
  getPhonetic,
  doubleMetaphone,
  getPhoneticEnding,
  
  // Detection functions
  detectPhoneticRhymes,
  detectSoundAlliteration,
  detectAssonance,
  detectConsonance,
  detectHomophones,
  detectWordplay,
  detectMetaphorsSimiles,
  detectRepetition,
  detectReferences,
  analyzeSyllablePatterns,
  calculateFlowComplexity,
  
  // Master analysis
  analyzeText,
  generateColorMap,
  generateStatistics,
  
  // Constants
  VOWEL_SOUNDS,
  CONSONANT_CLUSTERS,
  CMU_DICTIONARY
};