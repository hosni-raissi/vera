"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Audio } from "expo-av"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function SignInScreen({ navigation, onSignIn }: any) {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [voiceRecordingUri, setVoiceRecordingUri] = useState<string | null>(null)

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
      Alert.alert("Error", "Please record your voice or enter email and password")
      return
    }
    
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      if (hasVoiceRecording) {
        // Here you would send voiceRecordingUri to your backend
        setVoiceRecordingUri(null) // Clear after successful sign in
      }
      // Navigate to home after successful sign in
      if (onSignIn) {
        onSignIn()
      }
    }, 1000)
  }

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission required", "Please grant microphone permission to use voice authentication")
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
      Alert.alert("Error", "Failed to start recording")
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
        Alert.alert("Success", "Voice recorded! Press Sign In to authenticate.")
      }
      
      setRecording(null)
    } catch (err) {
      Alert.alert("Error", "Failed to process voice recording")
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
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: insets.top, paddingBottom: insets.bottom }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Vera</Text>
          <Text style={styles.subtitle}>Your AI-powered life assistant</Text>
        </View>

        <View style={styles.form}>
          {/* Voice Authentication Section */}
          <View style={styles.voiceContainer}>
            <Text style={styles.voiceTitle}>Voice Authentication</Text>
            <Text style={styles.voiceSubtitle}>
              {isRecording
                ? `Recording... ${recordingDuration}s`
                : voiceRecordingUri
                ? "✓ Voice recorded! Press Sign In button below"
                : "Press the button to record your voice"}
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
              <View style={styles.voiceButtonInner}>
                <Text style={styles.voiceButtonIcon}>
                  {isRecording ? "⏹" : voiceRecordingUri ? "✓" : "🎤"}
                </Text>
                <Text style={styles.voiceButtonText}>
                  {isRecording ? "Stop Recording" : voiceRecordingUri ? "Voice Ready" : "Record Voice"}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.voiceNote}>
              💡 Speak clearly for 3-5 seconds for best results
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email & Password Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          {/* Single Sign In Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.linkText}>Sign Up</Text>
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
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#0ea5e9",
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
  voiceContainer: {
    alignItems: "center",
    paddingVertical: 10,
    gap: 15,
  },
  voiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  voiceSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  voiceButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 10,
    minWidth: 200,
  },
  voiceButtonRecording: {
    backgroundColor: "#ef4444",
  },
  voiceButtonReady: {
    backgroundColor: "#10b981",
  },
  voiceButtonInner: {
    alignItems: "center",
    gap: 12,
  },
  voiceButtonIcon: {
    fontSize: 48,
  },
  voiceButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  voiceNote: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 10,
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
