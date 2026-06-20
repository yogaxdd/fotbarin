'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { useAuth } from '@/components/auth/AuthProvider'
import PublishedFrameCard from '@/components/frame/PublishedFrameCard'
import { auth, db } from '@/lib/firebase'
import { COMMUNITY_FRAMES_UPDATED_EVENT, getPublishedFramesForUsername, type PublishedFrame } from '@/lib/community-frames'
import { getUsernameError, normalizeUsername } from '@/lib/profile'

type PublicProfile = {
  uid: string
  name: string
  username: string
  email?: string | null
  photoURL?: string | null
  bio?: string | null
  isPremium?: boolean
  premiumExpiresAt?: number
  trialUsed?: boolean
}

const accountMenuItems = [
  { href: '/settings', label: 'Setting', icon: 'settings' },
] as const

function displayFromUsername(username: string) {
  return username
    .split(/[-_.]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Creator Fotbarin'
}

const profileRequestCache = new Map<string, Promise<PublicProfile | null>>()
const followStateRequestCache = new Map<string, Promise<boolean>>()

function getPublicProfile(username: string) {
  const existingRequest = profileRequestCache.get(username)
  if (existingRequest) return existingRequest

  const request = getDocs(query(collection(db, 'users'), where('username', '==', username), limit(1)))
    .then((snapshot) => (snapshot.empty ? null : (snapshot.docs[0].data() as PublicProfile)))
    .catch((error) => {
      profileRequestCache.delete(username)
      throw error
    })

  profileRequestCache.set(username, request)
  return request
}

function getFollowState(currentUserUid: string, targetUid: string) {
  const cacheKey = `${currentUserUid}:${targetUid}`
  const existingRequest = followStateRequestCache.get(cacheKey)
  if (existingRequest) return existingRequest

  const request = getDoc(doc(db, 'users', currentUserUid, 'following', targetUid))
    .then((snapshot) => snapshot.exists())
    .catch((error) => {
      followStateRequestCache.delete(cacheKey)
      throw error
    })

  followStateRequestCache.set(cacheKey, request)
  return request
}

export default function UsernameProfilePage() {
  const params = useParams<{ username: string }>()
  const router = useRouter()
  const username = normalizeUsername(params.username ?? '')
  const { user, displayName, profileComplete, profileHref, username: currentUsername, isPremium: currentUserIsPremium, refreshProfile } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editError, setEditError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [publishedFrames, setPublishedFrames] = useState<PublishedFrame[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const ignoreNextMobileMenuClickRef = useRef(false)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      setLoading(true)
      try {
        const nextProfile = await getPublicProfile(username)
        if (!active) return
        setProfile(nextProfile)
      } catch {
        if (active) setProfile(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [username])

  useEffect(() => {
    const syncFrames = () => setPublishedFrames(getPublishedFramesForUsername(username))
    syncFrames()
    window.addEventListener(COMMUNITY_FRAMES_UPDATED_EVENT, syncFrames)
    window.addEventListener('storage', syncFrames)
    return () => {
      window.removeEventListener(COMMUNITY_FRAMES_UPDATED_EVENT, syncFrames)
      window.removeEventListener('storage', syncFrames)
    }
  }, [username])

  const displayProfile = useMemo(() => {
    if (profile) return profile

    const localCreatorFrame = publishedFrames[0]
    if (localCreatorFrame) {
      return {
        uid: 'local-published-profile',
        name: localCreatorFrame.creatorName,
        username,
        email: null,
        photoURL: null,
        bio: localCreatorFrame.description || 'Creator Fotbarin dengan frame publish lokal dari editor.',
      }
    }

    return {
      uid: 'empty-profile',
      name: displayFromUsername(username),
      username,
      email: null,
      photoURL: null,
      bio: null,
    }
  }, [profile, publishedFrames, username])

  const isSimulated = !loading && !profile && publishedFrames.length === 0
  const isOwnProfile = Boolean((currentUsername && currentUsername === displayProfile.username) || (profile?.uid && user?.uid === profile.uid))
  const ownProfileHref = profileComplete ? profileHref : '/login'
  const profileBio = displayProfile.bio || 'Creating cute frames for your digital memories. 📸✨ Lover of pastel, retro photobooths, and shareable strips.'
  const displayProfileIsPremium = Boolean(displayProfile.isPremium && displayProfile.premiumExpiresAt && displayProfile.premiumExpiresAt > Date.now())
  const canFollowProfile = Boolean(user && profile?.uid && !isOwnProfile)

  useEffect(() => {
    let active = true

    const loadFollowState = async () => {
      setFollowError('')

      if (!user || !profile?.uid || isOwnProfile) {
        setFollowing(false)
        setFollowLoading(false)
        return
      }

      setFollowLoading(true)
      try {
        const nextFollowing = await getFollowState(user.uid, profile.uid)
        if (active) setFollowing(nextFollowing)
      } catch {
        if (active) {
          setFollowing(false)
          setFollowError('Status follow belum bisa dimuat. Coba refresh halaman.')
        }
      } finally {
        if (active) setFollowLoading(false)
      }
    }

    loadFollowState()

    return () => {
      active = false
    }
  }, [isOwnProfile, profile?.uid, user])

  useEffect(() => {
    if (!editing) {
      setEditName(displayProfile.name)
      setEditUsername(displayProfile.username)
      setEditBio(profileBio)
    }
  }, [displayProfile.name, displayProfile.username, editing, profileBio])

  const sidebarItems = [
    { label: 'Beranda', icon: 'home', href: '/beranda', active: false },
    { label: 'Template', icon: 'dashboard_customize', href: '/templates', active: false },
    { label: 'Foto', icon: 'camera_alt', href: '/shoot', active: false },
    { label: 'Komunitas', icon: 'groups', href: '/community', active: false },
    { label: 'Profil', icon: 'person', href: ownProfileHref, active: true },
  ]

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const handleEditProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !isOwnProfile) return

    const cleanName = editName.trim()
    const cleanUsername = normalizeUsername(editUsername)
    const cleanBio = editBio.trim()
    const validationMessage = !cleanName ? 'Nama wajib diisi.' : getUsernameError(cleanUsername)

    if (validationMessage) {
      setEditError(validationMessage)
      return
    }

    setSavingProfile(true)
    setEditError('')

    try {
      const usernameSnapshot = await getDocs(query(collection(db, 'users'), where('username', '==', cleanUsername), limit(1)))
      const usernameOwner = usernameSnapshot.empty ? null : usernameSnapshot.docs[0].data()

      if (usernameOwner && usernameOwner.uid !== user.uid) {
        setEditError('Username ini sudah dipakai. Pilih username lain.')
        return
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          name: cleanName,
          username: cleanUsername,
          bio: cleanBio,
          email: user.email,
          photoURL: user.photoURL,
          provider: 'google',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setProfile((current) => ({
        uid: user.uid,
        name: cleanName,
        username: cleanUsername,
        bio: cleanBio,
        email: current?.email ?? user.email,
        photoURL: current?.photoURL ?? user.photoURL,
        isPremium: current?.isPremium,
        premiumExpiresAt: current?.premiumExpiresAt,
        trialUsed: current?.trialUsed,
      }))
      await refreshProfile()
      setEditing(false)

      if (cleanUsername !== username) {
        router.replace(`/${cleanUsername}`)
      }
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      setEditError(code ? `Profil belum berhasil disimpan (${code}).` : 'Profil belum berhasil disimpan. Coba lagi.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!profile?.uid || isOwnProfile || followLoading) return

    setFollowLoading(true)
    setFollowError('')

    try {
      const followingRef = doc(db, 'users', user.uid, 'following', profile.uid)
      const followerRef = doc(db, 'users', profile.uid, 'followers', user.uid)

      if (following) {
        const batch = writeBatch(db)
        batch.delete(followingRef)
        batch.delete(followerRef)
        await batch.commit()
        followStateRequestCache.set(`${user.uid}:${profile.uid}`, Promise.resolve(false))
        setFollowing(false)
        return
      }

      const currentUserSnapshot = await getDoc(doc(db, 'users', user.uid))
      const currentUserProfile = currentUserSnapshot.exists() ? currentUserSnapshot.data() : null
      const batch = writeBatch(db)
      const now = serverTimestamp()

      batch.set(followingRef, {
        uid: profile.uid,
        username: profile.username,
        name: profile.name,
        photoURL: profile.photoURL ?? null,
        createdAt: now,
      })
      batch.set(followerRef, {
        uid: user.uid,
        username: currentUserProfile?.username ?? currentUsername ?? '',
        name: currentUserProfile?.name ?? displayName,
        photoURL: user.photoURL ?? null,
        createdAt: now,
      })

      await batch.commit()
      followStateRequestCache.set(`${user.uid}:${profile.uid}`, Promise.resolve(true))
      setFollowing(true)
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      setFollowError(code ? `Follow belum berhasil (${code}).` : 'Follow belum berhasil. Coba lagi.')
    } finally {
      setFollowLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_-8%,oklch(93%_0.045_350_/_0.8),transparent_32rem),radial-gradient(circle_at_88%_8%,oklch(92%_0.04_205_/_0.55),transparent_28rem),linear-gradient(180deg,oklch(98.5%_0.006_330),oklch(96.5%_0.008_330))] text-on-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-outline-variant bg-white/86 p-4 shadow-panel backdrop-blur-xl lg:flex">
          <Link href="/" className="mb-6 flex items-center gap-3 rounded-2xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-white">F</span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-primary" translate="no">Fotbarin</p>
              <p className="text-xs font-bold text-on-surface-variant">Creator profile</p>
            </div>
          </Link>

          <nav className="grid gap-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  item.active
                    ? 'bg-on-background text-white shadow-sm'
                    : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-primary-container hover:text-on-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[21px]" style={{ fontVariationSettings: `'FILL' ${item.active ? 1 : 0}` }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-[1.5rem] bg-primary-container p-4 text-on-primary-container">
            <p className="text-sm font-extrabold">Profil kreator</p>
            <p className="mt-2 text-sm font-semibold leading-6">Bagikan link @{displayProfile.username} untuk menampilkan frame dan koleksi publik.</p>
            <Link href="/templates" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-on-background px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5">
              Lihat template
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-8">
          <header className="relative sticky top-3 z-40 mb-5 rounded-full border border-outline-variant bg-white/88 px-3 py-2 shadow-panel backdrop-blur-xl supports-[backdrop-filter]:bg-white/76 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="rounded-full px-2 py-1 text-lg font-extrabold leading-none tracking-tight text-primary transition hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" translate="no">Fotbarin</Link>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <button
                  type="button"
                  onClick={() => {
                    if (ignoreNextMobileMenuClickRef.current) {
                      ignoreNextMobileMenuClickRef.current = false
                      return
                    }

                    setMobileMenuOpen((current) => !current)
                  }}
                  onPointerUp={(event) => {
                    if (event.pointerType !== 'mouse') {
                      ignoreNextMobileMenuClickRef.current = true
                      event.preventDefault()
                      setMobileMenuOpen((current) => !current)
                    }
                  }}
                  className="inline-flex h-10 w-10 touch-manipulation select-none items-center justify-center rounded-full border border-outline-variant bg-white text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="material-symbols-outlined text-[22px] transition-transform duration-200" style={{ transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    {mobileMenuOpen ? 'close' : 'menu'}
                  </span>
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <nav className="motion-menu absolute left-0 right-0 top-[calc(100%+0.6rem)] grid gap-1 rounded-[1.75rem] border border-outline-variant bg-white p-3 shadow-panel ring-1 ring-white/70 supports-[backdrop-filter]:bg-white/96 supports-[backdrop-filter]:backdrop-blur-2xl">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                      item.active ? 'bg-on-background text-white' : 'text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: `'FILL' ${item.active ? 1 : 0}` }}>{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </Link>
                ))}
              </nav>
            )}
          </header>

          <div className="relative z-50 mb-5 hidden items-center justify-between gap-4 lg:flex">
            <div>
              <p className="text-sm font-extrabold text-primary">Profil kreator</p>
              <p className="text-sm font-semibold text-on-surface-variant">Kelola dan tampilkan profil publik Fotbarin.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-white/80 p-1.5 shadow-sm">
              <LanguageToggle />
              {user ? (
                <div className="account-group group relative">
                  <button
                    type="button"
                    className="account-trigger flex items-center gap-2 rounded-full bg-secondary-container py-1 pl-1 pr-4 text-sm font-extrabold text-on-secondary-container hover:-translate-y-0.5 hover:shadow-sticker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-haspopup="menu"
                  >
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt="" className="account-avatar h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="account-avatar material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-full bg-white text-[19px] text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                    )}
                    Akun
                  </button>

                  <div className="account-popover absolute right-0 top-full w-72 pt-3">
                    <div className="account-panel rounded-[1.6rem] border border-outline-variant bg-white p-3 text-left shadow-panel">
                      <div className="flex items-center gap-3 rounded-[1.25rem] bg-primary-container/70 p-3">
                        {user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.photoURL} alt="" className="h-11 w-11 rounded-full object-cover shadow-sm" />
                        ) : (
                          <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-on-background">{displayName}</p>
                          {currentUserIsPremium ? (
                            <p className="motion-scan mt-1 inline-flex items-center gap-1 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-1 text-xs font-extrabold text-amber-950 shadow-sm">
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: `'FILL' 1` }}>workspace_premium</span>
                              Premium
                            </p>
                          ) : (
                            <p className="mt-1 inline-flex rounded-full bg-white/80 px-2 py-1 text-xs font-extrabold text-primary">Free Plan</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1">
                        <Link href={ownProfileHref} className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                          My Profil
                        </Link>
                        {accountMenuItems.map((item) => (
                          <Link key={item.href} href={item.href} className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                        <button type="button" onClick={handleLogout} className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-error hover:bg-error-container hover:text-on-error-container focus-visible:bg-error-container focus-visible:text-on-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                          <span className="material-symbols-outlined text-[20px]">logout</span>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-on-surface-variant transition hover:bg-primary-container hover:text-on-primary-container">
                  Login
                </Link>
              )}
            </div>
          </div>

          <div className="mx-auto max-w-md lg:max-w-none">
            <section className="relative h-48 lg:h-56">
              <div className="absolute inset-0 overflow-hidden border-y border-outline-variant bg-[radial-gradient(circle_at_18%_20%,#ffd1dc_0_18%,transparent_19%),radial-gradient(circle_at_78%_18%,#b5e5eb_0_16%,transparent_17%),radial-gradient(circle_at_54%_78%,#fad3fd_0_22%,transparent_23%),linear-gradient(135deg,#fff7fb,#eefcff)] shadow-panel lg:rounded-[2rem] lg:border" />
              <div className="absolute inset-0 rounded-none opacity-60 [background-image:linear-gradient(120deg,rgba(255,255,255,.75),transparent_42%,rgba(255,255,255,.45))] lg:rounded-[2rem]" />
              <div className="absolute -bottom-10 left-5 z-10 lg:left-8">
                <div className="h-24 w-24 overflow-hidden rounded-full border-[3px] border-white bg-white shadow-[0_4px_10px_rgba(0,0,0,0.14)]">
                  {displayProfile.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayProfile.photoURL} alt="Foto profil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary-container text-primary">
                      <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className={`mt-12 px-5 lg:pl-8 lg:pr-0 ${displayProfileIsPremium ? 'premium-profile-card rounded-[2rem] pb-6 pt-5 lg:pr-8' : ''}`}>
              {displayProfileIsPremium && (
                <div className="mb-4 flex justify-start">
                  <div className="motion-scan inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-4 py-2 text-sm font-extrabold text-amber-950 shadow-lg">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' 1` }}>workspace_premium</span>
                    Premium Creator
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="flex min-w-0 items-center gap-2 text-2xl font-extrabold tracking-tight text-on-background">
                      <span className="truncate">@{displayProfile.username}</span>
                      {displayProfileIsPremium && (
                        <span className="premium-crown material-symbols-outlined shrink-0 text-[28px] text-amber-500" style={{ fontVariationSettings: `'FILL' 1` }} title="Premium Member">
                          workspace_premium
                        </span>
                      )}
                    </h1>
                    {isSimulated && (
                      <span className="rounded-full bg-tertiary-container px-2.5 py-1 text-xs font-extrabold text-on-tertiary-container">Simulasi</span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-extrabold text-primary">{displayProfile.name}</p>
                  <p className="mt-2 max-w-[360px] text-sm font-semibold leading-6 text-on-surface-variant">
                    {profileBio}
                  </p>
                </div>
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => setEditing((current) => !current)}
                    className="rounded-xl border-2 border-on-background bg-primary-container px-5 py-2 text-sm font-extrabold text-on-primary-container shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    {editing ? 'Tutup edit' : 'Edit profil'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    disabled={followLoading || Boolean(user && !canFollowProfile)}
                    className={`rounded-xl border-2 border-on-background px-5 py-2 text-sm font-extrabold shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${
                      following
                        ? 'bg-on-background text-white'
                        : 'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    {followLoading ? 'Loading…' : following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {followError && !isOwnProfile && (
                <div className="mt-4 rounded-2xl border border-error-container bg-error-container px-4 py-3 text-sm font-bold text-on-error-container" role="alert">
                  {followError}
                </div>
              )}

              {editing && isOwnProfile && (
                <form onSubmit={handleEditProfile} className="mt-6 grid gap-4 rounded-[1.5rem] border border-outline-variant bg-white p-4 shadow-sm">
                  {editError && (
                    <div className="rounded-2xl border border-error-container bg-error-container px-4 py-3 text-sm font-bold text-on-error-container" role="alert">
                      {editError}
                    </div>
                  )}
                  <label className="grid gap-2 text-sm font-extrabold text-on-background">
                    Nama
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-base font-bold text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Nama tampil"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold text-on-background">
                    Username
                    <div className="flex items-center rounded-2xl border border-outline-variant bg-white px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="text-sm font-extrabold text-on-surface-variant">fotbarin/</span>
                      <input
                        value={editUsername}
                        onChange={(event) => setEditUsername(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-base font-bold text-on-background outline-none"
                        placeholder="username"
                      />
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant">Preview: /{normalizeUsername(editUsername)}</span>
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold text-on-background">
                    Bio
                    <textarea
                      value={editBio}
                      onChange={(event) => setEditBio(event.target.value)}
                      rows={3}
                      className="resize-none rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold leading-6 text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Tulis bio singkat kreator"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                    >
                      {savingProfile ? 'Menyimpan…' : 'Simpan profil'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 flex gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  [String(publishedFrames.length * 12), 'Likes'],
                  [String(publishedFrames.length * 37), 'Uses'],
                  [String(publishedFrames.length), 'Frames'],
                ].map(([value, label]) => (
                  <div key={label} className="flex min-w-20 flex-col items-center justify-center rounded-xl border-2 border-outline-variant bg-white p-4">
                    <span className="text-sm font-extrabold text-primary">{value}</span>
                    <span className="text-xs font-bold text-on-surface-variant">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10 px-5 lg:px-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Published Frames</h2>
                <button type="button" className="flex items-center gap-1 text-sm font-extrabold text-primary">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  Latest
                </button>
              </div>

              {publishedFrames.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  {publishedFrames.map((frame) => (
                    <PublishedFrameCard key={frame.id} frame={frame} compact />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-outline-variant bg-white/70 p-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-primary">dashboard_customize</span>
                  <p className="mt-2 text-sm font-extrabold text-on-background">Belum ada frame publish</p>
                  <p className="mx-auto mt-1 max-w-md text-sm font-semibold leading-6 text-on-surface-variant">Frame yang kamu publish dari editor akan tampil di profil ini. Data dummy disembunyikan supaya profil tidak terasa palsu.</p>
                  <Link href="/frame-editor" className="mt-4 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5">Buat frame</Link>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
