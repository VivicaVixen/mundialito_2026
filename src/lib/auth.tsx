import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginOrRegister: (username: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// We use pseudo-emails mapping username to user@quiniela.app
const getPseudoEmail = (username: string) => `${username.toLowerCase().trim()}@quiniela.app`;
// Password needs to be at least 6 chars
const getZeroPaddedPin = (pin: string) => `${pin}00`;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user from firestore
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser({ id: firebaseUser.uid, ...docSnap.data() } as User);
          } else {
            // Unlikely to happen if we create it right after signup, but just in case
            setUser({ id: firebaseUser.uid, username: firebaseUser.email!.split('@')[0], totalScore: 0 });
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginOrRegister = async (username: string, pin: string) => {
    const email = getPseudoEmail(username);
    const password = getZeroPaddedPin(pin);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Try creating
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          // Insert into Firestore
          await setDoc(doc(db, 'users', cred.user.uid), {
            username: username.trim(),
            totalScore: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
            throw new Error('El usuario ya existe con otro PIN.');
          }
          throw createError;
        }
      } else {
        throw new Error('Error al iniciar sesión. Comprueba el PIN.');
      }
    }
  };

  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, loginOrRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
