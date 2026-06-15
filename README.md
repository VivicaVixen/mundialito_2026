# Mundialito 2026 ⚽🏆

Quiniela del Mundial 2026 para jugar con amigos: predice marcadores, súmate al
ranking ("La Tribuna") y compite por el premio. Web app pensada para usarse
desde el celular.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS (SPA estática, sin backend).
- **Datos:** Firebase Auth (usuario + PIN) y Cloud Firestore.
- **Partidos:** se importan manualmente desde la app con el botón
  **"Actualizar partidos"** (visible solo para el usuario admin). Descarga el
  calendario y resultados del Mundial 2026 desde una fuente pública de GitHub y
  los escribe en Firestore. Las reglas de seguridad solo permiten esa escritura
  al admin definido en `src/config.ts`.

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

Ninguna. Ver [.env.example](.env.example).

## Despliegue

Push a GitHub → importar el repo en Vercel (framework Vite, ya configurado en
`vercel.json`) → Deploy. No hay variables de entorno que configurar.

Requisitos en Firebase: tener activado el proveedor **Correo electrónico/
contraseña** en Authentication, la base de datos Firestore creada, y las reglas
de `firestore.rules` publicadas. Para cambiar el admin, edita `ADMIN_USERNAME`
en `src/config.ts` y el correo en `firestore.rules`.
