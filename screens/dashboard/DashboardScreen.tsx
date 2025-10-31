"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, Dimensions, Animated, Image, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
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

type CredentialType = "clothing" | "card" | "email" | "phone" | "personal" | "location"

interface ClothingItem {
  imageUri: string
  name: string
  category: string
}

interface CreditCard {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cvv: string
}

interface LocationData {
  address: string
  latitude: number
  longitude: number
  label: string
}

interface Credential {
  id: string
  type: CredentialType
  title: string
  data: ClothingItem | CreditCard | LocationData | string | string[]
  createdAt: Date
}

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const [stars] = useState(() => generateStars(80))
  const shootingStarAnim = useRef(new Animated.Value(-100)).current
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedType, setSelectedType] = useState<CredentialType | null>(null)

  const translations = {
    title: { en: "My Vault", fr: "Mon Coffre" },
    emptyVault: { en: "Your vault is empty", fr: "Votre coffre est vide" },
    addFirst: { en: "Add your first credential", fr: "Ajoutez vos premières informations" },
    addCredentials: { en: "Add Credentials", fr: "Ajouter des informations" },
    myCredentials: { en: "My Credentials", fr: "Mes informations" },
    deleteTitle: { en: "Delete Credential", fr: "Supprimer" },
    deleteMessage: { en: "Are you sure you want to delete this item?", fr: "Voulez-vous vraiment supprimer cet élément ?" },
    cancel: { en: "Cancel", fr: "Annuler" },
    delete: { en: "Delete", fr: "Supprimer" },
    clothing: { en: "👕 Clothing", fr: "👕 Vêtements" },
    creditCard: { en: "💳 Credit Card", fr: "💳 Carte bancaire" },
    email: { en: "📧 Email", fr: "📧 E-mail" },
    phone: { en: "📱 Phone", fr: "📱 Téléphone" },
    location: { en: "📍 Location", fr: "📍 Localisation" },
    personal: { en: "👤 Personal", fr: "👤 Personnel" },
    addClothing: { en: "Add Clothing", fr: "Ajouter des vêtements" },
    addCard: { en: "Add Credit Card", fr: "Ajouter une carte" },
    addEmail: { en: "Add Email", fr: "Ajouter un e-mail" },
    addPhone: { en: "Add Phone", fr: "Ajouter un téléphone" },
    addLocation: { en: "Add Location", fr: "Ajouter une localisation" },
    addPersonal: { en: "Add Personal Info", fr: "Ajouter des infos" },
    clothingName: { en: "Clothing Name", fr: "Nom du vêtement" },
    category: { en: "Category (e.g., Shirt, Pants)", fr: "Catégorie (ex: Chemise, Pantalon)" },
    selectPhoto: { en: "Select Photo", fr: "Sélectionner une photo" },
    cardNumber: { en: "Card Number", fr: "Numéro de carte" },
    cardHolder: { en: "Card Holder Name", fr: "Nom du titulaire" },
    expiryDate: { en: "Expiry Date (MM/YY)", fr: "Date d'expiration (MM/AA)" },
    cvv: { en: "CVV", fr: "CVV" },
    emailAddress: { en: "Email Address", fr: "Adresse e-mail" },
    phoneNumber: { en: "Phone Number", fr: "Numéro de téléphone" },
    locationLabel: { en: "Location Label", fr: "Libellé" },
    captureLocation: { en: "Capture Current Location", fr: "Capturer ma position" },
    capturingLocation: { en: "Capturing location...", fr: "Capture en cours..." },
    locationCaptured: { en: "Location Captured!", fr: "Position capturée !" },
    personalInfo: { en: "Personal Information", fr: "Information personnelle" },
    myLocation: { en: "My Location", fr: "Ma position" },
    save: { en: "Save", fr: "Enregistrer" },
    permissionDenied: { en: "Permission Denied", fr: "Permission refusée" },
    locationPermission: { en: "Location permission is required to use this feature", fr: "L'autorisation de localisation est requise" },
    error: { en: "Error", fr: "Erreur" },
    enterTitle: { en: "Please enter a title", fr: "Veuillez saisir un titre" },
    pleaseSelectImage: { en: "Please select an image", fr: "Veuillez sélectionner une image" },
    fillAllCardDetails: { en: "Please fill all card details", fr: "Veuillez remplir tous les détails de la carte" },
    enterEmail: { en: "Please enter an email", fr: "Veuillez saisir un e-mail" },
    enterPhone: { en: "Please enter a phone number", fr: "Veuillez saisir un numéro de téléphone" },
    captureLocationFirst: { en: "Please capture your location first", fr: "Veuillez d'abord capturer votre position" },
    inputTitle: { en: "Title", fr: "Titre" },
    selectClothingImage: { en: "📷 Select Clothing Image", fr: "📷 Sélectionner une photo" },
    locationLabelPlaceholder: { en: "Location Label (e.g., Home, Work)", fr: "Libellé (ex: Maison, Travail)" },
    getCurrentLocation: { en: "Get Current Location", fr: "Obtenir ma position" },
    locationCapturedCheck: { en: "Location Captured ✓", fr: "Position capturée ✓" },
    capturedAddress: { en: "Captured Address:", fr: "Adresse capturée :" },
    add: { en: "Add", fr: "Ajouter" },
    success: { en: "Success", fr: "Succès" },
    locationCapturedSuccess: { en: "Location captured successfully!", fr: "Position capturée avec succès !" },
    failedToGetLocation: { en: "Failed to get location", fr: "Échec de la capture de position" },
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

  const getTypeIcon = (type: CredentialType) => {
    switch (type) {
      case "clothing": return "👕"
      case "card": return "💳"
      case "email": return "📧"
      case "phone": return "📱"
      case "personal": return "👤"
      case "location": return "📍"
    }
  }

  const getTypeColor = (type: CredentialType) => {
    switch (type) {
      case "clothing": return "rgba(236, 72, 153, 0.2)"
      case "card": return "rgba(34, 197, 94, 0.2)"
      case "email": return "rgba(59, 130, 246, 0.2)"
      case "phone": return "rgba(168, 85, 247, 0.2)"
      case "personal": return "rgba(251, 146, 60, 0.2)"
      case "location": return "rgba(239, 68, 68, 0.2)"
    }
  }

  const handleAddCredential = (type: CredentialType) => {
    setSelectedType(type)
    setShowAddModal(true)
  }

  const handleDeleteCredential = (id: string) => {
    Alert.alert(
      translations.deleteTitle[language],
      translations.deleteMessage[language],
      [
        { text: translations.cancel[language], style: "cancel" },
        { 
          text: translations.delete[language], 
          style: "destructive",
          onPress: () => setCredentials(prev => prev.filter(c => c.id !== id))
        },
      ]
    )
  }

  const renderCredentialCard = (item: Credential) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.credentialCard, { backgroundColor: getTypeColor(item.type) }]}
      onLongPress={() => handleDeleteCredential(item.id)}
    >
      <View style={styles.credentialHeader}>
        <Text style={styles.credentialIcon}>{getTypeIcon(item.type)}</Text>
        <View style={styles.credentialTitleContainer}>
          <Text style={styles.credentialTitle}>{item.title}</Text>
          <Text style={styles.credentialType}>{item.type}</Text>
        </View>
      </View>
      
      {item.type === "clothing" && typeof item.data === "object" && "imageUri" in item.data && (
        <Image source={{ uri: item.data.imageUri }} style={styles.clothingImage} />
      )}
      
      {item.type === "card" && typeof item.data === "object" && "cardNumber" in item.data && (
        <View style={styles.cardPreview}>
          <Text style={styles.cardNumber}>•••• •••• •••• {item.data.cardNumber.slice(-4)}</Text>
          <Text style={styles.cardHolder}>{item.data.cardHolder}</Text>
        </View>
      )}
      
      {(item.type === "email" || item.type === "phone") && typeof item.data === "string" && (
        <Text style={styles.credentialValue}>{item.data}</Text>
      )}
      
      {item.type === "location" && typeof item.data === "object" && "address" in item.data && (
        <View style={styles.locationPreview}>
          <Text style={styles.locationLabel}>{item.data.label}</Text>
          <Text style={styles.locationAddress}>{item.data.address}</Text>
          <Text style={styles.locationCoords}>
            📍 {item.data.latitude.toFixed(4)}, {item.data.longitude.toFixed(4)}
          </Text>
        </View>
      )}
      
      {item.type === "personal" && (
        <Text style={styles.credentialValue} numberOfLines={2}>{translations.personalInfo[language]}</Text>
      )}
    </TouchableOpacity>
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{credentials.length}</Text>
            <Text style={styles.statLabel}>{language === "en" ? "Total Items" : "Total"}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{credentials.filter(c => c.type === "card").length}</Text>
            <Text style={styles.statLabel}>{language === "en" ? "Cards" : "Cartes"}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{credentials.filter(c => c.type === "clothing").length}</Text>
            <Text style={styles.statLabel}>{language === "en" ? "Clothes" : "Vêtements"}</Text>
          </View>
        </View>

        {/* Add Buttons */}
        <View style={styles.addButtonsContainer}>
          <Text style={styles.sectionTitle}>{translations.addCredentials[language]}</Text>
          <View style={styles.addButtonsGrid}>
            <TouchableOpacity
              style={styles.addTypeButton}
              onPress={() => handleAddCredential("clothing")}
            >
              <Text style={styles.addTypeIcon}>👕</Text>
              <Text style={styles.addTypeText}>{language === "en" ? "Clothing" : "Vêtements"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addTypeButton}
              onPress={() => handleAddCredential("card")}
            >
              <Text style={styles.addTypeIcon}>💳</Text>
              <Text style={styles.addTypeText}>{language === "en" ? "Card" : "Carte"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addTypeButton}
              onPress={() => handleAddCredential("email")}
            >
              <Text style={styles.addTypeIcon}>📧</Text>
              <Text style={styles.addTypeText}>{language === "en" ? "Email" : "E-mail"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addTypeButton}
              onPress={() => handleAddCredential("phone")}
            >
              <Text style={styles.addTypeIcon}>📱</Text>
              <Text style={styles.addTypeText}>{language === "en" ? "Phone" : "Téléphone"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addTypeButton}
              onPress={() => handleAddCredential("location")}
            >
              <Text style={styles.addTypeIcon}>📍</Text>
              <Text style={styles.addTypeText}>{language === "en" ? "Location" : "Position"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addTypeButton}
              onPress={() => handleAddCredential("personal")}
            >
              <Text style={styles.addTypeIcon}>👤</Text>
              <Text style={styles.addTypeText}>{language === "en" ? "Personal" : "Personnel"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Credentials List */}
        {credentials.length > 0 && (
          <View style={styles.credentialsSection}>
            <Text style={styles.sectionTitle}>{translations.myCredentials[language]}</Text>
            <View style={styles.credentialsGrid}>
              {credentials.map(renderCredentialCard)}
            </View>
          </View>
        )}

        {credentials.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔐</Text>
            <Text style={styles.emptyText}>{translations.emptyVault[language]}</Text>
            <Text style={styles.emptySubtext}>{translations.addFirst[language]}</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <AddCredentialModal
        visible={showAddModal}
        type={selectedType}
        onClose={() => {
          setShowAddModal(false)
          setSelectedType(null)
        }}
        onAdd={(credential) => {
          setCredentials(prev => [credential, ...prev])
          setShowAddModal(false)
          setSelectedType(null)
        }}
        translations={translations}
        language={language}
      />
    </View>
  )
}

