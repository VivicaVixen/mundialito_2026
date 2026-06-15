import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Match, Prediction } from '../types';
import { useAuth } from './auth';

export function useMatchesAndPredictions() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qMatches = query(collection(db, 'matches'), orderBy('startTime', 'asc'));
    
    const unsubMatches = onSnapshot(qMatches, (snapshot) => {
      const matchData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];
      setMatches(matchData);
      setLoading(false); // Can be false faster
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    const qPredictions = query(collection(db, 'predictions'));
    const unsubPredictions = onSnapshot(qPredictions, (snapshot) => {
      const predData: Record<string, Prediction> = {};
      snapshot.docs.forEach(doc => {
        predData[doc.id] = { id: doc.id, ...doc.data() } as Prediction;
      });
      setPredictions(predData);
    }, (error) => {
      console.error(error);
    });

    return () => {
      unsubMatches();
      unsubPredictions();
    };
  }, []);

  const savePrediction = async (matchId: string, homeScore: number, awayScore: number, hasPenalties: boolean = false) => {
    if (!user) return;
    const predId = `${user.id}_${matchId}`;
    const ref = doc(db, 'predictions', predId);

    if (predictions[predId]) {
      // Editar: solo los campos mutables. NO tocar createdAt/points (las reglas
      // exigen que createdAt no cambie y solo permiten estos campos antes del cierre).
      await updateDoc(ref, {
        homeScore,
        awayScore,
        hasPenalties,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Crear por primera vez.
      await setDoc(ref, {
        userId: user.id,
        username: user.username,
        matchId,
        homeScore,
        awayScore,
        hasPenalties,
        points: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  return { matches, predictions, loading, savePrediction };
}
