"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { AnimatedBot } from "../../components/AnimatedBot"
import { Audio } from "expo-av"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useLanguage } from "../../utils/LanguageContext"

const { width, height } = Dimensions.get("window")

// Generate random stars
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.5 + 0.5,
    duration: Math.random() * 3000 + 2000,
  }))
}

const Star = ({ star }: { star: any }) => {
  const twinkleAnim = useRef(new Animated.Value(star.opacity)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, {
          toValue: 0.2,
          duration: star.duration,
          useNativeDriver: true,
        }),
        Animated.timing(twinkleAnim, {
          toValue: star.opacity,
          duration: star.duration,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          opacity: twinkleAnim,
        },
      ]}
    />
  )
}

export default function HomeScreen({ navigation, botVariant = "bot" }: any) {
  const { language } = useLanguage()
  const [stars] = useState(() => generateStars(100))
  const shootingStarAnim = useRef(new Animated.Value(-100)).current
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const voiceBar1 = useRef(new Animated.Value(8)).current
  const voiceBar2 = useRef(new Animated.Value(16)).current
  const voiceBar3 = useRef(new Animated.Value(12)).current
  const voiceBar4 = useRef(new Animated.Value(16)).current
  const voiceBar5 = useRef(new Animated.Value(8)).current
  const insets = useSafeAreaInsets()

  const translations = {
    welcome: { en: "Welcome to Vera", fr: "Bienvenue sur Vera" },
    subtitle: { en: "Your AI Life Assistant", fr: "Votre Assistant IA Personnel" },
    chat: { en: "Chat", fr: "Discuter" },
    dashboard: { en: "Dashboard", fr: "Tableau de bord" },
    settings: { en: "Settings", fr: "Paramètres" },
    interaction: { en: "Interaction", fr: "Interaction" },
    recording: { en: "Recording...", fr: "Enregistrement..." },
    tapToRecord: { en: "Tap & Hold to Record", fr: "Appuyez pour Enregistrer" },
    permissionRequired: { en: "Permission Required", fr: "Permission requise" },
    microphonePermission: { en: "Please enable microphone permissions in your device settings", fr: "Veuillez activer les autorisations du microphone dans les paramètres" },
    recordingError: { en: "Recording Error", fr: "Erreur d'enregistrement" },
    failedToRecord: { en: "Failed to start recording:", fr: "Échec de l'enregistrement :" },
    longPressHint: { en: "Long press to open interaction", fr: "Appuyez longuement pour ouvrir l'interaction" },
  }

  useEffect(() => {
    const shootingStar = () => {
      shootingStarAnim.setValue(-100)
      Animated.timing(shootingStarAnim, {
        toValue: height + 100,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(shootingStar, Math.random() * 5000 + 3000)
      })
    }
    shootingStar()
  }, [])

  useEffect(() => {
    if (isRecording) {
      // Pulse animation when recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start()

      // Voice bar animations
      const animateBar = (bar: Animated.Value, minHeight: number, maxHeight: number, duration: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: maxHeight,
              duration: duration,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: minHeight,
              duration: duration,
              useNativeDriver: false,
            }),
          ])
        ).start()
      }

      animateBar(voiceBar1, 6, 14, 300)
      animateBar(voiceBar2, 12, 20, 400)
      animateBar(voiceBar3, 8, 16, 350)
      animateBar(voiceBar4, 12, 20, 420)
      animateBar(voiceBar5, 6, 14, 330)
    } else {
      pulseAnim.setValue(1)
      voiceBar1.setValue(8)
      voiceBar2.setValue(16)
      voiceBar3.setValue(12)
      voiceBar4.setValue(16)
      voiceBar5.setValue(8)
    }
  }, [isRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch((err) => {
          console.log("Error cleaning up recording on unmount:", err)
        })
      }
    }
  }, [recording])

  const startRecording = async () => {
    try {
      // Clean up any existing recording first
      if (recording) {
        console.log("Cleaning up existing recording...")
        try {
          await recording.stopAndUnloadAsync()
        } catch (e) {
          console.log("Error cleaning up existing recording:", e)
        }
        setRecording(null)
        // Give the system time to fully release the recording
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log("Requesting permissions...")
      const permission = await Audio.requestPermissionsAsync()
      
      if (!permission.granted) {
        console.error("Permission to access microphone was denied")
        Alert.alert(translations.permissionRequired[language], translations.microphonePermission[language])
        return
      }

      console.log("Setting audio mode...")
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      })

      console.log("Creating recording...")
      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await newRecording.startAsync()
      
      setRecording(newRecording)
      setIsRecording(true)
      console.log("Recording started successfully")

    } catch (err) {
      console.error("Failed to start recording", err)
      Alert.alert(translations.recordingError[language], `${translations.failedToRecord[language]} ${err}`)
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    try {
      const uri = recording.getURI()
      await recording.stopAndUnloadAsync()
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      })
      
      console.log("Recording stopped and stored at", uri)
    } catch (err) {
      console.error("Failed to stop recording", err)
    } finally {
      // Always clean up state
      setRecording(null)
      setIsRecording(false)
    }
  }

  const handleMainButtonPress = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleLongPress = () => {
    // Open interaction screen on long press
    navigation.navigate("Interaction", {
      content: {
        type: "general",
        title: "Interaction",
      },
    })
  }

  return (
    <View style={styles.container}>
      {/* Animated Space Background */}
      <LinearGradient
        colors={["#0f172a", "#1e3a8a", "#0f172a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        {/* Stars */}
        {stars.map((star) => (
          <Star key={star.id} star={star} />
        ))}

        {/* Shooting Star */}
        <Animated.View
          style={[
            styles.shootingStar,
            {
              transform: [
                { translateX: shootingStarAnim },
                { translateY: shootingStarAnim },
              ],
            },
          ]}
        />
      </LinearGradient>
      {/* Gear Icon */}
      <TouchableOpacity
        style={[styles.gearButton, { top: insets.top + 10 }]}
        onPress={() => navigation.navigate("Settings")}
      >
        <Text style={styles.gearIcon}>⚙️</Text>
      </TouchableOpacity>

      {/* Content - Fixed Layout */}
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vera</Text>
          <Text style={styles.subtitle}>{translations.subtitle[language]}</Text>
        </View>

        {/* Animated Bot */}
        <View style={styles.botContainer}>
          <AnimatedBot variant={botVariant} />
        </View>

        {/* Main Action Button */}
        <Animated.View style={[styles.mainButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[styles.mainButton, isRecording && styles.mainButtonRecording]}
            onPress={handleMainButtonPress}
            onLongPress={handleLongPress}
            delayLongPress={500}
            activeOpacity={0.8}
          >
            <Text style={styles.mainButtonIcon}>{isRecording ? "⏸" : "🎤"}</Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>{translations.longPressHint[language]}</Text>
        </Animated.View>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.voiceWave}>
              <Animated.View style={[styles.voiceBar, { height: voiceBar1 }]} />
              <Animated.View style={[styles.voiceBar, { height: voiceBar2 }]} />
              <Animated.View style={[styles.voiceBar, { height: voiceBar3 }]} />
              <Animated.View style={[styles.voiceBar, { height: voiceBar4 }]} />
              <Animated.View style={[styles.voiceBar, { height: voiceBar5 }]} />
            </View>
            <Text style={styles.recordingText}>{translations.recording[language]}</Text>
          </View>
        )}
      </View>

      {/* Bottom Action Buttons - Always visible at bottom */}
      <View
        style={[
          styles.bottomActionsContainer,
          {
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <TouchableOpacity style={styles.bottomActionButton} onPress={() => navigation.navigate("Dashboard")}>
          <Text style={styles.bottomActionIcon}>📊</Text>
          <Text style={styles.bottomActionText}>{translations.dashboard[language]}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomActionButton} onPress={() => navigation.navigate("Chat")}>
          <Text style={styles.bottomActionIcon}>💬</Text>
          <Text style={styles.bottomActionText}>{translations.chat[language]}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gearButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  gearIcon: {
    fontSize: 24,
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 50,
  },
  shootingStar: {
    position: "absolute",
    width: 2,
    height: 60,
    backgroundColor: "#ffffff",
    borderRadius: 1,
    opacity: 0.8,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "flex-start",
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#0ea5e9",
  },
  botContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.3)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
  },
  actionDescription: {
    fontSize: 12,
    color: "#94a3b8",
  },
  mainButtonContainer: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: 70,
  },
  hintText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 8,
    fontStyle: "italic",
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    paddingBottom: 5,
    backgroundColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  mainButtonRecording: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  mainButtonInner: {
    alignItems: "center",
    gap: 4,
  },
  mainButtonIcon: {
    fontSize: 28,
  },
  mainButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  recordingDot: {
    width: 8,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  recordingText: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "600",
  },
  voiceWave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 20,
  },
  voiceBar: {
    width: 4,
    backgroundColor: "#10b981",
    borderRadius: 2,
  },
  bottomActionsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(14, 165, 233, 0.3)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  bottomActionButton: {
    flex: 1,
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomActionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  bottomActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0ea5e9",
  },
})
