import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Proxy a Gemini. La clave queda SOLO en el servidor (variable de entorno
// GEMINI_API_KEY), nunca en el navegador. El cliente manda la pregunta y un
// "contexto" con el estado de la quiniela (partidos, resultados y predicciones,
// que ya son públicas). Gemini además tiene búsqueda web activada (grounding).

const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Eres el asistente de "Mundialito 2026", una quiniela del Mundial de Fútbol 2026 entre amigos.
Respondes en español, de forma breve, clara y amena.

A continuación recibirás un CONTEXTO con el estado actual de la quiniela: el calendario de partidos, los resultados reales conocidos y las predicciones de cada participante (son públicas dentro del grupo). Úsalo como fuente para todo lo relacionado con la quiniela.

Tienes además acceso a búsqueda web para datos del mundo real (noticias, alineaciones, historiales, etc.).

REGLA DE FORMATO OBLIGATORIA: estructura SIEMPRE tu respuesta en dos partes, con estos encabezados en negrita y en este orden:

**Basado en las predicciones de los participantes:**
(aquí lo que puedas responder usando el CONTEXTO de la quiniela. Si la pregunta no tiene relación con las predicciones/partidos del contexto, escribe "sin datos relevantes".)

**De acuerdo a mi búsqueda web:**
(aquí lo que encuentres en la web. Si no aplica o no hace falta buscar, escribe "sin datos relevantes".)

No inventes resultados ni predicciones que no estén en el contexto.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Falta la variable GEMINI_API_KEY en el servidor.' });
  }

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) || {};
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const context = typeof body.context === 'string' ? body.context.slice(0, 24000) : '';

  if (!question) {
    return res.status(400).json({ error: 'Falta la pregunta.' });
  }
  if (question.length > 1000) {
    return res.status(400).json({ error: 'La pregunta es demasiado larga.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: `CONTEXTO DE LA QUINIELA:\n${context || '(sin datos)'}\n\nPregunta del usuario: ${question}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = result.text?.trim();
    if (!answer) {
      return res.status(502).json({ error: 'La IA no devolvió respuesta. Intenta de nuevo.' });
    }
    return res.status(200).json({ answer });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return res.status(500).json({ error: message });
  }
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
