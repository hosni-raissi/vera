"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"

interface Message {
  id: string
  text: string
  sender: "user" | "assistant"
  timestamp: Date
}

export default function ChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Vera, your AI assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "That's a great question! I'm here to help you with anything you need.",
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setLoading(false)
    }, 1000)
  }

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.sender === "user" ? styles.userMessage : styles.assistantMessage]}>
      <View style={[styles.messageBubble, item.sender === "user" ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, item.sender === "user" ? styles.userText : styles.assistantText]}>
          {item.text}
        </Text>
      </View>
    </View>
  )

  return (
    <LinearGradient
      colors={["#0f172a", "#1e3a8a", "#0f172a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat with Vera</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          scrollEnabled={true}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={loading || !inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(3, 105, 161, 0.2)",
  },
  backButton: {
    color: "#0ea5e9",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: "row",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  assistantMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: "#0ea5e9",
  },
  assistantBubble: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.3)",
  },
  messageText: {
    fontSize: 14,
  },
  userText: {
    color: "#ffffff",
  },
  assistantText: {
    color: "#e0f2fe",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(3, 105, 161, 0.2)",
  },
  input: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#0369a1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
})
