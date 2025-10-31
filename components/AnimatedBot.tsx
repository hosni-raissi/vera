"use client"

import { useEffect, useRef } from "react"
import { StyleSheet, Animated } from "react-native"
import Svg, { Circle, Path, Ellipse } from "react-native-svg"

interface AnimatedBotProps {
  variant?: "planet" | "bot"
}

export function AnimatedBot({ variant = "bot" }: AnimatedBotProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const bobAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      }),
    ).start()

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Bob animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [rotateAnim, pulseAnim, bobAnim])

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  const translateY = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  })

  if (variant === "planet") {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ rotate: rotation }, { translateY }, { scale: pulseAnim }],
          },
        ]}
      >
        <Svg width={200} height={200} viewBox="0 0 200 200">
          {/* Planet */}
          <Circle cx="100" cy="100" r="80" fill="#0ea5e9" opacity="0.8" />
          <Circle cx="100" cy="100" r="80" fill="url(#planetGradient)" />
          {/* Glow */}
          <Circle cx="100" cy="100" r="85" fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.3" />
        </Svg>
      </Animated.View>
    )
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale: pulseAnim }],
        },
      ]}
    >
      <Svg width={200} height={200} viewBox="0 0 200 200">
        {/* Head */}
        <Circle cx="100" cy="80" r="50" fill="#0ea5e9" opacity="0.9" />
        {/* Eyes */}
        <Circle cx="85" cy="70" r="6" fill="#ffffff" />
        <Circle cx="115" cy="70" r="6" fill="#ffffff" />
        {/* Mouth */}
        <Path d="M 85 90 Q 100 100 115 90" stroke="#ffffff" strokeWidth="3" fill="none" />
        {/* Body */}
        <Ellipse cx="100" cy="150" rx="40" ry="50" fill="#0ea5e9" opacity="0.7" />
        {/* Glow */}
        <Circle cx="100" cy="100" r="110" fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.2" />
      </Svg>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
})
