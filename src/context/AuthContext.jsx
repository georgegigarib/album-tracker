import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function ensureUserDoc(firebaseUser) {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: firebaseUser.displayName || '',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || null,
        createdAt: serverTimestamp(),
        albumIds: [],
      });
    }
  }

  async function register(email, password, displayName) {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName });
    await ensureUserDoc({ ...newUser, displayName });
    return newUser;
  }

  async function login(email, password) {
    const { user: loggedUser } = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(loggedUser);
    return loggedUser;
  }

  async function loginWithGoogle() {
    const { user: googleUser } = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(googleUser);
    return googleUser;
  }

  async function logout() {
    await signOut(auth);
  }

  const value = { user, loading, register, login, loginWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
