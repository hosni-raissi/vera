import React, { useState, useRef, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, Alert, Modal, Dimensions, Animated, ActivityIndicator } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import * as ImagePicker from "expo-image-picker"
import { Audio } from "expo-av"
import { useLanguage } from "../../utils/LanguageContext"
import { StorageService } from "../../services/storage"

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

const ShootingStar = () => {
  const position = useRef(new Animated.ValueXY({ x: width * 0.8, y: -50 })).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = () => {
      position.setValue({ x: width * 0.8, y: -50 })
      opacity.setValue(0)

      Animated.parallel([
        Animated.timing(position, {
          toValue: { x: -100, y: height * 0.6 },
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ]).start()
    }

    animate()
    const interval = setInterval(animate, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Animated.View
      style={[
        styles.shootingStar,
        {
          transform: position.getTranslateTransform(),
          opacity,
        },
      ]}
    />
  )
}

interface SettingsScreenProps {
  navigation: any
  onLogout: () => void
  botVariant: "bot" | "planet"
  setBotVariant: (variant: "bot" | "planet") => void
}

export default function SettingsScreen({ navigation, onLogout, botVariant, setBotVariant }: SettingsScreenProps) {
  const insets = useSafeAreaInsets()
  const { language, setLanguage } = useLanguage()
  const [stars] = useState(generateStars(80))
  const shootingStarAnim = useRef(new Animated.Value(-100)).current
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [changeType, setChangeType] = useState<"email" | "password" | "photo" | "voice" | null>(null)
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [photoUri, setPhotoUri] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [voiceUri, setVoiceUri] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLogout = () => {
    onLogout()
    // Simply go back, the App.tsx will handle showing auth screen
    navigation.goBack()
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert(t.error, t.enterPasswordToDelete)
      return
    }

    Alert.alert(
      t.deleteAccountConfirm,
      t.deleteAccountWarning,
      [
        {
          text: t.cancel,
          style: "cancel"
        },
        {
          text: t.deleteAccountConfirm,
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true)
            try {
              const token = await StorageService.getToken()
              if (!token) {
                Alert.alert(t.error, "Not authenticated")
                return
              }

              const response = await fetch("http://10.208.211.170:5000/api/user/delete", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                  password: deletePassword
                })
              })

              if (response.ok) {
                Alert.alert(t.success, t.accountDeleted, [
                  {
                    text: "OK",
                    onPress: async () => {
                      await StorageService.clearAuth()
                      onLogout()
                    }
                  }
                ])
              } else {
                const error = await response.json()
                Alert.alert(t.error, error.error || t.deletionFailed)
              }
            } catch (error) {
              console.error("Delete account error:", error)
              Alert.alert(t.error, t.deletionFailed)
            } finally {
              setIsDeleting(false)
              setShowDeleteModal(false)
              setDeletePassword("")
            }
          }
        }
      ]
    )
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
      account: "Account",
      changeEmail: "Change Email",
      changeEmailDesc: "Update your email address",
      changePassword: "Change Password",
      changePasswordDesc: "Update your password",
      changePhoto: "Change Photo",
      changePhotoDesc: "Update your profile photo",
      changeVoice: "Change Voice",
      changeVoiceDesc: "Re-record your voice",
      logout: "Logout",
      deleteAccount: "Delete Account",
      deleteAccountConfirm: "Delete Account Permanently",
      deleteAccountWarning: "This will permanently delete your account, all data, and files from cloud storage. This action cannot be undone.",
      enterPasswordToDelete: "Enter your password to confirm deletion",
      accountDeleted: "Account deleted successfully",
      deletionFailed: "Failed to delete account",
      emailModal: "Change Email",
      passwordModal: "Change Password",
      photoModal: "Update Photo",
      voiceModal: "Update Voice",
      newEmail: "New Email",
      password: "Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      noPhoto: "No photo selected",
      selectPhoto: "📷 Select Photo",
      noVoice: "No voice recorded",
      startRecording: "🎤 Start Recording",
      stopRecording: "⏹ Stop Recording",
      cancel: "Cancel",
      save: "Save",
      success: "Success",
      error: "Error",
      emailError: "Please enter a valid email",
      passwordError: "Passwords do not match",
      photoError: "Please select a photo",
      voiceError: "Please record your voice",
      emailSuccess: "Email updated successfully!",
      passwordSuccess: "Password updated successfully!",
      photoSuccess: "Photo updated successfully!",
      voiceSuccess: "Voice updated successfully!",
      permissionRequired: "Permission Required",
      microphonePermission: "Microphone permission is required",
      recordingFailed: "Failed to start recording",
    },
    fr: {
      title: "Paramètres",
      language: "Langue",
      english: "Anglais",
      french: "Français",
      botVariant: "Variante du Bot",
      bot: "Bot",
      planet: "Planète",
      account: "Compte",
      changeEmail: "Changer l'e-mail",
      changeEmailDesc: "Mettre à jour votre adresse e-mail",
      changePassword: "Changer le mot de passe",
      changePasswordDesc: "Mettre à jour votre mot de passe",
      changePhoto: "Changer la photo",
      changePhotoDesc: "Mettre à jour votre photo de profil",
      changeVoice: "Changer la voix",
      changeVoiceDesc: "Réenregistrer votre voix",
      logout: "Déconnexion",
      deleteAccount: "Supprimer le compte",
      deleteAccountConfirm: "Supprimer le compte définitivement",
      deleteAccountWarning: "Cela supprimera définitivement votre compte, toutes les données et les fichiers du stockage cloud. Cette action est irréversible.",
      enterPasswordToDelete: "Entrez votre mot de passe pour confirmer la suppression",
      accountDeleted: "Compte supprimé avec succès",
      deletionFailed: "Échec de la suppression du compte",
      emailModal: "Changer l'e-mail",
      passwordModal: "Changer le mot de passe",
      photoModal: "Mettre à jour la photo",
      voiceModal: "Mettre à jour la voix",
      newEmail: "Nouvel e-mail",
      password: "Mot de passe",
      currentPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le nouveau mot de passe",
      noPhoto: "Aucune photo sélectionnée",
      selectPhoto: "📷 Sélectionner une photo",
      noVoice: "Aucune voix enregistrée",
      startRecording: "🎤 Commencer l'enregistrement",
      stopRecording: "⏹ Arrêter l'enregistrement",
      cancel: "Annuler",
      save: "Enregistrer",
      success: "Succès",
      error: "Erreur",
      emailError: "Veuillez entrer un e-mail valide",
      passwordError: "Les mots de passe ne correspondent pas",
      photoError: "Veuillez sélectionner une photo",
      voiceError: "Veuillez enregistrer votre voix",
      emailSuccess: "E-mail mis à jour avec succès !",
      passwordSuccess: "Mot de passe mis à jour avec succès !",
      photoSuccess: "Photo mise à jour avec succès !",
      voiceSuccess: "Voix mise à jour avec succès !",
      permissionRequired: "Permission requise",
      microphonePermission: "L'autorisation du microphone est requise",
      recordingFailed: "Échec de l'enregistrement",
    },
  }

  const t = text[language]

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

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    })

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert(t.permissionRequired, t.microphonePermission)
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
    } catch (err) {
      Alert.alert(t.error, t.recordingFailed)
    }
  }

  const stopRecording = async () => {
    if (!recording) return
    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setVoiceUri(uri || "")
      setRecording(null)
      setIsRecording(false)
      Alert.alert(t.success, t.voiceSuccess)
    } catch (err) {
      Alert.alert(t.error, language === "en" ? "Failed to stop recording" : "Échec de l'arrêt de l'enregistrement")
    }
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    try {
      const token = await StorageService.getToken()
      
      if (changeType === "email") {
        if (!email.trim()) {
          Alert.alert(t.error, t.emailError)
          return
        }
        
        // Update email in database
        const response = await fetch("http://10.208.211.170:5000/api/user/email", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ email: email.trim() })
        })
        
        if (!response.ok) {
          const error = await response.json()
          Alert.alert(t.error, error.error || "Failed to update email")
          return
        }
        
        Alert.alert(t.success, t.emailSuccess)
      } else if (changeType === "password") {
        if (!currentPassword || !newPassword || !confirmPassword) {
          Alert.alert(t.error, language === "en" ? "Please fill all password fields" : "Veuillez remplir tous les champs")
          return
        }
        if (newPassword !== confirmPassword) {
          Alert.alert(t.error, t.passwordError)
          return
        }
        
        // Update password in database
        const response = await fetch("http://10.208.211.170:5000/api/user/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
          })
        })
        
        if (!response.ok) {
          const error = await response.json()
          Alert.alert(t.error, error.error || "Failed to update password")
          return
        }
        
        Alert.alert(t.success, t.passwordSuccess)
      } else if (changeType === "photo") {
        if (!photoUri) {
          Alert.alert(t.error, t.photoError)
          return
        }
        
        // Upload photo to cloud storage
        const formData = new FormData()
        formData.append('photo', {
          uri: photoUri,
          type: 'image/jpeg',
          name: 'profile_photo.jpg'
        } as any)
        
        const photoResponse = await fetch("http://10.208.211.170:5000/api/user/photo", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        })
        
        if (!photoResponse.ok) {
          const error = await photoResponse.json()
          Alert.alert(t.error, error.error || "Failed to update photo")
          return
        }
        
        Alert.alert(t.success, t.photoSuccess)
      } else if (changeType === "voice") {
        if (!voiceUri) {
          Alert.alert(t.error, t.voiceError)
          return
        }
        
        // Upload voice to cloud storage
        const formData = new FormData()
        formData.append('voice', {
          uri: voiceUri,
          type: 'audio/m4a',
          name: 'profile_voice.m4a'
        } as any)
        
        const voiceResponse = await fetch("http://10.208.211.170:5000/api/user/voice", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        })
        
        if (!voiceResponse.ok) {
          const error = await voiceResponse.json()
          Alert.alert(t.error, error.error || "Failed to update voice")
          return
        }
        
        Alert.alert(t.success, t.voiceSuccess)
      }
      
      setShowChangeModal(false)
      resetForm()
    } catch (error) {
      console.error("Error saving changes:", error)
      Alert.alert(t.error, language === "en" ? "Failed to save changes" : "Échec de l'enregistrement")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPhotoUri("")
    setVoiceUri("")
    setChangeType(null)
  }

  const openChangeModal = (type: "email" | "password" | "photo" | "voice") => {
    setChangeType(type)
    setShowChangeModal(true)
  }

  return (
    <View style={styles.container}>
      {/* Animated Space Background */}
      <LinearGradient
        colors={["#0f172a", "#1e3a8a", "#0f172a"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
                { translateY: shootingStarAnim },
                { translateX: shootingStarAnim },
              ],
            },
          ]}
        />
      </LinearGradient>

      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top -30}]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >

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

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.account}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => openChangeModal("email")}>
            <Text style={styles.settingIcon}>📧</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t.changeEmail}</Text>
              <Text style={styles.settingSubtitle}>{t.changeEmailDesc}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openChangeModal("password")}>
            <Text style={styles.settingIcon}>🔒</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t.changePassword}</Text>
              <Text style={styles.settingSubtitle}>{t.changePasswordDesc}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openChangeModal("photo")}>
            <Text style={styles.settingIcon}>📷</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t.changePhoto}</Text>
              <Text style={styles.settingSubtitle}>{t.changePhotoDesc}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openChangeModal("voice")}>
            <Text style={styles.settingIcon}>🎤</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t.changeVoice}</Text>
              <Text style={styles.settingSubtitle}>{t.changeVoiceDesc}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t.logout}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteAccountButton} onPress={() => setShowDeleteModal(true)}>
            <Text style={styles.deleteAccountButtonText}>{t.deleteAccount}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Modal */}
      <Modal
        visible={showChangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowChangeModal(false)
          resetForm()
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {changeType === "email" && t.emailModal}
                {changeType === "password" && t.passwordModal}
                {changeType === "photo" && t.photoModal}
                {changeType === "voice" && t.voiceModal}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowChangeModal(false)
                  resetForm()
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {changeType === "email" && (
                <TextInput
                  style={styles.modalInput}
                  placeholder={t.newEmail}
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              {changeType === "password" && (
                <>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={t.currentPassword}
                    placeholderTextColor="#64748b"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder={t.newPassword}
                    placeholderTextColor="#64748b"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder={t.confirmPassword}
                    placeholderTextColor="#64748b"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </>
              )}

              {changeType === "photo" && (
                <View style={styles.photoSection}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.photoPlaceholderText}>{t.noPhoto}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
                    <Text style={styles.photoButtonText}>{t.selectPhoto}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {changeType === "voice" && (
                <View style={styles.voiceSection}>
                  {voiceUri ? (
                    <View style={styles.voiceIndicator}>
                      <Text style={styles.voiceIndicatorText}>✓ {language === "en" ? "Voice recorded" : "Voix enregistrée"}</Text>
                    </View>
                  ) : (
                    <View style={styles.voiceIndicator}>
                      <Text style={styles.voiceIndicatorText}>{t.noVoice}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Text style={styles.voiceButtonText}>
                      {isRecording ? t.stopRecording : t.startRecording}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowChangeModal(false)
                  resetForm()
                }}
              >
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveButton, isLoading && { opacity: 0.6 }]} 
                onPress={handleSaveChanges}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveText}>{t.save}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.deleteAccount}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowDeleteModal(false)
                  setDeletePassword("")
                }}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.deleteWarningText}>{t.deleteAccountWarning}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.enterPasswordToDelete}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t.password}
                  placeholderTextColor="#64748b"
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDeleteModal(false)
                  setDeletePassword("")
                }}
              >
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, (isDeleting || !deletePassword) && { opacity: 0.6 }]} 
                onPress={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>{t.deleteAccount}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 100,
    height: 2,
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
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
    backgroundColor: "transparent",
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  settingItem: {
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.2)",
  },
  settingIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
  },
  settingArrow: {
    fontSize: 24,
    color: "#64748b",
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  logoutButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  deleteAccountButton: {
    flex: 1,
    backgroundColor: "#991b1b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 165, 233, 0.2)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 24,
    color: "#94a3b8",
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 12,
  },
  photoSection: {
    alignItems: "center",
  },
  photoPreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 2,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: "#64748b",
  },
  photoButton: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    borderWidth: 1,
    borderColor: "#ec4899",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ec4899",
  },
  voiceSection: {
    alignItems: "center",
  },
  voiceIndicator: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  voiceIndicatorText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  voiceButton: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderWidth: 1,
    borderColor: "#a855f7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  voiceButtonRecording: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#ef4444",
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#a855f7",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(14, 165, 233, 0.2)",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    borderWidth: 1,
    borderColor: "#64748b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderWidth: 1,
    borderColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0ea5e9",
  },
  modalContent: {
    padding: 20,
  },
  deleteWarningText: {
    fontSize: 14,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#ffffff",
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
})
