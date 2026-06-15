# Mundialito 2026 ⚽🏆

Quiniela del Mundial 2026 para jugar con amigos: predice marcadores, súmate al
ranking ("La Tribuna") y compite por el premio. Web app pensada para usarse
desde el celular.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS (SPA estática).
- **Backend:** Firebase Auth (usuario + PIN) y Cloud Firestore.
- **Sync de partidos:** función serverless en `api/cron.ts` (Vercel Cron) que
  importa el calendario y resultados del Mundial 2026 desde una fuente pública
  de GitHub y los guarda en Firestore con el Admin SDK.

## Estructura

- `src/` — app de React (páginas: Partidos, La Tribuna, Reglas).
- `api/cron.ts` — sincronización de partidos (Vercel Cron / endpoint manual).
- `firestore.rules` — reglas de seguridad de Firestore.
- `firebase-applet-config.json` — config pública del proyecto Firebase web.

## Desarrollo local

Requisitos: Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:5173
```

> El sync de partidos (`/api/cron`) solo corre en Vercel; en local la lista de
> partidos se llena una vez que el cron se ejecuta en el entorno desplegado.

## Variables de entorno

Ver [.env.example](.env.example). Se configuran en Vercel:

| Variable | Para qué |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Cuenta de servicio (Admin SDK) usada por el cron |
| `FIREBASE_CLIENT_EMAIL` | Cuenta de servicio (Admin SDK) |
| `FIREBASE_PRIVATE_KEY` | Cuenta de servicio (Admin SDK) |
| `CRON_SECRET` | Protege el endpoint `/api/cron` (recomendado) |

## Despliegue

Push a GitHub → importar el repo en Vercel (framework Vite, ya configurado en
`vercel.json`) → definir las variables de entorno → deploy. Las reglas de
`firestore.rules` deben estar publicadas en la base de datos de Firestore del
proyecto, y el proveedor **Correo electrónico/contraseña** debe estar activado
en Firebase Authentication.
