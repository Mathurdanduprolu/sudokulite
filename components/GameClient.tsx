'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Difficulty } from '@/lib/sudoku6';

type Screen = 'landing' | 'game';

interface PuzzlePayload {
  id: string;
  date: string;
  difficulty: Difficulty;
  puzzle: number[][];
  solution: number[][];
  givens: number;
}

const size = 6;

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function GameClient() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [puzzle, setPuzzle] = useState<PuzzlePayload | null>(null);
  const [grid, setGrid] = useState<number[][]>([]);
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (screen !== 'game' || paused || completed || !puzzle) return;
    const timer = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [screen, paused, completed, puzzle]);

  const fetchPuzzle = useCallback(async (level: Difficulty, date = todayDateString()) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/daily?difficulty=${level}&date=${date}`);
      if (!response.ok) throw new Error('Could not load puzzle from server.');
      const data: PuzzlePayload = await response.json();
      setPuzzle(data);
      setGrid(data.puzzle);
      setInitialGrid(cloneGrid(data.puzzle));
      setSelected(null);
      setMistakes(0);
      setHintsUsed(0);
      setElapsed(0);
      setPaused(false);
      setCompleted(false);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error.');
    } finally {
      setLoading(false);
    }
  }, []);

  const completionCount = useMemo(
    () => grid.flat().filter((cell) => cell !== 0).length,
    [grid]
  );

  const progress = puzzle ? Math.round((completionCount / 36) * 100) : 0;

  const score = useMemo(() => {
    if (!completed) return 0;
    const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.35 : 1.7;
    const timePenalty = Math.floor(elapsed / 5);
    const hintPenalty = hintsUsed * 30;
    const mistakePenalty = mistakes * 40;
    return Math.max(300, Math.floor(1200 * difficultyMultiplier - timePenalty - hintPenalty - mistakePenalty));
  }, [completed, difficulty, elapsed, hintsUsed, mistakes]);

  const applyMove = useCallback(
    (row: number, col: number, value: number) => {
      if (!puzzle || paused || completed) return;
      if (initialGrid[row][col] !== 0) return;

      const expected = puzzle.solution[row][col];
      if (value !== 0 && value !== expected) {
        setMistakes((current) => current + 1);
      }

      setGrid((current) => {
        const next = cloneGrid(current);
        next[row][col] = value;

        const solved = next.every((line, r) => line.every((cell, c) => cell === puzzle.solution[r][c]));
        if (solved) {
          setCompleted(true);
          setPaused(false);
        }

        return next;
      });
    },
    [puzzle, paused, completed, initialGrid]
  );

  const giveHint = useCallback(() => {
    if (!puzzle || completed || paused) return;
    const empties: [number, number][] = [];
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] !== puzzle.solution[r][c]) empties.push([r, c]);
      }
    }
    if (!empties.length) return;

    const [row, col] = empties[Math.floor(Math.random() * empties.length)];
    applyMove(row, col, puzzle.solution[row][col]);
    setHintsUsed((current) => current + 1);
    setSelected([row, col]);
  }, [puzzle, completed, paused, grid, applyMove]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (screen !== 'game' || !selected || paused || completed) return;
      if (/^[1-6]$/.test(event.key)) {
        applyMove(selected[0], selected[1], Number(event.key));
      }
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
        applyMove(selected[0], selected[1], 0);
      }
      if (event.key === 'ArrowUp') setSelected(([r, c]) => [Math.max(0, r - 1), c]);
      if (event.key === 'ArrowDown') setSelected(([r, c]) => [Math.min(5, r + 1), c]);
      if (event.key === 'ArrowLeft') setSelected(([r, c]) => [r, Math.max(0, c - 1)]);
      if (event.key === 'ArrowRight') setSelected(([r, c]) => [r, Math.min(5, c + 1)]);
      if (event.key.toLowerCase() === 'h') giveHint();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, selected, applyMove, paused, completed, giveHint]);

  const startGame = async () => {
    await fetchPuzzle(difficulty);
    setScreen('game');
  };

  const newGame = async () => {
    await fetchPuzzle(difficulty);
  };

  const dailySeedDate = todayDateString();

  return (
    <main className="app-shell">
      <div className="glow one" />
      <div className="glow two" />
      <section className="game-panel">
        {screen === 'landing' && (
          <div className="landing">
            <p className="badge">Daily Challenge • 6 Number Logic</p>
            <h1>SudokuLite 6</h1>
            <p className="lead">
              Fill the 6×6 grid with numbers 1–6. Every row, column, and 2×3 zone must contain each
              number exactly once.
            </p>
            <div className="difficulty">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  className={difficulty === level ? 'chip active' : 'chip'}
                  onClick={() => setDifficulty(level)}
                >
                  {level}
                </button>
              ))}
            </div>
            <button className="play-btn" onClick={startGame}>
              Play Daily Puzzle
            </button>
            <small>Seed date: {dailySeedDate}</small>
          </div>
        )}

        {screen === 'game' && (
          <>
            <header className="status-bar">
              <div>
                <span>Difficulty</span>
                <strong>{difficulty}</strong>
              </div>
              <div>
                <span>Time</span>
                <strong>{formatSeconds(elapsed)}</strong>
              </div>
              <div>
                <span>Mistakes</span>
                <strong>{mistakes}</strong>
              </div>
              <div>
                <span>Progress</span>
                <strong>{progress}%</strong>
              </div>
            </header>

            <div className="controls-row">
              <button className="control" onClick={() => setPaused((v) => !v)}>
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button className="control" onClick={giveHint}>
                Hint ({hintsUsed})
              </button>
              <button className="control" onClick={() => setGrid(cloneGrid(initialGrid))}>
                Reset
              </button>
              <button className="control primary" onClick={newGame}>
                New Game
              </button>
            </div>

            {error && <div className="error">{error}</div>}
            {loading && <div className="loading">Loading puzzle…</div>}

            {!loading && puzzle && (
              <>
                <div className={paused ? 'grid-wrapper paused' : 'grid-wrapper'}>
                  {grid.map((row, r) => (
                    <div className="grid-row" key={`row-${r}`}>
                      {row.map((value, c) => {
                        const locked = initialGrid[r][c] !== 0;
                        const isSelected = selected?.[0] === r && selected?.[1] === c;
                        const isRelated = selected
                          ? selected[0] === r ||
                            selected[1] === c ||
                            (Math.floor(selected[0] / 2) === Math.floor(r / 2) &&
                              Math.floor(selected[1] / 3) === Math.floor(c / 3))
                          : false;
                        const wrong = value !== 0 && value !== puzzle.solution[r][c];
                        return (
                          <button
                            key={`${r}-${c}`}
                            className={`cell ${locked ? 'locked' : ''} ${isSelected ? 'selected' : ''} ${
                              isRelated ? 'related' : ''
                            } ${wrong ? 'wrong' : ''}`}
                            onClick={() => setSelected([r, c])}
                            disabled={paused}
                            aria-label={`row ${r + 1} column ${c + 1}`}
                          >
                            {value || ''}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="num-pad">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => selected && applyMove(selected[0], selected[1], n)}
                      className="num"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => selected && applyMove(selected[0], selected[1], 0)}
                    className="num erase"
                  >
                    ⌫
                  </button>
                </div>
              </>
            )}

            {completed && (
              <div className="victory">
                <h2>Puzzle Cleared ✨</h2>
                <p>
                  You completed {puzzle?.difficulty} mode in {formatSeconds(elapsed)} with {mistakes}{' '}
                  mistake(s).
                </p>
                <p className="score">Score: {score}</p>
                <button className="play-btn" onClick={newGame}>
                  Play Another
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
