/**
 * ScoreIndicator — Pastille coloree avec score numerique.
 * Vert > 70, Jaune 40-70, Rouge < 40.
 */

import clsx from 'clsx';
import { SCORE_THRESHOLDS } from '../../utils/constants';

interface ScoreIndicatorProps {
  score: number;
  maxScore?: number;
  className?: string;
}

function getScoreColor(score: number): { bg: string; text: string; dot: string } {
  if (score >= SCORE_THRESHOLDS.high) {
    return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
  }
  if (score >= SCORE_THRESHOLDS.medium) {
    return { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' };
  }
  return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
}

export function ScoreIndicator({ score, className }: ScoreIndicatorProps) {
  const colors = getScoreColor(score);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-sm font-semibold',
        colors.bg,
        colors.text,
        className,
      )}
      aria-label={`Score ${Math.round(score)}`}
    >
      <span className={clsx('w-2 h-2 rounded-full', colors.dot)} aria-hidden="true" />
      {Math.round(score)}
    </span>
  );
}
