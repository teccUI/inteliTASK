"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface Messages {
  [key: string]: any
}

interface LanguageContextType {
  language: string
  messages: Messages
  setLanguage: (lang: string) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const supportedLanguages = ['en', 'es', 'fr', 'de', 'pt']

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('en')
  const [messages, setMessages] = useState<Messages>({})
  const { user } = useAuth()

  // Translation function
  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split('.')
    let value = messages
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }
    
    let result = typeof value === 'string' ? value : key
    
    // Simple parameter substitution
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(`{${paramKey}}`, String(paramValue))
      })
    }
    
    return result
  }

  const setLanguage = async (lang: string) => {
    if (!supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} not supported, falling back to English`)
      lang = 'en'
    }
    
    try {
      const messagesModule = await import(`../messages/${lang}.json`)
      setMessages(messagesModule.default)
      setLanguageState(lang)
      localStorage.setItem('language', lang)
    } catch (error) {
      console.error(`Failed to load language ${lang}:`, error)
      // Fallback to English
      const englishModule = await import('../messages/en.json')
      setMessages(englishModule.default)
      setLanguageState('en')
    }
  }

  // Load language on mount and when user changes (but only once per user)
  useEffect(() => {
    const loadLanguage = async () => {
      // Check localStorage first (immediate preference), then user settings, then browser language
      let preferredLang = 'en'
      
      const savedLang = localStorage.getItem('language')
      if (savedLang && supportedLanguages.includes(savedLang)) {
        preferredLang = savedLang
      } else if (user) {
        // Fetch user settings from API if not in localStorage
        try {
          const response = await fetch(`/api/users/settings?userId=${user.uid}`)
          if (response.ok) {
            const data = await response.json()
            if (data.settings?.appearance?.language) {
              preferredLang = data.settings.appearance.language
            }
          }
        } catch (error) {
          console.error('Failed to fetch user language preference:', error)
        }
        
        // If still no preference, try browser language
        if (preferredLang === 'en') {
          const browserLang = navigator.language.split('-')[0]
          if (supportedLanguages.includes(browserLang)) {
            preferredLang = browserLang
          }
        }
      }
      
      await setLanguage(preferredLang)
    }
    
    // Only load language when user changes or on initial mount
    if (user) {
      loadLanguage()
    }
  }, [user?.uid]) // Only depend on user ID, not the entire user object

  return (
    <LanguageContext.Provider value={{ language, messages, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}