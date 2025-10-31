import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import NetInfo from "@react-native-community/netinfo"
import { useLanguage } from "../utils/LanguageContext"

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const { language } = useLanguage()
  const [connectionStatus, setConnectionStatus] = useState<string>("")
  const [isChecking, setIsChecking] = useState(true)

  const translations = {
    appName: { en: "Vera", fr: "Vera" },
    tagline: { en: "Intelligent Voice Assistant", fr: "Assistant Vocal Intelligent" },
    checking: { en: "Checking connection...", fr: "Vérification de la connexion..." },
    connected: { en: "Connected!", fr: "Connecté !" },
    noInternet: { en: "No Internet Connection", fr: "Pas de connexion Internet" },
    noInternetMessage: {
      en: "Please check your internet connection and try again.",
      fr: "Veuillez vérifier votre connexion Internet et réessayer.",
    },
    retry: { en: "Retry", fr: "Réessayer" },
    cancel: { en: "Cancel", fr: "Annuler" },
  }

  useEffect(() => {
    checkInternetConnection()
  }, [])

  const checkInternetConnection = async () => {
    setIsChecking(true)
    setConnectionStatus(translations.checking[language])

    try {
      // Check network state
      const netInfoState = await NetInfo.fetch()
      
      console.log('Network State:', {
        isConnected: netInfoState.isConnected,
        isInternetReachable: netInfoState.isInternetReachable,
        type: netInfoState.type,
      })

      if (netInfoState.isConnected === false) {
        // No network connection at all
        setIsChecking(false)
        showNoInternetAlert()
        return
      }

      if (netInfoState.isInternetReachable === false) {
        // Connected to network but no internet
        setIsChecking(false)
        showNoInternetAlert()
        return
      }

      // Try to ping a reliable server to verify actual internet connectivity
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          // Internet is working
          setConnectionStatus(translations.connected[language])
          console.log('✓ Internet connection verified')
          
          // Wait a moment to show success message
          setTimeout(() => {
            onLoadComplete()
          }, 1000)
        } else {
          throw new Error('Server returned non-OK status')
        }
      } catch (fetchError) {
        console.log('Internet ping failed:', fetchError)
        setIsChecking(false)
        showNoInternetAlert()
      }

    } catch (error) {
      console.error('Network check error:', error)
      setIsChecking(false)
      showNoInternetAlert()
    }
  }

  const showNoInternetAlert = () => {
    setConnectionStatus(translations.noInternet[language])
    
    Alert.alert(
      translations.noInternet[language],
      translations.noInternetMessage[language],
      [
        {
          text: translations.retry[language],
          onPress: () => checkInternetConnection(),
        },
        {
          text: translations.cancel[language],
          style: "cancel",
        },
      ]
    )
  }

  return (
    <LinearGradient
      colors={["#0f172a", "#1e3a8a", "#0f172a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🎤</Text>
          <Text style={styles.appName}>{translations.appName[language]}</Text>
          <Text style={styles.tagline}>{translations.tagline[language]}</Text>
        </View>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          {isChecking && (
            <>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.statusText}>{connectionStatus}</Text>
            </>
          )}
          {!isChecking && (
            <Text style={styles.statusText}>{connectionStatus}</Text>
          )}
        </View>

        {/* Version/Copyright */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Vera</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoIcon: {
    fontSize: 100,
    marginBottom: 20,
  },
  appName: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: "#0ea5e9",
    textAlign: "center",
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: "center",
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
  },
  versionText: {
    fontSize: 12,
    color: "#475569",
  },
})
