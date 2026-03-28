import { NextRequest, NextResponse } from 'next/server';
import { Difficulty, generatePuzzle } from '@/lib/sudoku6';

const difficultySet = new Set<Difficulty>(['easy', 'medium', 'hard']);

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawDifficulty = searchParams.get('difficulty') ?? 'medium';
  const rawDate = searchParams.get('date');

  const difficulty = difficultySet.has(rawDifficulty as Difficulty)
    ? (rawDifficulty as Difficulty)
    : 'medium';

  const isoDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10);

  const salt = process.env.DAILY_SEED_SALT ?? 'sudokulite';
  const puzzle = generatePuzzle(isoDate, difficulty, salt);

  return NextResponse.json(puzzle);
}
