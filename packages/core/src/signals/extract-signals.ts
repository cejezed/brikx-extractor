import type { RawDocument } from '../parsers/raw-document.js';
import type { ClientSignal, ClientSignalType } from '../types/customer-example.js';

type SignalPattern = {
  keywords: RegExp[];
  type: ClientSignalType;
  baseIntensity: 0 | 0.25 | 0.5 | 0.75 | 1;
  followupPrompt?: string;
};

const SIGNAL_PATTERNS: SignalPattern[] = [
  // Uncertainty / Hesitation
  {
    keywords: [/twijfel/i, /onzeker/i, /niet zeker/i, /misschien/i, /wellicht/i],
    type: 'uncertainty',
    baseIntensity: 0.5,
    followupPrompt: 'Waar twijfel je precies over? Ik help je graag om hier duidelijkheid in te krijgen.',
  },
  {
    keywords: [/weet niet/i, /geen idee/i, /durf niet/i],
    type: 'hesitation',
    baseIntensity: 0.75,
    followupPrompt: 'Wat houdt je tegen? Laten we samen kijken hoe we dit kunnen aanpakken.',
  },

  // Concern
  {
    keywords: [/zorgen/i, /bezorgd/i, /bang/i, /stress/i, /risico/i],
    type: 'concern',
    baseIntensity: 0.75,
    followupPrompt: 'Ik begrijp je zorgen. Kunnen we hier samen naar kijken?',
  },
  {
    keywords: [/probleem/i, /moeilijk/i, /lastig/i],
    type: 'concern',
    baseIntensity: 0.5,
    followupPrompt: 'Wat maakt dit voor jou lastig? Laten we kijken naar oplossingen.',
  },

  // Enthusiasm
  {
    keywords: [/enthousiast/i, /blij/i, /geweldig/i, /fantastisch/i, /super/i, /top/i],
    type: 'enthusiasm',
    baseIntensity: 0.75,
    followupPrompt: 'Wat fijn om je enthousiasme te horen! Waar kijk je het meest naar uit?',
  },
  {
    keywords: [/mega enthousiast/i, /superblij/i, /heel blij/i, /erg blij/i],
    type: 'enthusiasm',
    baseIntensity: 1,
    followupPrompt: 'Geweldig om te horen! Vertel me meer over je plannen.',
  },

  // Urgency
  {
    keywords: [/snel/i, /spoedig/i, /haast/i, /urgent/i, /zo snel mogelijk/i],
    type: 'urgency',
    baseIntensity: 0.75,
    followupPrompt: 'Ik begrijp dat timing belangrijk is. Wat is je ideale tijdlijn?',
  },
  {
    keywords: [/direct/i, /meteen/i, /asap/i, /nu/i],
    type: 'urgency',
    baseIntensity: 1,
    followupPrompt: 'We begrijpen de urgentie. Laten we kijken wat mogelijk is.',
  },

  // General emotion
  {
    keywords: [/gevoel/i, /emotie/i, /frustratie/i, /verdrietig/i],
    type: 'emotion',
    baseIntensity: 0.5,
  },
];

/**
 * Extracts emotional signals from the document text
 */
export function extractSignals(doc: RawDocument): ClientSignal[] {
  const signals: ClientSignal[] = [];
  const text = doc.text;

  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  for (const sentence of sentences) {
    for (const pattern of SIGNAL_PATTERNS) {
      for (const keyword of pattern.keywords) {
        if (keyword.test(sentence)) {
          // Check for intensity modifiers
          const intensity = calculateIntensity(sentence, pattern.baseIntensity);

          const signal: ClientSignal = {
            type: pattern.type,
            intensity,
            quote: sentence.trim(),
            interpretedIntent: generateIntent(pattern.type, sentence),
            followupPrompt: pattern.followupPrompt,
          };

          signals.push(signal);
          break; // Only match once per pattern per sentence
        }
      }
    }
  }

  return signals;
}

/**
 * Calculate intensity based on modifiers in the sentence
 */
function calculateIntensity(
  sentence: string,
  baseIntensity: 0 | 0.25 | 0.5 | 0.75 | 1
): 0 | 0.25 | 0.5 | 0.75 | 1 {
  const lowerSentence = sentence.toLowerCase();

  // Amplifiers
  if (/(heel|erg|zeer|enorm|mega|super)\s/i.test(lowerSentence)) {
    return Math.min(1, baseIntensity + 0.25) as 0 | 0.25 | 0.5 | 0.75 | 1;
  }

  // Reducers
  if (/(een beetje|iets|licht|enigszins)\s/i.test(lowerSentence)) {
    return Math.max(0, baseIntensity - 0.25) as 0 | 0.25 | 0.5 | 0.75 | 1;
  }

  return baseIntensity;
}

/**
 * Generate a human-readable interpretation of the signal
 */
function generateIntent(type: ClientSignalType, sentence: string): string {
  const intents: Record<ClientSignalType, string> = {
    uncertainty: 'De klant lijkt onzeker over bepaalde aspecten van het project',
    hesitation: 'De klant aarzelt en heeft mogelijk meer informatie of geruststelling nodig',
    concern: 'De klant maakt zich zorgen over dit onderdeel',
    enthusiasm: 'De klant toont enthousiasme en positieve energie',
    urgency: 'De klant heeft haast of vindt snelheid belangrijk',
    emotion: 'De klant uit emotie over dit onderwerp',
  };

  return intents[type] || 'Emotioneel signaal gedetecteerd';
}
