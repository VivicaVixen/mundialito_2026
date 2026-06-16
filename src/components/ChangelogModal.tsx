import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CHANGELOG_ID, PRIZES, SPONSORS, IDEA_BY } from '../config';

const STORAGE_KEY = 'mundialito_changelog';

/**
 * Aviso de novedades que se muestra UNA vez por persona para este update.
 * Si en el futuro hay otro update, basta con cambiar CHANGELOG_ID en config.ts
 * y el aviso volverá a aparecer (con su nuevo contenido).
 */
export function ChangelogModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== CHANGELOG_ID) setOpen(true);
    } catch {
      /* localStorage no disponible: simplemente no mostramos el aviso */
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_ID);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const sponsors =
    SPONSORS.length > 1
      ? `${SPONSORS.slice(0, -1).join(', ')} y ${SPONSORS[SPONSORS.length - 1]}`
      : SPONSORS[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="bg-[#FCD116] text-[#003893] text-center py-4 px-5">
              <div className="text-3xl">🎉</div>
              <h2 className="font-black text-xl tracking-tight mt-1">¡Novedades!</h2>
              <p className="text-xs font-semibold opacity-80">Se amplió la premiación</p>
            </div>

            {/* Contenido */}
            <div className="p-5 flex flex-col gap-4 text-sm text-slate-700">
              <div className="flex gap-3">
                <span className="text-xl shrink-0">🏆</span>
                <p>
                  Ahora premiamos al <strong>podio</strong>: 🥇 {PRIZES.first} · 🥈 {PRIZES.second} ·
                  🥉 {PRIZES.third} <strong>COP</strong>.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-xl shrink-0">🙌</span>
                <p>
                  Gracias a <strong>{sponsors}</strong> por patrocinar la premiación
                  <span className="text-slate-500"> (idea de {IDEA_BY} 💡)</span>.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-xl shrink-0">🥄</span>
                <p>
                  Nueva <strong>medalla de consolación</strong> para el último lugar. Ojo: se la
                  lleva el de menor puntaje <strong>solo</strong> entre quienes jueguen en serio
                  (al menos la mitad del promedio del grupo). ¡Nada de perder a propósito!
                </p>
              </div>
              <p className="text-xs text-slate-400 text-center">Mira los detalles en la pestaña Reglas.</p>
            </div>

            {/* Botón */}
            <div className="px-5 pb-5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={close}
                className="w-full bg-[#003893] text-white font-bold py-3 rounded-xl"
              >
                ¡Entendido!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
