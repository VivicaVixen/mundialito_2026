import { flagUrl } from '../lib/teamFlags';

/** Bandera del equipo (flagcdn). No renderiza nada si el equipo no se reconoce
 * (p.ej. placeholders de eliminatorias). `className` controla el tamaño. */
export function TeamFlag({ team, className = 'w-5 h-[14px]' }: { team: string; className?: string }) {
  const url = flagUrl(team);
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`inline-block rounded-[2px] object-cover shrink-0 ring-1 ring-black/5 ${className}`}
    />
  );
}
