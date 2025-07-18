"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo, // Import this for checking if user is new
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists in Firestore
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              name: user.displayName || '',
              avatar: user.photoURL || '',
            })
          })
          if (!response.ok) {
            console.error('Failed to create/update user document')
          }
        } catch (error) {
          console.error('Error creating/updating user document:', error)
        }
      }
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }

  // --- THIS IS THE FULLY CORRECTED FUNCTION ---
  const loginWithGoogle = async () => {
    try {
      // 1. Create a new provider instance
      const provider = new GoogleAuthProvider();

      // 2. Add the necessary scopes to ask for permission.
      // This is the key step to get access to the user's tasks and calendar.
      provider.addScope("https://www.googleapis.com/auth/tasks.readonly");
      provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

      // 3. Request offline access to get a refresh token.
      // This is crucial for your backend to be able to sync even when the user is not active.
      provider.setCustomParameters({
        access_type: 'offline',
        prompt: "consent", // Ensures the user is prompted for the new scopes and gets a refresh token
      });

      // 4. Sign in with the popup and get the full result
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 5. Get the OAuth credential, which contains the all-important tokens
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential) {
        throw new Error("Could not get credential from Google sign-in result.");
      }
      const accessToken = credential.accessToken;
      // Note: refreshToken is not available in Firebase Auth credentials
      // It's managed internally by Firebase Auth

      // 6. Save or update the user document in Firestore with the new tokens
      const userRef = doc(db, "users", user.uid);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        avatar: user.photoURL || "",
        updatedAt: new Date(),
        accessToken: accessToken, // Save the access token for immediate use
      };

      // Use getAdditionalUserInfo to check if this is a brand new sign-up
      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        // If the user is new, also set their creation date
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date(),
        });
      } else {
        // If the user already exists, merge the updated token data
        await setDoc(userRef, userData, { merge: true });
      }

    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}