import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMatchesAndPredictions } from '../lib/db';
import { useAuth } from '../lib/auth';
import { buildAiContext } from '../lib/aiContext';
import { Prediction, User } from '../types';

interface Source {
  title: string;
  uri: string;
}

interface ChatMsg {
  role: 'user' | 'ai';
  text: string;
  sources?: Source[];
}

const SUGGESTIONS = [
  '¿Quién va ganando la quiniela?',
  '¿Qué partidos juego hoy y qué predijo cada uno?',
  '¿Cómo le fue a Colombia y qué dicen las noticias?',
];

/** Resalta los **negritas** dentro de una línea. */
function inline(text: string, keyPrefix: string) {
  return text.split('**').map((p, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-bold text-slate-900">{p}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{p}</span>
    ),
  );
}

/** Markdown ligero: negritas, viñetas (*, -, •) y párrafos. */
function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 break-words">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-1.5" />;
        const bullet = /^([*\-•])\s+/.exec(trimmed);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-[#003893] mt-0.5 shrink-0">•</span>
              <span className="flex-1">{inline(trimmed.slice(bullet[0].length), `l${i}`)}</span>
            </div>
          );
        }
        return <p key={i}>{inline(trimmed, `l${i}`)}</p>;
      })}
    </div>
  );
}

export default function AskAI() {
  const { user } = useAuth();
  const { matches, predictions } = useMatchesAndPredictions();
  const [users, setUsers] = useState<User[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });
    return () => unsub();
  }, []);

  const context = useMemo(() => {
    const preds = Object.values(predictions) as Prediction[];
    return buildAiContext(matches, preds, users);
  }, [matches, predictions, users]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || loading || !user) return;
    setError('');
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      setMessages(prev => [...prev, { role: 'ai', text: data.answer, sources: data.sources }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo consultar a la IA.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Pregúntale a la IA</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Pregunta sobre los partidos, resultados y predicciones. Combina los datos de la quiniela con búsqueda web.
        </p>
      </header>

      {/* Conversación */}
      <div className="flex flex-col gap-3 min-h-[120px]">
        {messages.length === 0 && !loading && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center text-slate-500 text-sm">
            🤖 Hazme una pregunta. Por ejemplo:
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={!user || loading}
                  className="text-xs font-medium bg-blue-50 text-[#003893] border border-blue-100 rounded-full px-3 py-1.5 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
              m.role === 'user'
                ? 'self-end bg-[#003893] text-white whitespace-pre-wrap break-words'
                : 'self-start bg-white border border-slate-100 text-slate-700 shadow-sm'
            }`}
          >
            {m.role === 'ai' ? <Markdown text={m.text} /> : m.text}
            {m.role === 'ai' && m.sources && m.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Fuentes web</span>
                <div className="flex flex-col gap-1 mt-1">
                  {m.sources.slice(0, 5).map((s, j) => (
                    <a
                      key={j}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#003893] hover:underline truncate"
                    >
                      🔗 {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <div className="self-start bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-400 shadow-sm">
            Pensando…
          </div>
        )}

        {error && (
          <div className="self-start bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Caja de entrada */}
      <div className="sticky bottom-2">
        <form
          onSubmit={e => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={!user || loading}
            placeholder={user ? 'Escribe tu pregunta…' : 'Inicia sesión arriba para preguntar'}
            className="flex-1 bg-transparent px-3 py-2 outline-none text-sm text-slate-800 disabled:opacity-60"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={!user || loading || input.trim() === ''}
            className="bg-[#003893] text-white text-sm font-bold px-4 py-2 rounded-xl disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            Enviar
          </motion.button>
        </form>
      </div>
    </div>
  );
}
