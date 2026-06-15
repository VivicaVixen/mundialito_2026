import { useEffect } from 'react';

/**
 * Detecta un despliegue nuevo (comparando /version.json con el id del build
 * actual) y recarga la página para tomar el código nuevo. Mantiene la sesión.
 * Revisa al montar, al volver a la pestaña y cada `intervalMs`.
 */
export function useAutoReload(intervalMs = 3 * 60 * 1000) {
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.version && data.version !== __BUILD_ID__) {
          window.location.reload();
        }
      } catch {
        // Sin conexión, o sin version.json (entorno de desarrollo): ignorar.
      }
    };

    check();
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    const id = window.setInterval(check, intervalMs);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(id);
    };
  }, [intervalMs]);
}
