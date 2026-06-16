// Usuario con permisos de administrador: el único que puede importar/actualizar
// los partidos desde la app. Debe coincidir (en minúsculas) con el correo
// ficticio permitido en firestore.rules: `${ADMIN_USERNAME}@quiniela.app`.
export const ADMIN_USERNAME = 'vivica';

// --- Premiación ---
// Montos del podio (en COP). Se muestran en el banner, en Reglas y en el aviso.
export const PRIZES = { first: '100.000', second: '50.000', third: '30.000' };

// Patrocinadores de la premiación e idea del premio de consolación.
export const SPONSORS = ['Vivica', 'Edwin', 'Piojet'];
export const IDEA_BY = 'Juan';

// Premio de consolación (medalla) para el último lugar. Se otorga al de MENOR
// puntaje, pero solo entre quienes superen el piso (mitad del promedio del
// grupo); así se evita "perder a propósito".
export const WOODEN_SPOON_FLOOR_RATIO = 0.5;
export const MEDAL_IMG = '/medalla-consolacion.jpeg';

// Aviso de novedades: se muestra una vez por persona mientras este id no
// coincida con el guardado en localStorage. Cambiarlo => se vuelve a mostrar.
export const CHANGELOG_ID = 'update-2026-06-16-premios';
