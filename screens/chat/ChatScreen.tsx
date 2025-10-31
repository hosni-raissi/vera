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
  Image,
  Alert,
  Dimensions,
  Animated,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from "expo-document-picker"
import { useLanguage } from "../../utils/LanguageContext"

const { width, height } = Dimensions.get("window")

// Generate random stars
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.3,
    duration: Math.random() * 3000 + 2000,
  }))
}

const Star = ({ star }: { star: any }) => {
  const twinkleAnim = useRef(new Animated.Value(star.opacity)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, {
          toValue: 0.1,
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

interface Attachment {
  type: "image" | "document"
  uri: string
  name: string
  mimeType?: string
}

interface Message {
  id: string
  text: string
  sender: "user" | "assistant"
  timestamp: Date
  attachments?: Attachment[]
}

export default function ChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const [stars] = useState(generateStars(80))
  const shootingStarAnim = useRef(new Animated.Value(-100)).current
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const translations = {
    title: { en: "Chat with Vera", fr: "Discuter avec Vera" },
    placeholder: { en: "Type a message...", fr: "Tapez un message..." },
    welcomeMessage: { en: "Hello! I'm Vera, your AI assistant. How can I help you today?", fr: "Bonjour ! Je suis Vera, votre assistante IA. Comment puis-je vous aider aujourd'hui ?" },
    attachPhoto: { en: "Photo", fr: "Photo" },
    attachFile: { en: "File", fr: "Fichier" },
    filesReceived: (count: number) => ({
      en: `I've received your ${count} file(s). I can help you analyze them!`,
      fr: `J'ai reçu vos ${count} fichier(s). Je peux vous aider à les analyser !`,
    }),
    defaultResponse: {
      en: "That's a great question! I'm here to help you with anything you need.",
      fr: "C'est une excellente question ! Je suis là pour vous aider avec tout ce dont vous avez besoin.",
    },
    error: { en: "Error", fr: "Erreur" },
    failedToPickImage: { en: "Failed to pick image", fr: "Échec de la sélection d'image" },
    failedToPickDocument: { en: "Failed to pick document", fr: "Échec de la sélection du document" },
  }

  // Shooting star animation
  useEffect(() => {
    const shootingStar = () => {
      shootingStarAnim.setValue(-100)
      Animated.timing(shootingStarAnim, {
        toValue: height + 100,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(shootingStar, Math.random() * 8000 + 5000)
      })
    }
    shootingStar()
  }, [])

  // Set initial welcome message based on language
  useEffect(() => {
    setMessages([
      {
        id: "1",
        text: translations.welcomeMessage[language],
        sender: "assistant",
        timestamp: new Date(),
      },
    ])
  }, [language])

  const handlePickImage = async () => {
    setShowAttachMenu(false)
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        setAttachments((prev) => [
          ...prev,
          {
            type: "image",
            uri: asset.uri,
            name: asset.fileName || "image.jpg",
          },
        ])
      }
    } catch (error) {
      Alert.alert(translations.error[language], translations.failedToPickImage[language])
    }
  }

  const handlePickDocument = async () => {
    setShowAttachMenu(false)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        setAttachments((prev) => [
          ...prev,
          {
            type: "document",
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType,
          },
        ])
      }
    } catch (error) {
      Alert.alert(translations.error[language], translations.failedToPickDocument[language])
    }
  }

  const handleRemoveAttachment = (uri: string) => {
    setAttachments((prev) => prev.filter((att) => att.uri !== uri))
  }

  const handleSendMessage = () => {
    if (!inputText.trim() && attachments.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setAttachments([])
    setLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: attachments.length > 0
          ? translations.filesReceived(attachments.length)[language]
          : translations.defaultResponse[language],
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
        {/* Attachments */}
        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {item.attachments.map((att, index) => (
              <View key={index} style={styles.attachmentItem}>
                {att.type === "image" ? (
                  <Image source={{ uri: att.uri }} style={styles.attachmentImage} />
                ) : (
                  <View style={styles.documentAttachment}>
                    <Text style={styles.documentIcon}>📄</Text>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {att.name}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        
        {/* Message Text */}
        {item.text && (
          <Text style={[styles.messageText, item.sender === "user" ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>
        )}
      </View>
    </View>
  )

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

      {/* Notch Area Background */}
      <View style={[styles.notchBackground, { height: insets.top }]} />

      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{translations.title[language]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messagesList, { paddingTop: insets.top }]}
          scrollEnabled={true}
          onTouchStart={() => showAttachMenu && setShowAttachMenu(false)}
        />

        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <View style={styles.attachmentPreviewContainer}>
            {attachments.map((att, index) => (
              <View key={index} style={styles.attachmentPreview}>
                {att.type === "image" ? (
                  <Image source={{ uri: att.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewDocument}>
                    <Text style={styles.previewDocumentIcon}>📄</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeAttachmentButton}
                  onPress={() => handleRemoveAttachment(att.uri)}
                >
                  <Text style={styles.removeAttachmentText}>×</Text>
                </TouchableOpacity>
                <Text style={styles.attachmentPreviewName} numberOfLines={1}>
                  {att.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Attachment Menu */}
        {showAttachMenu && (
          <View style={styles.attachMenu}>
            <TouchableOpacity style={styles.attachMenuOption} onPress={handlePickImage}>
              <View style={styles.attachMenuIconContainer}>
                <Text style={styles.attachMenuIcon}>🖼️</Text>
              </View>
              <Text style={styles.attachMenuText}>Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.attachMenuOption} onPress={handlePickDocument}>
              <View style={styles.attachMenuIconContainer}>
                <Text style={styles.attachMenuIcon}>📎</Text>
              </View>
              <Text style={styles.attachMenuText}>File</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Text style={styles.attachButtonIcon}>+</Text>
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={translations.placeholder[language]}
              placeholderTextColor="#64748b"
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={loading || (!inputText.trim() && attachments.length === 0)}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 50,
  },
  shootingStar: {
    position: "absolute",
    width: 2,
    height: 50,
    backgroundColor: "#ffffff",
    borderRadius: 1,
    opacity: 0.7,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  notchBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f172a",
    zIndex: 1,
  },
  fixedHeader: {
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  keyboardAvoid: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#0ea5e9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    marginLeft: 12,
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
    backgroundColor: "rgba(14, 165, 233, 0.9)",
  },
  assistantBubble: {
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.4)",
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
  attachmentsContainer: {
    marginBottom: 8,
    gap: 8,
  },
  attachmentItem: {
    marginBottom: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: "#1e293b",
  },
  documentAttachment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.3)",
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  documentIcon: {
    fontSize: 24,
  },
  documentName: {
    color: "#e0f2fe",
    fontSize: 12,
    flex: 1,
  },
  attachmentPreviewContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(3, 105, 161, 0.2)",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  attachmentPreview: {
    width: 70,
    alignItems: "center",
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#1e293b",
  },
  previewDocument: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewDocumentIcon: {
    fontSize: 28,
  },
  removeAttachmentButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  removeAttachmentText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  attachmentPreviewName: {
    marginTop: 4,
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
  },
  attachMenu: {
    position: "absolute",
    bottom: 70,
    left: 16,
    backgroundColor: "rgba(30, 41, 59, 0.98)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  attachMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    borderRadius: 8,
  },
  attachMenuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  attachMenuIcon: {
    fontSize: 24,
  },
  attachMenuText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "rgba(3, 105, 161, 0.2)",
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  attachButtonIcon: {
    fontSize: 28,
    color: "#0ea5e9",
    fontWeight: "300",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#0369a1",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    paddingBottom: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#64748b",
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
})
