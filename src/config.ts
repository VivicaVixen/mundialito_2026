// Usuario con permisos de administrador: el único que puede importar/actualizar
// los partidos desde la app. Debe coincidir (en minúsculas) con el correo
// ficticio permitido en firestore.rules: `${ADMIN_USERNAME}@quiniela.app`.
export const ADMIN_USERNAME = 'vivica';
