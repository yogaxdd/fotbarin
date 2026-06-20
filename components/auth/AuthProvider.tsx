'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export type UserProfile = {
  uid: string
  name: string
  username: string
  email?: string | null
  photoURL?: string | null
  provider?: string
  isPremium?: boolean
  premiumExpiresAt?: number
  trialUsed?: boolean
}

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  profileComplete: boolean
  displayName: string
  username: string
  profileHref: string
  isPremium: boolean
  canClaimTrial: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const loadProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)
    try {
      const snapshot = await getDoc(doc(db, 'users', nextUser.uid))
      setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      setLoading(false)
      await loadProfile(nextUser)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const refreshProfile = async () => loadProfile(auth.currentUser ?? user)
  const username = profile?.username ?? ''
  const displayName = profile?.name || user?.displayName || 'pengguna Fotbarin'
  const profileComplete = Boolean(user && profile?.name && profile?.username)
  const profileHref = username ? `/${username}` : '/login'
  const isPremium = Boolean(user && profile?.isPremium && profile?.premiumExpiresAt && profile.premiumExpiresAt > now)
  const canClaimTrial = Boolean(user && profile && !profile.trialUsed)

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      profileComplete,
      displayName,
      username,
      profileHref,
      isPremium,
      canClaimTrial,
      refreshProfile,
    }),
    [canClaimTrial, displayName, isPremium, loading, profile, profileComplete, profileHref, profileLoading, user, username],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
