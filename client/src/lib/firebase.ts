import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const authService = {
  async signInWithEmail(email: string, password: string) {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  async signUpWithEmail(email: string, password: string, displayName?: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await this.updateUserProfile(result.user.uid, { displayName });
    }
    return result;
  },

  async signInWithGoogle() {
    return await signInWithPopup(auth, googleProvider);
  },

  async signOut() {
    return await signOut(auth);
  },

  async updateUserProfile(uid: string, data: { displayName?: string; photoURL?: string }) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data, { merge: true });
  },

  async getUserProfile(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  }
};
