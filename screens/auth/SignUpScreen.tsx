"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Audio } from "expo-av"
import * as ImagePicker from "expo-image-picker"
import { deleteAsync } from "expo-file-system"
import { File } from "expo-file-system/next"
import { useLanguage } from "../../utils/LanguageContext"
import { AuthService, StorageApiService } from "../../services"

export default function SignUpScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [cin, setCin] = useState("")
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [voiceRecordingUri, setVoiceRecordingUri] = useState<string | null>(null)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [loading, setLoading] = useState(false)

  const translations = {
    title: { en: "Create Account", fr: "Créer un compte" },
    subtitle: { en: "Join Vera today", fr: "Rejoignez Vera aujourd'hui" },
    nameLabel: { en: "Full Name", fr: "Nom complet" },
    namePlaceholder: { en: "Enter your full name", fr: "Entrez votre nom complet" },
    emailLabel: { en: "Email", fr: "E-mail" },
    emailPlaceholder: { en: "Enter your email", fr: "Entrez votre e-mail" },
    cinLabel: { en: "CIN", fr: "CIN" },
    cinPlaceholder: { en: "Enter your CIN number", fr: "Entrez votre numéro CIN" },
    faceTitle: { en: "Face Photo", fr: "Photo du visage" },
    faceSubtitle: { en: "Take a clear photo for verification", fr: "Prenez une photo claire pour vérification" },
    takePhoto: { en: "Take Photo", fr: "Prendre une photo" },
    retakePhoto: { en: "Retake Photo", fr: "Reprendre" },
    voiceTitle: { en: "Voice Recording", fr: "Enregistrement vocal" },
    voiceSubtitle: { en: "Speak clearly for 5 seconds", fr: "Parlez clairement pendant 5 secondes" },
    recording: { en: "Recording - SPEAK NOW", fr: "Enregistrement - PARLEZ" },
    startRecording: { en: "Tap & Speak", fr: "Appuyez et Parlez" },
    stopRecording: { en: "Stop Recording", fr: "Arrêter" },
    voiceRecorded: { en: "Voice Recorded", fr: "Voix enregistrée" },
    signUpButton: { en: "Create Account", fr: "Créer le compte" },
    creatingAccount: { en: "Creating account...", fr: "Création du compte..." },
    haveAccount: { en: "Already have an account?", fr: "Vous avez déjà un compte ?" },
    signInLink: { en: "Sign In", fr: "Se connecter" },
    success: { en: "Success", fr: "Succès" },
    accountCreated: { en: "Account created successfully!", fr: "Compte créé avec succès !" },
    error: { en: "Error", fr: "Erreur" },
    fillAllFields: { en: "Please fill all fields and complete biometric verification", fr: "Veuillez remplir tous les champs et compléter la vérification biométrique" },
    photoTaken: { en: "Photo taken successfully!", fr: "Photo prise avec succès !" },
    voiceRecordedAlert: { en: "Voice recorded successfully!", fr: "Voix enregistrée avec succès !" },
    recordingFailed: { en: "Failed to start recording", fr: "Échec de l'enregistrement" },
  }

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync()
      }
    }
  }, [recording])

  const takeFacePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") {
      Alert.alert(
        language === "en" ? "Permission required" : "Permission requise",
        language === "en" 
          ? "Please grant camera permission to capture your face" 
          : "Veuillez accorder l'autorisation de la caméra"
      )
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setFaceImage(result.assets[0].uri)
      Alert.alert(translations.success[language], translations.photoTaken[language])
    }
  }

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(
          language === "en" ? "Permission required" : "Permission requise",
          language === "en" 
            ? "Please grant microphone permission to record your voice" 
            : "Veuillez accorder l'autorisation du microphone"
        )
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

      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)

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
        // Validate voice recording file size using new FileSystem API
        try {
          const file = new File(uri)
          const fileSize = await file.size
          
          // Check if file is too small (less than 10KB indicates empty/noise recording)
          // A proper 3-5 second voice recording should be at least 10KB
          if (fileSize < 10240) {
            Alert.alert(
              translations.error[language],
              language === "en" 
                ? `Voice recording is too short (${(fileSize / 1024).toFixed(1)} KB). Please speak clearly for at least 3 seconds.` 
                : `L'enregistrement vocal est trop court (${(fileSize / 1024).toFixed(1)} KB). Veuillez parler clairement pendant au moins 3 secondes.`
            )
            // Delete the invalid file
            await deleteAsync(uri, { idempotent: true })
            setRecording(null)
            return
          }
          
          console.log(`✓ Voice recording validated: ${(fileSize / 1024).toFixed(2)} KB`)
          
          setVoiceRecordingUri(uri)
          Alert.alert(translations.success[language], translations.voiceRecordedAlert[language])
        } catch (validationError) {
          console.error("Voice validation error:", validationError)
          Alert.alert(
            translations.error[language],
            language === "en" 
              ? "Failed to validate voice recording. Please try again." 
              : "Échec de la validation de l'enregistrement vocal. Veuillez réessayer."
          )
        }
      }
      
      setRecording(null)
    } catch (err) {
      Alert.alert(
        translations.error[language],
        language === "en" ? "Failed to process voice recording" : "Échec du traitement de l'enregistrement"
      )
      console.error("Failed to stop recording", err)
      setRecording(null)
    }
  }

  const handleSignUp = async () => {
    // Validate required fields
    if (!fullName.trim() || !email.trim() || !cin.trim()) {
      Alert.alert(
        translations.error[language],
        language === "en" ? "Please fill in all required fields" : "Veuillez remplir tous les champs requis"
      )
      return
    }
    if (!faceImage) {
      Alert.alert(
        translations.error[language],
        language === "en" ? "Please capture your face photo" : "Veuillez prendre votre photo"
      )
      return
    }
    if (!voiceRecordingUri) {
      Alert.alert(
        translations.error[language],
        language === "en" ? "Please record your voice" : "Veuillez enregistrer votre voix"
      )
      return
    }
    
    setLoading(true)
    
    try {
      // Step 1: Register user account WITH voice validation
      const registerResult = await AuthService.register({
        email: email.trim().toLowerCase(),
        username: fullName.trim(),
        cin: cin.trim(),
        voiceRecording: voiceRecordingUri, // NEW: Send voice for validation during registration
      })

      console.log('User registered:', registerResult)

      // Step 2: Upload biometric data to user's MEGA folder
      if (registerResult.user) {
        const userId = registerResult.user.id.toString()
        
        // Upload face image
        try {
          await StorageApiService.uploadFaceImage(faceImage, userId)
          console.log('Face image uploaded successfully')
          
          // Clean up temporary face image file from device storage
          try {
            await deleteAsync(faceImage, { idempotent: true })
            console.log('Temporary face image deleted from device')
          } catch (cleanupError) {
            console.log('Could not delete temporary face image:', cleanupError)
          }
          
          setFaceImage(null)
        } catch (error) {
          console.error('Face image upload error:', error)
          // Continue even if face upload fails
        }

        // Upload voice recording
        try {
          await StorageApiService.uploadVoiceRecording(voiceRecordingUri, userId)
          console.log('Voice recording uploaded successfully')
          
          // Clean up temporary voice recording file from device storage
          try {
            await deleteAsync(voiceRecordingUri, { idempotent: true })
            console.log('Temporary voice recording deleted from device')
          } catch (cleanupError) {
            console.log('Could not delete temporary voice recording:', cleanupError)
          }
          
          setVoiceRecordingUri(null)
        } catch (error) {
          console.error('Voice recording upload error:', error)
          // Continue even if voice upload fails
        }
      }

      setLoading(false)
      
      // Success!
      Alert.alert(
        translations.success[language], 
        language === "en" 
          ? `Account created successfully!\nYour data is stored securely in cloud.\nYou can now sign in.` 
          : `Compte créé avec succès !\nVos données sont stockées en toute sécurité dans cloud.\nVous pouvez maintenant vous connecter.`,
        [{ 
          text: "OK", 
          onPress: () => navigation.navigate("SignIn") 
        }]
      )
    } catch (error: any) {
      setLoading(false)
      console.error('Registration error:', error)
      Alert.alert(
        translations.error[language],
        error.message || (language === "en" 
          ? "Failed to create account. Please try again." 
          : "Échec de la création du compte. Veuillez réessayer.")
      )
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
          <Text style={styles.titleIcon}>🚀</Text>
          <Text style={styles.title}>{translations.title[language]}</Text>
          <Text style={styles.subtitle}>{translations.subtitle[language]}</Text>
        </View>

        <View style={styles.form}>
          {/* Basic Info Block */}
          <View style={styles.infoBlock}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockIcon}>📝</Text>
              <Text style={styles.blockTitle}>{language === "en" ? "Basic Information" : "Informations de base"}</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder={translations.namePlaceholder[language]}
                placeholderTextColor="#64748b"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />
            </View>

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
                placeholder={translations.cinPlaceholder[language]}
                placeholderTextColor="#64748b"
                value={cin}
                onChangeText={setCin}
                editable={!loading}
              />
            </View>
          </View>

          {/* Biometric Block */}
          <View style={styles.biometricBlock}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockIcon}>🔐</Text>
              <Text style={styles.blockTitle}>{language === "en" ? "Biometric Authentication" : "Authentification biométrique"}</Text>
            </View>

            {/* Face Photo */}
            <View style={styles.biometricItem}>
              <View style={styles.biometricHeader}>
                <Text style={styles.biometricIcon}>📷</Text>
                <View style={styles.biometricText}>
                  <Text style={styles.biometricTitle}>{translations.faceTitle[language]}</Text>
                  <Text style={styles.biometricSubtitle}>{translations.faceSubtitle[language]}</Text>
                </View>
              </View>
              
              {faceImage ? (
                <View style={styles.capturedPreview}>
                  <Image source={{ uri: faceImage }} style={styles.faceImage} />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={takeFacePhoto}
                    disabled={loading}
                  >
                    <Text style={styles.retakeButtonText}>{translations.retakePhoto[language]}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.captureButton, loading && styles.buttonDisabled]}
                  onPress={takeFacePhoto}
                  disabled={loading}
                >
                  <Text style={styles.captureButtonText}>{translations.takePhoto[language]}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Voice Recording */}
            <View style={[styles.biometricItem, { borderBottomWidth: 0 }]}>
              <View style={styles.biometricHeader}>
                <Text style={styles.biometricIcon}>🎤</Text>
                <View style={styles.biometricText}>
                  <Text style={styles.biometricTitle}>{translations.voiceTitle[language]}</Text>
                  <Text style={styles.biometricSubtitle}>
                    {isRecording
                      ? `${translations.recording[language]}... ${recordingDuration}s`
                      : voiceRecordingUri
                      ? `✓ ${translations.voiceRecorded[language]}`
                      : translations.voiceSubtitle[language]}
                  </Text>
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
                    ? translations.stopRecording[language] 
                    : voiceRecordingUri 
                    ? (language === "en" ? "Voice Ready" : "Voix prête")
                    : (language === "en" ? "Tap to Record" : "Appuyez pour enregistrer")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Note */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🔐</Text>
            <Text style={styles.infoText}>
              {language === "en" 
                ? "Your password will be automatically generated and sent to your email" 
                : "Votre mot de passe sera automatiquement généré et envoyé à votre e-mail"}
            </Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? translations.creatingAccount[language] : translations.signUpButton[language]}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{translations.haveAccount[language]} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Text style={styles.linkText}>{translations.signInLink[language]}</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
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
    gap: 16,
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
  infoBlock: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  biometricBlock: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  blockIcon: {
    fontSize: 28,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  biometricItem: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  biometricHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  biometricIcon: {
    fontSize: 24,
  },
  biometricText: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  biometricSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  capturedPreview: {
    alignItems: "center",
    gap: 12,
  },
  faceImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#10b981",
  },
  captureButton: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderWidth: 2,
    borderColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  captureButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  voiceRecordButton: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderWidth: 2,
    borderColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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
    fontSize: 24,
    color: "#0ea5e9",
  },
  voiceRecordText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  retakeButton: {
    backgroundColor: "#475569",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retakeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  voiceButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  voiceButtonRecording: {
    backgroundColor: "#ef4444",
  },
  voiceButtonReady: {
    backgroundColor: "#10b981",
  },
  voiceButtonIcon: {
    fontSize: 32,
  },
  voiceButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
  },
  infoBox: {
    backgroundColor: "#1e40af",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#e0f2fe",
    lineHeight: 18,
  },
  button: {
    backgroundColor: "#0ea5e9",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
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
