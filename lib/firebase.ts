import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCZrJJ2u7nHNhyOy5VdsLD81Ep2TPDN-lY',
  authDomain: 'fotbarin.firebaseapp.com',
  projectId: 'fotbarin',
  storageBucket: 'fotbarin.firebasestorage.app',
  messagingSenderId: '493598477753',
  appId: '1:493598477753:web:ab365aa0f4244515257a68',
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
export const db = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
})
