// packages/core/src/types/brikx.ts

export type ChapterKey = 'basis' | 'ruimtes' | 'wensen' | 'budget' | 'techniek' | 'duurzaam' | 'risico';

export type PatchDelta = {
  path: string;
  operation: 'set' | 'append' | 'remove';
  value?: any;
};

export type PatchEvent = {
  chapter: ChapterKey;
  delta: PatchDelta;
};
