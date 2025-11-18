import OpenAI from 'openai';
import type { CustomerExample } from '../types/customer-example.js';

/**
 * AI-powered extraction using OpenAI GPT-4
 */
export async function extractWithOpenAI(text: string): Promise<CustomerExample> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `Je bent een expert in het analyseren van Programma van Eisen (PvE) documenten voor woningbouw.

Jouw taak is om de volgende informatie te extraheren:

1. **Core Data** (coreData):
   - projectType: Type project (nieuwbouw, verbouwing, renovatie, aanbouw, etc.)
   - budget: Budget in euro's (alleen het getal, geen valuta symbool)
   - locatie: Locatie/plaats van het project

2. **Wensen** (wishes):
   - Lijst van alle wensen/eisen die de klant heeft
   - Elke wens is een aparte string
   - Neem ALLE wensen op, ook kleine details
   - Behoud de originele formulering zoveel mogelijk
   - Voorbeelden: "speelse woonkamer aan de waterkant", "keuken afsluitbaar met 2 deuren", "4 slaapkamers op eerste verdieping"

3. **Emotionele Signalen** (emotionalSignals):
   - Detecteer zorgen, twijfels, enthousiasme, urgentie, etc.
   - Voor elk signaal geef je:
     - type: 'concern' | 'enthusiasm' | 'uncertainty' | 'hesitation' | 'urgency' | 'emotion'
     - intensity: 0 (zeer laag), 0.25 (laag), 0.5 (gemiddeld), 0.75 (hoog), of 1 (zeer hoog)
     - quote: Het exacte citaat uit de tekst
     - interpretedIntent: Wat bedoelt de klant waarschijnlijk?
     - followupPrompt: Aanbevolen vervolgvraag om te stellen

BELANGRIJK:
- Extraheer ALLE wensen, ook als het er veel zijn
- Behoud de exacte formulering van de klant in quotes
- Wees volledig en grondig
- Als iets niet duidelijk is, meld dat in de emotionele signalen als 'uncertainty'

Return ALLEEN een JSON object met deze structuur (geen markdown, geen extra tekst):
{
  "coreData": {
    "projectType": "string of undefined",
    "budget": number of undefined,
    "locatie": "string of undefined"
  },
  "wishes": ["string", "string", ...],
  "emotionalSignals": [
    {
      "type": "concern" | "enthusiasm" | "uncertainty" | "hesitation" | "urgency" | "emotion",
      "intensity": 0 | 0.25 | 0.5 | 0.75 | 1,
      "quote": "exact citaat",
      "interpretedIntent": "interpretatie",
      "followupPrompt": "vervolgvraag"
    }
  ]
}`;

  try {
    console.log('[OpenAI] Starting extraction...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyseer dit PvE document:\n\n${text}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('[OpenAI] Extraction complete');

    const result = JSON.parse(responseText);

    // Ensure the structure matches CustomerExample
    return {
      coreData: result.coreData || {},
      wishes: result.wishes || [],
      emotionalSignals: result.emotionalSignals || [],
    };
  } catch (error) {
    console.error('[OpenAI] Extraction failed:', error);
    throw error;
  }
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