// Add Credential Modal Component
function AddCredentialModal({
  visible,
  type,
  onClose,
  onAdd,
  translations,
  language,
}: {
  visible: boolean
  type: CredentialType | null
  onClose: () => void
  onAdd: (credential: Credential) => void
  translations: any
  language: string
}) {
  const [title, setTitle] = useState("")
  const [imageUri, setImageUri] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(translations.permissionDenied[language], translations.locationPermission[language])
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      // Reverse geocoding to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      if (geocode[0]) {
        const addr = `${geocode[0].street || ""}, ${geocode[0].city || ""}, ${geocode[0].region || ""}, ${geocode[0].country || ""}`
        setAddress(addr.trim())
      }

      Alert.alert(translations.success[language], translations.locationCapturedSuccess[language])
    } catch (error) {
      Alert.alert(translations.error[language], translations.failedToGetLocation[language])
    }
  }

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    })

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert(translations.error[language], translations.enterTitle[language])
      return
    }

    let data: any = {}

    if (type === "clothing") {
      if (!imageUri) {
        Alert.alert(translations.error[language], translations.pleaseSelectImage[language])
        return
      }
      data = { imageUri, name: title, category: "General" }
    } else if (type === "card") {
      if (!cardNumber || !cardHolder) {
        Alert.alert(translations.error[language], translations.fillAllCardDetails[language])
        return
      }
      data = { cardNumber, cardHolder, expiryDate, cvv }
    } else if (type === "email") {
      if (!email) {
        Alert.alert(translations.error[language], translations.enterEmail[language])
        return
      }
      data = email
    } else if (type === "phone") {
      if (!phone) {
        Alert.alert(translations.error[language], translations.enterPhone[language])
        return
      }
      data = phone
    } else if (type === "location") {
      if (!currentLocation || !address) {
        Alert.alert(translations.error[language], translations.captureLocationFirst[language])
        return
      }
      data = {
        address,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        label: locationLabel || "My Location",
      }
    }

    const credential: Credential = {
      id: Date.now().toString(),
      type: type!,
      title,
      data,
      createdAt: new Date(),
    }

    onAdd(credential)
    resetForm()
  }

  const resetForm = () => {
    setTitle("")
    setImageUri("")
    setCardNumber("")
    setCardHolder("")
    setExpiryDate("")
    setCvv("")
    setEmail("")
    setPhone("")
    setAddress("")
    setLocationLabel("")
    setCurrentLocation(null)
  }

  if (!type) return null

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {type === "clothing" && translations.addClothing[language]}
              {type === "card" && translations.addCard[language]}
              {type === "email" && translations.addEmail[language]}
              {type === "phone" && translations.addPhone[language]}
              {type === "location" && translations.addLocation[language]}
              {type === "personal" && translations.addPersonal[language]}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <TextInput
              style={styles.modalInput}
              placeholder={translations.inputTitle[language]}
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />

            {type === "clothing" && (
              <>
                <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  ) : (
                    <Text style={styles.imagePickerText}>{translations.selectClothingImage[language]}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {type === "card" && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder={translations.cardNumber[language]}
                  placeholderTextColor="#64748b"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  maxLength={16}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder={translations.cardHolder[language]}
                  placeholderTextColor="#64748b"
                  value={cardHolder}
                  onChangeText={setCardHolder}
                />
                <View style={styles.modalRow}>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputHalf]}
                    placeholder={translations.expiryDate[language]}
                    placeholderTextColor="#64748b"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    maxLength={5}
                  />
                  <TextInput
                    style={[styles.modalInput, styles.modalInputHalf]}
                    placeholder={translations.cvv[language]}
                    placeholderTextColor="#64748b"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </>
            )}

            {type === "email" && (
              <TextInput
                style={styles.modalInput}
                placeholder={translations.emailAddress[language]}
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}

            {type === "phone" && (
              <TextInput
                style={styles.modalInput}
                placeholder={translations.phoneNumber[language]}
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            )}

            {type === "location" && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder={translations.locationLabelPlaceholder[language]}
                  placeholderTextColor="#64748b"
                  value={locationLabel}
                  onChangeText={setLocationLabel}
                />
                <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation}>
                  <Text style={styles.locationButtonIcon}>📍</Text>
                  <Text style={styles.locationButtonText}>
                    {currentLocation ? translations.locationCapturedCheck[language] : translations.getCurrentLocation[language]}
                  </Text>
                </TouchableOpacity>
                {address && (
                  <View style={styles.locationCaptured}>
                    <Text style={styles.locationCapturedLabel}>{translations.capturedAddress[language]}</Text>
                    <Text style={styles.locationCapturedText}>{address}</Text>
                    {currentLocation && (
                      <Text style={styles.locationCapturedCoords}>
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{translations.cancel[language]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{translations.save[language]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0ea5e9",
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  addButtonsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  addButtonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  addTypeButton: {
    width: (width - 64) / 3,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  addTypeIcon: {
    fontSize: 32,
  },
  addTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  credentialsSection: {
    marginBottom: 24,
  },
  credentialsGrid: {
    gap: 12,
  },
  credentialCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  credentialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  credentialIcon: {
    fontSize: 32,
  },
  credentialTitleContainer: {
    flex: 1,
  },
  credentialTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  credentialType: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  clothingImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  cardPreview: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 2,
  },
  cardHolder: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
  },
  credentialValue: {
    fontSize: 14,
    color: "#e0f2fe",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
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
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "capitalize",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#ef4444",
    fontWeight: "300",
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#0369a1",
    borderRadius: 12,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalInputHalf: {
    flex: 1,
  },
  imagePickerButton: {
    height: 200,
    backgroundColor: "#0f172a",
    borderWidth: 2,
    borderColor: "#0369a1",
    borderRadius: 12,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  imagePickerText: {
    fontSize: 16,
    color: "#64748b",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(14, 165, 233, 0.2)",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  locationPreview: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0ea5e9",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: "#94a3b8",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  locationButtonIcon: {
    fontSize: 24,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  locationCaptured: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    borderRadius: 12,
    padding: 12,
  },
  locationCapturedLabel: {
    fontSize: 12,
    color: "#22c55e",
    fontWeight: "600",
    marginBottom: 4,
  },
  locationCapturedText: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 4,
  },
  locationCapturedCoords: {
    fontSize: 12,
    color: "#94a3b8",
  },
})
