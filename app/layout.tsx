import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SudokuLite 6 — Daily Pulse Puzzle',
  description: 'A premium 6-number daily Sudoku-inspired puzzle game.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
