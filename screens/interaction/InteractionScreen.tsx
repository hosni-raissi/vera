import React from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface InteractionScreenProps {
  navigation: any
  content?: {
    type: "graph" | "search" | "analysis" | "general"
    title?: string
    data?: any
  }
}

export default function InteractionScreen({ navigation, content }: InteractionScreenProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f172a", "#1e3a8a", "#0f172a"]}
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
          <Text style={styles.title}>{content?.title || "Interaction"}</Text>
        </View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📊</Text>
            <Text style={styles.placeholderText}>
              {content?.type === "graph"
                ? "Graph and Analytics will appear here"
                : content?.type === "search"
                ? "Search results will appear here"
                : content?.type === "analysis"
                ? "Analysis results will appear here"
                : "Interactive content will appear here"}
            </Text>
            <Text style={styles.placeholderSubtext}>
              Vera can display graphs, charts, search results, and other interactive content in this space.
            </Text>
          </View>

          {/* Example Content Cards */}
          <View style={styles.exampleSection}>
            <Text style={styles.sectionTitle}>What Vera can show here:</Text>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📈</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Analytics & Graphs</Text>
                <Text style={styles.featureDescription}>Visual data representations and statistics</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🔍</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Search Results</Text>
                <Text style={styles.featureDescription}>Information searches and web results</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🧠</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>AI Analysis</Text>
                <Text style={styles.featureDescription}>Deep insights and recommendations</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📋</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Lists & Tables</Text>
                <Text style={styles.featureDescription}>Organized data and information</Text>
              </View>
            </View>
          </View>
        </View>
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
    marginBottom: 30,
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
  contentContainer: {
    flex: 1,
  },
  placeholderContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 2,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 30,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  exampleSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 8,
  },
  featureCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: "#94a3b8",
  },
})
