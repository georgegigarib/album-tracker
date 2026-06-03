import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { AuthContext } from './authContextValue';

const TOKEN_KEY = 'gdrive_token';
const TOKEN_EXPIRY_KEY = 'gdrive_token_expiry';

function loadStoredToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (token && expiry && Date.now() < Number(expiry)) return token;
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState(loadStoredToken);

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
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setGoogleAccessToken(credential.accessToken);
      sessionStorage.setItem(TOKEN_KEY, credential.accessToken);
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 3600 * 1000));
    }
    await ensureUserDoc(result.user);
    return result.user;
  }

  async function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    setGoogleAccessToken(null);
    await signOut(auth);
  }

  const value = { user, loading, googleAccessToken, register, login, loginWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
