import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

let firebaseConfig;
try {
  firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
} catch (e) {
  console.error("Missing config");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;
  // Match 1: PENDING
  await setDoc(doc(db, 'matches', 'm1'), {
    homeTeam: 'Colombia',
    awayTeam: 'Brasil',
    startTime: now + ONE_HOUR * 2, // 2h from now
    lockTime: now + ONE_HOUR * 2 - 5 * 60000,
    status: 'PENDING',
    stage: 'GROUP',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Match 2: LIVE
  await setDoc(doc(db, 'matches', 'm2'), {
    homeTeam: 'Argentina',
    awayTeam: 'Francia',
    startTime: now - ONE_HOUR, 
    lockTime: now - ONE_HOUR - 5 * 60000,
    status: 'LIVE',
    stage: 'FINAL',
    homeScore: 2,
    awayScore: 2,
    hasPenalties: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Match 3: FINISHED
  await setDoc(doc(db, 'matches', 'm3'), {
    homeTeam: 'España',
    awayTeam: 'Alemania',
    startTime: now - ONE_HOUR * 48, 
    lockTime: now - ONE_HOUR * 48 - 5 * 60000,
    status: 'FINISHED',
    stage: 'SF',
    homeScore: 1,
    awayScore: 0,
    hasPenalties: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Seed done');
  process.exit(0);
}
seed().catch(console.error);
