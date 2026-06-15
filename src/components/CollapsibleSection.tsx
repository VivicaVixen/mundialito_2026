import { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface CollapsibleSectionProps {
  title: string;
  /** Número que se muestra en una pastilla junto al título. */
  count?: number;
  /** Si arranca abierta (sólo aplica cuando no está fijada). */
  defaultOpen?: boolean;
  /** Si está fijada: siempre abierta, sin chevron ni toggle (p.ej. "en vivo"). */
  pinned?: boolean;
  children: ReactNode;
}

/**
 * Sección con encabezado tipo pastilla centrada que se expande/colapsa al tocar.
 * Reutilizada en Partidos y La Tribuna para que sólo se vean los títulos por defecto.
 */
export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  pinned = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = pinned || open;

  return (
    <section className="space-y-4">
      <div className="flex justify-center">
        <motion.button
          type="button"
          whileTap={pinned ? undefined : { scale: 0.96 }}
          onClick={pinned ? undefined : () => setOpen((o) => !o)}
          aria-expanded={isOpen}
          className={`flex items-center gap-2 text-base md:text-lg font-black uppercase tracking-wider text-[#003893] bg-blue-50 border border-blue-100 px-5 py-2 rounded-full shadow-sm ${
            pinned ? 'cursor-default' : 'cursor-pointer hover:bg-blue-100/70 transition-colors'
          }`}
        >
          <span>{title}</span>
          {count != null && (
            <span className="text-xs font-bold bg-[#003893] text-white rounded-full px-2 py-0.5 min-w-[1.5rem] text-center tabular-nums">
              {count}
            </span>
          )}
          {!pinned && (
            <motion.svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-[#003893]"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* padding para que la sombra de las tarjetas no se recorte */}
            <div className="p-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
