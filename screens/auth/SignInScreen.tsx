"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Audio } from "expo-av"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useLanguage } from "../../utils/LanguageContext"
import { AuthService, StorageApiService } from "../../services"

export default function SignInScreen({ navigation, onSignIn }: any) {
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [voiceRecordingUri, setVoiceRecordingUri] = useState<string | null>(null)

  const translations = {
    title: { en: "Welcome Back", fr: "Bon Retour" },
    subtitle: { en: "Sign in to continue", fr: "Connectez-vous pour continuer" },
    emailLabel: { en: "Email", fr: "E-mail" },
    emailPlaceholder: { en: "Enter your email", fr: "Entrez votre e-mail" },
    passwordLabel: { en: "Password", fr: "Mot de passe" },
    passwordPlaceholder: { en: "Enter your password", fr: "Entrez votre mot de passe" },
    voiceTitle: { en: "Voice Authentication", fr: "Authentification Vocale" },
    voiceSubtitle: { en: "Record your voice for secure login", fr: "Enregistrez votre voix pour une connexion sécurisée" },
    recording: { en: "Recording", fr: "Enregistrement" },
    tapToRecord: { en: "Tap to record (5s)", fr: "Appuyez pour enregistrer (5s)" },
    voiceRecorded: { en: "✓ Voice recorded! Press Sign In button below", fr: "✓ Voix enregistrée ! Appuyez sur le bouton ci-dessous" },
    signInButton: { en: "Sign In", fr: "Se connecter" },
    signingIn: { en: "Signing in...", fr: "Connexion..." },
    noAccount: { en: "Don't have an account?", fr: "Pas encore de compte ?" },
    signUpLink: { en: "Sign Up", fr: "S'inscrire" },
    success: { en: "Success", fr: "Succès" },
    voiceRecordedAlert: { en: "Voice recorded! Press Sign In to authenticate.", fr: "Voix enregistrée ! Appuyez sur Se connecter pour vous authentifier." },
    error: { en: "Error", fr: "Erreur" },
    recordingFailed: { en: "Failed to start recording. Please check microphone permissions.", fr: "Échec de l'enregistrement. Vérifiez les autorisations du microphone." },
    recordVoiceOrEmail: { en: "Please record your voice or enter email and password", fr: "Veuillez enregistrer votre voix ou entrer votre e-mail et mot de passe" },
    permissionRequired: { en: "Permission required", fr: "Permission requise" },
    microphonePermission: { en: "Please grant microphone permission to use voice authentication", fr: "Veuillez autoriser le microphone pour l'authentification vocale" },
    processVoiceFailed: { en: "Failed to process voice recording", fr: "Échec du traitement de l'enregistrement vocal" },
  }

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync()
      }
    }
  }, [recording])

  const handleSignIn = async () => {
    // Check if user has recorded voice
    const hasVoiceRecording = voiceRecordingUri !== null
    
    // Check if user has entered email and password
    const hasEmailPassword = email && password
    
    if (!hasVoiceRecording && !hasEmailPassword) {
      Alert.alert(translations.error[language], translations.recordVoiceOrEmail[language])
      return
    }
    
    setLoading(true)
    
    try {
      // Prepare login data
      const loginData: any = {}
      
      if (hasEmailPassword) {
        // Email and password login
        loginData.email = email.trim().toLowerCase()
        loginData.password = password.trim()
      } else if (hasVoiceRecording) {
        // Voice authentication (future enhancement)
        // For now, use voice as indicator but require email
        loginData.email = email.trim().toLowerCase()
        loginData.voiceRecording = voiceRecordingUri
        
        if (!email) {
          Alert.alert(
            translations.error[language],
            language === "en" 
              ? "Please enter your email for voice authentication" 
              : "Veuillez entrer votre e-mail pour l'authentification vocale"
          )
          setLoading(false)
          return
        }
      }
      
      // Call login API
      const result = await AuthService.login(loginData)
      
      console.log('Login successful:', result)
      
      // Upload voice recording if provided (for voice verification/training)
      if (hasVoiceRecording && result.user) {
        try {
          const userId = result.user.id.toString()
          await StorageApiService.uploadVoiceRecording(voiceRecordingUri!, userId)
          console.log('Voice sample uploaded for authentication')
        } catch (error) {
          console.error('Voice upload error:', error)
          // Don't fail login if voice upload fails
        }
      }
      
      setLoading(false)
      
      // Clear form
      setVoiceRecordingUri(null)
      setEmail('')
      setPassword('')
      
      // Show success message
      Alert.alert(
        translations.success[language],
        language === "en" 
          ? `Welcome back, ${result.user.username}!` 
          : `Bienvenue, ${result.user.username} !`,
        [{ 
          text: "OK", 
          onPress: () => {
            // Navigate to home after successful sign in
            if (onSignIn) {
              onSignIn()
            }
          }
        }]
      )
      
    } catch (error: any) {
      setLoading(false)
      console.error('Login error:', error)
      Alert.alert(
        translations.error[language],
        error.message || (language === "en" 
          ? "Failed to sign in. Please check your credentials." 
          : "Échec de la connexion. Veuillez vérifier vos identifiants.")
      )
    }
  }

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(translations.permissionRequired[language], translations.microphonePermission[language])
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(recording)
      setIsRecording(true)
      setRecordingDuration(0)

      // Track recording duration
      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)

      // Stop automatically after 5 seconds
      setTimeout(() => {
        clearInterval(interval)
        stopRecording()
      }, 5000)
    } catch (err) {
      Alert.alert(translations.error[language], translations.recordingFailed[language])
      console.error("Failed to start recording", err)
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    try {
      setIsRecording(false)
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecordingDuration(0)

      if (uri) {
        setVoiceRecordingUri(uri)
        Alert.alert(translations.success[language], translations.voiceRecordedAlert[language])
      }
      
      setRecording(null)
    } catch (err) {
      Alert.alert(translations.error[language], translations.processVoiceFailed[language])
      console.error("Failed to stop recording", err)
      setRecording(null)
    }
  }

  return (
    <LinearGradient
      colors={["#0f172a", "#1e3a8a", "#0f172a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        style={{ paddingTop: insets.top }}
      >
        <View style={styles.header}>
          <Text style={styles.titleIcon}>👋</Text>
          <Text style={styles.title}>{translations.title[language]}</Text>
          <Text style={styles.subtitle}>{translations.subtitle[language]}</Text>
        </View>

        <View style={styles.form}>
          {/* Voice Authentication Block */}
          <View style={styles.voiceBlock}>
            <View style={styles.voiceHeader}>
              <Text style={styles.voiceIcon}>🎤</Text>
              <View style={styles.voiceHeaderText}>
                <Text style={styles.voiceTitle}>{translations.voiceTitle[language]}</Text>
                <Text style={styles.voiceSubtitle}>{translations.voiceSubtitle[language]}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.voiceRecordButton,
                isRecording && styles.voiceRecordButtonActive,
                voiceRecordingUri && styles.voiceRecordButtonReady,
                loading && styles.buttonDisabled,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              <Text style={styles.voiceRecordIcon}>
                {isRecording ? "⏸" : voiceRecordingUri ? "✓" : "●"}
              </Text>
              <Text style={styles.voiceRecordText}>
                {isRecording
                  ? `${translations.recording[language]}... ${recordingDuration}s`
                  : voiceRecordingUri
                  ? translations.voiceRecorded[language]
                  : (language === "en" ? "Tap to Record" : "Appuyez pour enregistrer")}
              </Text>
            </TouchableOpacity>

          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{language === "en" ? "OR USE EMAIL" : "OU UTILISER EMAIL"}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email & Password Section - Secondary Option */}
          <View style={styles.alternativeBlock}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder={translations.emailPlaceholder[language]}
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder={translations.passwordPlaceholder[language]}
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
          </View>

          {/* Single Sign In Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? translations.signingIn[language] : translations.signInButton[language]}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{translations.noAccount[language]} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.linkText}>{translations.signUpLink[language]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  titleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#0ea5e9",
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e0f2fe",
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#0369a1",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0ea5e9",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#334155",
  },
  dividerText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
  },
  voiceBlock: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  voiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  voiceIcon: {
    fontSize: 40,
  },
  voiceHeaderText: {
    flex: 1,
  },
  voiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  voiceSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  voiceRecordButton: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderWidth: 2,
    borderColor: "#0ea5e9",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
  },
  voiceRecordButtonActive: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b981",
  },
  voiceRecordButtonReady: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b981",
  },
  voiceRecordIcon: {
    fontSize: 32,
    color: "#0ea5e9",
  },
  voiceRecordText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  alternativeBlock: {
    gap: 12,
    opacity: 0.7,
  },
  secondaryButton: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderWidth: 1,
    borderColor: "#0ea5e9",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#0ea5e9",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 5,
  },
  footerText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  linkText: {
    color: "#0ea5e9",
    fontSize: 14,
    fontWeight: "600",
  },
})
