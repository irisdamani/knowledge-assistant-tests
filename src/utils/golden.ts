import * as path from 'path';
import * as fs from 'fs';
import { GoldenQuestion, GoldenTag } from './assertions';

const GOLDEN_PATH = path.resolve(__dirname, 'testData', 'golden_questions.json');

let _cache: GoldenQuestion[] | null = null;

export function loadGoldenQuestions(): GoldenQuestion[] {
  if (!_cache) {
    const raw = fs.readFileSync(GOLDEN_PATH, 'utf-8');
    _cache = JSON.parse(raw) as GoldenQuestion[];
  }
  return _cache;
}

export function goldenByTag(tag: GoldenTag): GoldenQuestion[] {
  return loadGoldenQuestions().filter((q) => q.tags.includes(tag));
}

export function goldenWhere(predicate: (q: GoldenQuestion) => boolean): GoldenQuestion[] {
  return loadGoldenQuestions().filter(predicate);
}
