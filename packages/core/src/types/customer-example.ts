// packages/core/src/types/customer-example.ts

export type ClientSignalType =
  | 'emotion'
  | 'hesitation'
  | 'enthusiasm'
  | 'concern'
  | 'urgency'
  | 'uncertainty';

export type ClientSignal = {
  type: ClientSignalType;
  intensity: 0 | 0.25 | 0.5 | 0.75 | 1;
  quote: string;              // originele klantzin of fragment
  interpretedIntent?: string; // AI-inschatting in gewone taal
  followupPrompt?: string;    // automatische vervolgvraag voor Jules
};

export type CustomerCoreData = {
  projectType?: string;   // bv. 'nieuwbouw', 'verbouwing' ...
  budget?: number;        // ruwe schatting in euro's
  locatie?: string;
};

export type CustomerExample = {
  coreData: CustomerCoreData;
  wishes: string[];
  emotionalSignals: ClientSignal[];
};
