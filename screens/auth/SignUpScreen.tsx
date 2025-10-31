"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Audio } from "expo-av"
import * as ImagePicker from "expo-image-picker"
import { useLanguage } from "../../utils/LanguageContext"

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
    voiceSubtitle: { en: "Record your voice for authentication", fr: "Enregistrez votre voix pour l'authentification" },
    recording: { en: "Recording", fr: "Enregistrement" },
    startRecording: { en: "Start Recording", fr: "Commencer" },
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
        setVoiceRecordingUri(uri)
        Alert.alert(translations.success[language], translations.voiceRecordedAlert[language])
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
    // Simulate API call - send fullName, email, cin, faceImage, voiceRecordingUri to backend
    setTimeout(() => {
      setLoading(false)
      Alert.alert(
        translations.success[language], 
        language === "en" 
          ? "Account created! Your password has been sent to your email." 
          : "Compte créé ! Votre mot de passe a été envoyé à votre e-mail.",
        [{ text: "OK", onPress: () => navigation.navigate("SignIn") }]
      )
    }, 1500)
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
          <Text style={styles.title}>{translations.title[language]}</Text>
          <Text style={styles.subtitle}>{translations.subtitle[language]}</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{translations.nameLabel[language]} *</Text>
            <TextInput
              style={styles.input}
              placeholder={translations.namePlaceholder[language]}
              placeholderTextColor="#64748b"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{translations.emailLabel[language]} *</Text>
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

          {/* CIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{translations.cinLabel[language]} *</Text>
            <TextInput
              style={styles.input}
              placeholder={translations.cinPlaceholder[language]}
              placeholderTextColor="#64748b"
              value={cin}
              onChangeText={setCin}
              editable={!loading}
            />
          </View>

          {/* Face Photo Capture */}
          <View style={styles.captureSection}>
            <Text style={styles.sectionTitle}>{translations.faceTitle[language]} *</Text>
            <Text style={styles.sectionSubtitle}>
              {translations.faceSubtitle[language]}
            </Text>
            
            {faceImage ? (
              <View style={styles.previewContainer}>
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
                <Text style={styles.captureButtonIcon}>📷</Text>
                <Text style={styles.captureButtonText}>{translations.takePhoto[language]}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Voice Recording */}
          <View style={styles.captureSection}>
            <Text style={styles.sectionTitle}>{translations.voiceTitle[language]} *</Text>
            <Text style={styles.sectionSubtitle}>
              {isRecording
                ? `${translations.recording[language]}... ${recordingDuration}s`
                : voiceRecordingUri
                ? `✓ ${translations.voiceRecorded[language]}!`
                : translations.voiceSubtitle[language]}
            </Text>

            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonRecording,
                voiceRecordingUri && styles.voiceButtonReady,
                loading && styles.buttonDisabled,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              <Text style={styles.voiceButtonIcon}>
                {isRecording ? "⏹" : voiceRecordingUri ? "✓" : "🎤"}
              </Text>
              <Text style={styles.voiceButtonText}>
                {isRecording 
                  ? translations.stopRecording[language] 
                  : voiceRecordingUri 
                  ? (language === "en" ? "Re-record" : "Réenregistrer")
                  : translations.startRecording[language]}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.noteText}>
              {language === "en" 
                ? "💡 Speak clearly for 3-5 seconds" 
                : "💡 Parlez clairement pendant 3 à 5 secondes"}
            </Text>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#0ea5e9",
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
  captureSection: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  previewContainer: {
    alignItems: "center",
    gap: 12,
  },
  faceImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#10b981",
  },
  captureButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  captureButtonIcon: {
    fontSize: 32,
  },
  captureButtonText: {
    color: "#ffffff",
    fontSize: 16,
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
