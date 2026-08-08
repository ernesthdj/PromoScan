import { formatRelativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface RelativeTimeProps {
  iso: string;
  className?: string;
}

/** Horodatage relatif ("il y a 2 h") avec `title` = date ISO complète au survol (reconnaissance
 * > rappel, UI-DESIGN §3.1). */
export function RelativeTime({ iso, className }: RelativeTimeProps) {
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString('fr-BE')} className={cn(className)}>
      {formatRelativeTime(iso)}
    </time>
  );
}
