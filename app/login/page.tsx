'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { signInWithPopup, signOut } from 'firebase/auth'
import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import SiteHeader from '@/components/layout/SiteHeader'
import { useAuth } from '@/components/auth/AuthProvider'
import { useI18n } from '@/components/i18n/I18nProvider'
import { auth, db, googleProvider } from '@/lib/firebase'
import { getUsernameError, normalizeUsername } from '@/lib/profile'

function getFirebaseLoginMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''

  if (code.includes('popup-closed-by-user')) return 'Login dibatalkan sebelum selesai.'
  if (code.includes('popup-blocked')) return 'Popup login diblokir browser. Izinkan popup untuk localhost/Fotbarin, lalu coba lagi.'
  if (code.includes('unauthorized-domain')) return 'Domain ini belum diizinkan di Firebase Authentication. Tambahkan localhost atau domain production di Firebase Console.'
  if (code.includes('network-request-failed')) return 'Koneksi bermasalah. Cek internet lalu coba lagi.'
  if (code.includes('too-many-requests')) return 'Firebase membatasi request sementara karena terlalu sering login/akses. Tunggu beberapa menit, lalu coba lagi. Jangan spam refresh/login.'

  return 'Google login belum berhasil. Coba lagi sebentar.'
}

export default function LoginPage() {
  const { copy } = useI18n()
  const { user, loading, profileLoading, profileComplete, profileHref, refreshProfile } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [name, setName] = useState('')
  const [usernameInput, setUsernameInput] = useState('')

  const username = useMemo(() => normalizeUsername(usernameInput), [usernameInput])
  const usernameError = useMemo(() => getUsernameError(username), [username])
  const needsProfileSetup = Boolean(user && !profileLoading && !profileComplete)

  useEffect(() => {
    if (user && !name) setName(user.displayName ?? '')
    if (user && !usernameInput) setUsernameInput(normalizeUsername(user.displayName ?? ''))
  }, [name, user, usernameInput])

  const handleGoogleLogin = async () => {
    setSubmitting(true)
    setErrorMessage('')

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const userRef = doc(db, 'users', result.user.uid)
      const userSnapshot = await getDocs(query(collection(db, 'users'), where('uid', '==', result.user.uid), limit(1)))
      const existingProfile = userSnapshot.empty ? null : userSnapshot.docs[0].data()

      await setDoc(
        userRef,
        {
          uid: result.user.uid,
          name: existingProfile?.name ?? result.user.displayName ?? 'pengguna Fotbarin',
          email: result.user.email,
          photoURL: result.user.photoURL,
          provider: 'google',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      await refreshProfile()

      if (existingProfile?.username) {
        router.push('/beranda')
      }
    } catch (error) {
      setErrorMessage(getFirebaseLoginMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleProfileSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const cleanName = name.trim()
    const cleanUsername = normalizeUsername(usernameInput)
    const validationMessage = !cleanName ? 'Nama wajib diisi.' : getUsernameError(cleanUsername)

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      const usernameSnapshot = await getDocs(query(collection(db, 'users'), where('username', '==', cleanUsername), limit(1)))
      const usernameOwner = usernameSnapshot.empty ? null : usernameSnapshot.docs[0].data()

      if (usernameOwner && usernameOwner.uid !== user.uid) {
        setErrorMessage('Username ini sudah dipakai. Pilih username lain.')
        return
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          name: cleanName,
          username: cleanUsername,
          email: user.email,
          photoURL: user.photoURL,
          provider: 'google',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      await refreshProfile()
      router.push(`/${cleanUsername}`)
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      setErrorMessage(code ? `Profil belum berhasil disimpan (${code}).` : 'Profil belum berhasil disimpan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setSubmitting(true)
    setErrorMessage('')

    try {
      await signOut(auth)
    } catch {
      setErrorMessage('Logout belum berhasil. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="motion-rise mx-auto w-full max-w-xl rounded-[2rem] border border-outline-variant bg-white p-6 text-center shadow-panel sm:p-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary-container text-primary">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="Foto profil Google" className="h-full w-full object-cover" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-on-background sm:text-4xl">
            {needsProfileSetup ? 'Lengkapi profil kamu' : user ? `Halo, ${user.displayName ?? 'pengguna Fotbarin'}` : copy.login.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-7 text-on-surface-variant">
            {needsProfileSetup
              ? 'Buat nama dan username unik dulu. Nanti profil kamu bisa dibuka lewat link username.'
              : user
                ? 'Akun Google kamu sudah tersambung. Kamu bisa masuk ke beranda atau logout dari sesi ini.'
                : copy.login.subtitle}
          </p>

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-error-container bg-error-container px-4 py-3 text-sm font-bold leading-6 text-on-error-container" role="alert">
              {errorMessage}
            </div>
          )}

          {needsProfileSetup ? (
            <form onSubmit={handleProfileSetup} className="mt-8 grid gap-4 text-left">
              <label className="grid gap-2 text-sm font-extrabold text-on-background">
                Nama tampil
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-base font-bold text-on-background shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Nama kamu"
                />
              </label>

              <label className="grid gap-2 text-sm font-extrabold text-on-background">
                Username
                <div className="flex items-center rounded-2xl border border-outline-variant bg-white px-4 py-3 shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="text-sm font-extrabold text-on-surface-variant">fotbarin/</span>
                  <input
                    value={usernameInput}
                    onChange={(event) => setUsernameInput(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base font-bold text-on-background outline-none"
                    placeholder="username"
                  />
                </div>
                <span className={`text-xs font-bold ${usernameError ? 'text-error' : 'text-on-surface-variant'}`}>
                  {username ? `Preview: /${username}` : 'Pakai huruf kecil, angka, titik, underscore, atau strip.'}
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || Boolean(usernameError)}
                className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {submitting ? 'Menyimpan…' : 'Buat profil'}
              </button>
            </form>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {user ? (
                <>
                  <Link href={profileComplete ? profileHref : '/beranda'} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5">
                    {profileComplete ? 'Buka profil' : 'Masuk beranda'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={submitting || loading}
                    className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-on-background shadow-sm transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Memproses…' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={submitting || loading}
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-sticker disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-base font-extrabold text-primary">G</span>
                    {submitting ? 'Membuka Google…' : 'Login dengan Google'}
                  </button>
                  <Link href="/shoot" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5">
                    {copy.login.continueBooth}
                  </Link>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
