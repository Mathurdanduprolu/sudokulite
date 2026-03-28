export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PuzzlePayload {
  id: string;
  date: string;
  difficulty: Difficulty;
  puzzle: number[][];
  solution: number[][];
  givens: number;
}

const SIZE = 6;
const BOX_ROWS = 2;
const BOX_COLS = 3;

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function isValid(grid: number[][], row: number, col: number, value: number): boolean {
  for (let i = 0; i < SIZE; i += 1) {
    if (grid[row][i] === value || grid[i][col] === value) return false;
  }

  const boxStartRow = Math.floor(row / BOX_ROWS) * BOX_ROWS;
  const boxStartCol = Math.floor(col / BOX_COLS) * BOX_COLS;

  for (let r = boxStartRow; r < boxStartRow + BOX_ROWS; r += 1) {
    for (let c = boxStartCol; c < boxStartCol + BOX_COLS; c += 1) {
      if (grid[r][c] === value) return false;
    }
  }
  return true;
}

function fillGrid(grid: number[][], rand: () => number): boolean {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (grid[row][col] === 0) {
        const candidates = shuffle([1, 2, 3, 4, 5, 6], rand);
        for (const value of candidates) {
          if (!isValid(grid, row, col, value)) continue;
          grid[row][col] = value;
          if (fillGrid(grid, rand)) return true;
          grid[row][col] = 0;
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(grid: number[][], limit = 2): number {
  let solutions = 0;

  function solve(): void {
    if (solutions >= limit) return;
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (grid[row][col] === 0) {
          for (let value = 1; value <= SIZE; value += 1) {
            if (!isValid(grid, row, col, value)) continue;
            grid[row][col] = value;
            solve();
            grid[row][col] = 0;
          }
          return;
        }
      }
    }
    solutions += 1;
  }

  solve();
  return solutions;
}

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

const givensByDifficulty: Record<Difficulty, number> = {
  easy: 24,
  medium: 20,
  hard: 16
};

function carvePuzzle(solution: number[][], difficulty: Difficulty, rand: () => number): number[][] {
  const targetGivens = givensByDifficulty[difficulty];
  const puzzle = cloneGrid(solution);

  const positions: [number, number][] = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      positions.push([r, c]);
    }
  }

  const shuffled = shuffle(positions, rand);
  let currentGivens = SIZE * SIZE;

  for (const [row, col] of shuffled) {
    if (currentGivens <= targetGivens) break;
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    const probe = cloneGrid(puzzle);
    const solutions = countSolutions(probe, 2);
    if (solutions !== 1) {
      puzzle[row][col] = backup;
    } else {
      currentGivens -= 1;
    }
  }

  return puzzle;
}

export function generatePuzzle(date: string, difficulty: Difficulty, seedSalt = 'sudokulite'): PuzzlePayload {
  const seedInput = `${date}:${difficulty}:${seedSalt}`;
  const seed = hashString(seedInput);
  const rand = mulberry32(seed);

  const solution = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
  fillGrid(solution, rand);
  const puzzle = carvePuzzle(solution, difficulty, rand);

  return {
    id: `${date}-${difficulty}`,
    date,
    difficulty,
    puzzle,
    solution,
    givens: puzzle.flat().filter((cell) => cell !== 0).length
  };
}

export function validateMove(
  grid: number[][],
  row: number,
  col: number,
  value: number
): { valid: boolean; reason?: string } {
  if (value < 1 || value > 6) return { valid: false, reason: 'Value must be between 1 and 6.' };

  for (let i = 0; i < SIZE; i += 1) {
    if (i !== col && grid[row][i] === value) return { valid: false, reason: 'Duplicate in row.' };
    if (i !== row && grid[i][col] === value) return { valid: false, reason: 'Duplicate in column.' };
  }

  const startRow = Math.floor(row / BOX_ROWS) * BOX_ROWS;
  const startCol = Math.floor(col / BOX_COLS) * BOX_COLS;
  for (let r = startRow; r < startRow + BOX_ROWS; r += 1) {
    for (let c = startCol; c < startCol + BOX_COLS; c += 1) {
      if ((r !== row || c !== col) && grid[r][c] === value) {
        return { valid: false, reason: 'Duplicate in box.' };
      }
    }
  }

  return { valid: true };
}
