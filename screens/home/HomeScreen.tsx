"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { AnimatedBot } from "../../components/AnimatedBot"
import { Audio } from "expo-av"

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
  const [stars] = useState(() => generateStars(100))
  const shootingStarAnim = useRef(new Animated.Value(-100)).current
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current

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
    } else {
      pulseAnim.setValue(1)
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      console.log("Requesting permissions...")
      const permission = await Audio.requestPermissionsAsync()
      
      if (!permission.granted) {
        console.error("Permission to access microphone was denied")
        Alert.alert("Permission Required", "Please enable microphone permissions in your device settings")
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
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      
      setRecording(recording)
      setIsRecording(true)
      console.log("Recording started successfully")

    } catch (err) {
      console.error("Failed to start recording", err)
      Alert.alert("Recording Error", `Failed to start recording: ${err}`)
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecording(null)
      setIsRecording(false)

      console.log("Recording stopped and stored at", uri)
    } catch (err) {
      console.error("Failed to stop recording", err)
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
      <TouchableOpacity style={styles.gearButton} onPress={() => navigation.navigate("Settings")}>
        <Text style={styles.gearIcon}>⚙️</Text>
      </TouchableOpacity>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vera</Text>
          <Text style={styles.subtitle}>Your AI-powered life assistant</Text>
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
            <View style={styles.mainButtonInner}>
              <Text style={styles.mainButtonIcon}>{isRecording ? "⏹" : "🎤"}</Text>
              <Text style={styles.mainButtonText}>{isRecording ? "Stop" : "Start"}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.hintText}>Long press to open interaction</Text>
        </Animated.View>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
        )}

        {/* Spacer to push actions to bottom */}
        <View style={{ flex: 1, minHeight: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons - Always visible at bottom */}
      <View style={styles.bottomActionsContainer}>
        <TouchableOpacity style={styles.bottomActionButton} onPress={() => navigation.navigate("Dashboard")}>
          <Text style={styles.bottomActionIcon}>📊</Text>
          <Text style={styles.bottomActionText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomActionButton} onPress={() => navigation.navigate("Chat")}>
          <Text style={styles.bottomActionIcon}>💬</Text>
          <Text style={styles.bottomActionText}>Start Chat</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
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
    marginTop: 80,
  },
  hintText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 8,
    fontStyle: "italic",
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
  },
  mainButtonInner: {
    alignItems: "center",
    gap: 4,
  },
  mainButtonIcon: {
    fontSize: 32,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  recordingText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  bottomActionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
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
