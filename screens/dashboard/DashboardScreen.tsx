"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

interface DataEntry {
  id: string
  name: string
  value: string
  category: string
  date: string
}

export default function DashboardScreen({ navigation }: any) {
  const [entries, setEntries] = useState<DataEntry[]>([
    {
      id: "1",
      name: "Morning Run",
      value: "5 km",
      category: "Exercise",
      date: "Today",
    },
    {
      id: "2",
      name: "Work Session",
      value: "4 hours",
      category: "Productivity",
      date: "Today",
    },
  ])
  const [newEntry, setNewEntry] = useState("")
  const [newValue, setNewValue] = useState("")

  const handleAddEntry = () => {
    if (!newEntry.trim() || !newValue.trim()) return

    const entry: DataEntry = {
      id: Date.now().toString(),
      name: newEntry,
      value: newValue,
      category: "General",
      date: "Today",
    }

    setEntries((prev) => [entry, ...prev])
    setNewEntry("")
    setNewValue("")
  }

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const renderEntry = ({ item }: { item: DataEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryContent}>
        <Text style={styles.entryName}>{item.name}</Text>
        <Text style={styles.entryValue}>{item.value}</Text>
        <View style={styles.entryMeta}>
          <Text style={styles.categoryTag}>{item.category}</Text>
          <Text style={styles.entryDate}>{item.date}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEntry(item.id)}>
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <LinearGradient
      colors={["#0f172a", "#1e3a8a", "#0f172a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Total Activities</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Add Entry Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Add New Entry</Text>
          <TextInput
            style={styles.input}
            placeholder="Activity name"
            placeholderTextColor="#64748b"
            value={newEntry}
            onChangeText={setNewEntry}
          />
          <TextInput
            style={styles.input}
            placeholder="Value (e.g., 5 km, 2 hours)"
            placeholderTextColor="#64748b"
            value={newValue}
            onChangeText={setNewValue}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
            <Text style={styles.addButtonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Entries List */}
        <View style={styles.entriesContainer}>
          <Text style={styles.entriesTitle}>Recent Entries</Text>
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            gap={12}
          />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    color: "#0ea5e9",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.3)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0ea5e9",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  formContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#0369a1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  entriesContainer: {
    marginBottom: 20,
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  entryCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.3)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  entryValue: {
    fontSize: 12,
    color: "#0ea5e9",
    marginBottom: 6,
  },
  entryMeta: {
    flexDirection: "row",
    gap: 8,
  },
  categoryTag: {
    fontSize: 10,
    color: "#ffffff",
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entryDate: {
    fontSize: 10,
    color: "#94a3b8",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 20,
    fontWeight: "bold",
  },
})
