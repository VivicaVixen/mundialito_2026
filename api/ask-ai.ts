import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Proxy a Gemini. La clave queda SOLO en el servidor (variable de entorno
// GEMINI_API_KEY), nunca en el navegador. El cliente manda la pregunta y un
// "contexto" con el estado de la quiniela (partidos, resultados y predicciones,
// que ya son públicas). Gemini además tiene búsqueda web activada (grounding).

const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Eres "el Analista" de la quiniela "Mundialito 2026", un grupo de amigos que predice los resultados del Mundial 2026. Hablas en español con tono cercano, futbolero y divertido, pero conciso.

Tu trabajo es DAR INSIGHTS, no listar datos crudos. Analiza y saca conclusiones: quién lidera y por qué, predicciones en consenso vs. atrevidas, quién la tiene difícil o fácil, posibles acertantes, datos curiosos, choques entre lo que predijo el grupo y lo que pasó. Habla como un comentarista que conoce a estos amigos por su nombre.

Recibirás un CONTEXTO con el estado de la quiniela (tabla de posiciones, partidos, resultados reales y predicciones públicas de cada jugador). Úsalo como fuente. NUNCA copies la lista completa de predicciones tal cual: resume y extrae lo interesante. Solo lista predicciones concretas si te las piden explícitamente, y aun así de forma breve.

Tienes BÚSQUEDA WEB de Google. ÚSALA SIEMPRE para aportar algo real y actual relacionado con la pregunta: forma reciente de los equipos, noticias, lesiones, historial entre rivales, datos de la sede/horario, contexto del torneo, etc. No te limites al contexto interno.

Formato de respuesta, SIEMPRE con estos dos encabezados en negrita y en este orden:

**🎯 Desde la quiniela:**
(análisis e insights usando el CONTEXTO. Con sustancia, no un volcado de datos. Si de verdad la pregunta no toca la quiniela, dilo en una línea.)

**🌐 Según la web:**
(hallazgos concretos y actuales de tu búsqueda web, relevantes a la pregunta. Aporta siempre algo útil del mundo real.)

Sé conciso: máximo ~6 líneas por sección. Usa viñetas solo si ayudan. No inventes resultados, predicciones ni datos: si algo no está en el contexto y no lo hallaste en la web, dilo.`;

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
        temperature: 0.8,
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = result.text?.trim();
    if (!answer) {
      return res.status(502).json({ error: 'La IA no devolvió respuesta. Intenta de nuevo.' });
    }

    // Fuentes web usadas por el grounding (sirve para mostrar de dónde salió y
    // para confirmar que la búsqueda web sí se ejecutó).
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const seen = new Set<string>();
    const sources: { title: string; uri: string }[] = [];
    for (const c of chunks) {
      const uri = c.web?.uri;
      if (!uri || seen.has(uri)) continue;
      seen.add(uri);
      sources.push({ title: c.web?.title || uri, uri });
    }

    return res.status(200).json({ answer, sources });
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
