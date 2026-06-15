# Mundialito 2026 ⚽🏆

Quiniela del Mundial 2026 para jugar con amigos: predice marcadores, súmate al
ranking ("La Tribuna") y compite por el premio. Web app pensada para usarse
desde el celular.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS (SPA estática).
- **Datos:** Firebase Auth (usuario + PIN) y Cloud Firestore.
- **Partidos:** el botón **"Actualizar partidos"** (visible solo para el admin)
  llama a la función serverless `api/sync-matches.ts`, que consulta la API del
  Mundial 2026 (RapidAPI, clave en `RAPIDAPI_KEY`) y devuelve calendario +
  resultados; el cliente admin los escribe en Firestore. Las reglas solo
  permiten esa escritura al admin definido en `src/config.ts`. Además, cada
  tarjeta tiene un panel de admin para **ingresar/editar resultados a mano**
  (complemento del sync automático).

## Estructura

- `src/` — app de React (páginas: Partidos, La Tribuna, Reglas).
- `src/lib/importMatches.ts` — importación de partidos (admin).
- `src/config.ts` — define el usuario admin (`ADMIN_USERNAME`).
- `firestore.rules` — reglas de seguridad de Firestore.
- `firebase-applet-config.json` — config pública del proyecto Firebase web.

## Desarrollo local

Requisitos: Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:5173
```

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `RAPIDAPI_KEY` | Clave de la API del Mundial 2026 (RapidAPI) usada por `api/sync-matches`. |

Ver [.env.example](.env.example). El login y la base de datos no requieren
variables.

## Despliegue

Push a GitHub → importar el repo en Vercel (framework Vite, ya configurado en
`vercel.json`) → agregar la variable `RAPIDAPI_KEY` → Deploy.

Requisitos en Firebase: tener activado el proveedor **Correo electrónico/
contraseña** en Authentication, la base de datos Firestore creada, y las reglas
de `firestore.rules` publicadas. Para cambiar el admin, edita `ADMIN_USERNAME`
en `src/config.ts` y el correo en `firestore.rules`.
