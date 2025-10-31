"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Audio } from "expo-av"
import * as ImagePicker from "expo-image-picker"

export default function SignUpScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [cin, setCin] = useState("")
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [voiceRecordingUri, setVoiceRecordingUri] = useState<string | null>(null)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [loading, setLoading] = useState(false)

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
      Alert.alert("Permission required", "Please grant camera permission to capture your face")
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
      Alert.alert("Success", "Face photo captured!")
    }
  }

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission required", "Please grant microphone permission to record your voice")
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
        Alert.alert("Success", "Voice recorded!")
      }
      
      setRecording(null)
    } catch (err) {
      Alert.alert("Error", "Failed to process voice recording")
      console.error("Failed to stop recording", err)
      setRecording(null)
    }
  }

  const handleSignUp = async () => {
    if (!fullName || !email || !cin) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }
    if (!faceImage) {
      Alert.alert("Error", "Please capture your face photo")
      return
    }
    if (!voiceRecordingUri) {
      Alert.alert("Error", "Please record your voice")
      return
    }
    
    setLoading(true)
    // Simulate API call - send fullName, email, cin, faceImage, voiceRecordingUri to backend
    setTimeout(() => {
      setLoading(false)
      Alert.alert(
        "Success", 
        "Account created! Your password has been sent to your email.",
        [{ text: "OK", onPress: () => navigation.navigate("SignIn") }]
      )
    }, 2000)
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Vera today</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#64748b"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
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

          {/* CIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CIN (National ID) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your CIN"
              placeholderTextColor="#64748b"
              value={cin}
              onChangeText={setCin}
              editable={!loading}
            />
          </View>

          {/* Face Photo Capture */}
          <View style={styles.captureSection}>
            <Text style={styles.sectionTitle}>Face Recognition *</Text>
            <Text style={styles.sectionSubtitle}>
              Take a photo of your face for secure authentication
            </Text>
            
            {faceImage ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: faceImage }} style={styles.faceImage} />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={takeFacePhoto}
                  disabled={loading}
                >
                  <Text style={styles.retakeButtonText}>Retake Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.captureButton, loading && styles.buttonDisabled]}
                onPress={takeFacePhoto}
                disabled={loading}
              >
                <Text style={styles.captureButtonIcon}>📷</Text>
                <Text style={styles.captureButtonText}>Capture Face Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Voice Recording */}
          <View style={styles.captureSection}>
            <Text style={styles.sectionTitle}>Voice Recognition *</Text>
            <Text style={styles.sectionSubtitle}>
              {isRecording
                ? `Recording... ${recordingDuration}s`
                : voiceRecordingUri
                ? "✓ Voice recorded!"
                : "Record your voice for authentication"}
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
                {isRecording ? "Stop Recording" : voiceRecordingUri ? "Re-record" : "Record Voice"}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.noteText}>
              💡 Speak clearly for 3-5 seconds
            </Text>
          </View>

          {/* Password Note */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🔐</Text>
            <Text style={styles.infoText}>
              Your password will be automatically generated and sent to your email
            </Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Text style={styles.linkText}>Sign In</Text>
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
