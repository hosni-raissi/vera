import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"

interface SettingsScreenProps {
  navigation: any
  onLogout: () => void
  botVariant: "bot" | "planet"
  setBotVariant: (variant: "bot" | "planet") => void
}

export default function SettingsScreen({ navigation, onLogout, botVariant, setBotVariant }: SettingsScreenProps) {
  const insets = useSafeAreaInsets()
  const [language, setLanguage] = useState<"en" | "fr">("en")

  const handleLogout = () => {
    onLogout()
    navigation.reset({
      index: 0,
      routes: [{ name: "SignIn" }],
    })
  }

  const text = {
    en: {
      title: "Settings",
      language: "Language",
      english: "English",
      french: "French",
      botVariant: "Bot Variant",
      bot: "Bot",
      planet: "Planet",
      logout: "Logout",
    },
    fr: {
      title: "Paramètres",
      language: "Langue",
      english: "Anglais",
      french: "Français",
      botVariant: "Variante du Bot",
      bot: "Bot",
      planet: "Planète",
      logout: "Déconnexion",
    },
  }

  const t = text[language]

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#0f172a"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.title}</Text>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language}</Text>
          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={[styles.optionButton, language === "en" && styles.optionButtonActive]}
              onPress={() => setLanguage("en")}
            >
              <Text style={[styles.optionButtonText, language === "en" && styles.optionButtonTextActive]}>
                {t.english}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, language === "fr" && styles.optionButtonActive]}
              onPress={() => setLanguage("fr")}
            >
              <Text style={[styles.optionButtonText, language === "fr" && styles.optionButtonTextActive]}>
                {t.french}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bot Variant Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.botVariant}</Text>
          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={[styles.optionButton, botVariant === "bot" && styles.optionButtonActive]}
              onPress={() => setBotVariant("bot")}
            >
              <Text style={[styles.optionButtonText, botVariant === "bot" && styles.optionButtonTextActive]}>
                {t.bot}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, botVariant === "planet" && styles.optionButtonActive]}
              onPress={() => setBotVariant("planet")}
            >
              <Text style={[styles.optionButtonText, botVariant === "planet" && styles.optionButtonTextActive]}>
                {t.planet}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t.logout}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: "#0ea5e9",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 12,
  },
  optionGroup: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.3)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  optionButtonActive: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderColor: "#0ea5e9",
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  optionButtonTextActive: {
    color: "#0ea5e9",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
})
