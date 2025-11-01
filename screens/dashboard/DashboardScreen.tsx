"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, Dimensions, Animated, Image, Alert, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import { useLanguage } from "../../utils/LanguageContext"
import CredentialsService from "../../services/credentialsService"
import ClothesService from "../../services/clothesService"

// Component to load and display images from MEGA
const MegaImage = ({ fileId, style }: { fileId: string; style: any }) => {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadImage = async () => {
      try {
        const uri = await ClothesService.getImageUrl(fileId)
        setImageUri(uri)
      } catch (error) {
        console.error('Error loading MEGA image:', error)
      } finally {
        setLoading(false)
      }
    }
    loadImage()
  }, [fileId])

  if (loading) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#333' }]}>
        <ActivityIndicator color="#fff" />
      </View>
    )
  }

  if (!imageUri) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#333' }]}>
        <Text style={{ fontSize: 40 }}>👕</Text>
      </View>
    )
  }

  return <Image source={{ uri: imageUri }} style={style} />
}


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

interface PersonalInfo {
  name: string
  details: string
  imageUri?: string
}

interface Credential {
  id: string
  type: CredentialType
  title: string
  data: ClothingItem | CreditCard | LocationData | PersonalInfo | string | string[]
  createdAt: Date
}

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const [stars] = useState(() => generateStars(80))
  const shootingStarAnim = useRef(new Animated.Value(-100)).current
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedType, setSelectedType] = useState<CredentialType | null>(null)
  // Location state for auto-capture
  const [initialLocationData, setInitialLocationData] = useState<{
    address: string
    latitude: number
    longitude: number
  } | null>(null)
  // Current location that updates every 3 minutes
  const [autoCurrentLocation, setAutoCurrentLocation] = useState<LocationData | null>(null)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ latitude: number; longitude: number } | null>(null)

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

  // Function to update current location
  const updateCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      // Check if permission already granted
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync()
      
      if (currentStatus !== "granted") {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          console.log("Location permission not granted")
          setLocationPermissionGranted(false)
          return null
        }
        setLocationPermissionGranted(true)
      } else {
        setLocationPermissionGranted(true)
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      // Reverse geocoding to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      let address = "Unknown Location"
      if (geocode[0]) {
        address = `${geocode[0].street || ""}, ${geocode[0].city || ""}, ${geocode[0].region || ""}, ${geocode[0].country || ""}`.trim()
      }

      const locationData: LocationData = {
        address,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        label: "Current Location"
      }

      setAutoCurrentLocation(locationData)
      console.log("Current location updated:", address)
      return locationData
    } catch (error) {
      console.error("Failed to update current location:", error)
      return null
    }
  }

  // Load credentials from MEGA on mount
  useEffect(() => {
    loadCredentialsFromCloud()
  }, [])

  const loadCredentialsFromCloud = async () => {
    try {
      setLoading(true)
      
      // First, try to upgrade folder structure if needed
      try {
        await ClothesService.upgradeFolderStructure()
      } catch (upgradeError) {
        console.log('Folder upgrade not needed or failed:', upgradeError)
        // Continue even if upgrade fails - might already be upgraded
      }
      
      // Load regular credentials from MEGA
      const loadedCredentials = await CredentialsService.loadCredentials()
      
      // Load clothes from dedicated clothes folder
      const loadedClothes = await ClothesService.loadClothes()
      
      // Convert clothes to credential format for display
      const clothesCredentials: Credential[] = loadedClothes.map(item => ({
        id: item.id,
        type: 'clothing' as CredentialType,
        title: item.name,
        data: {
          imageUri: item.imageUri || '',
          megaFileId: item.megaFileId,
          name: item.name,
          category: item.category,
          color: item.color,
          size: item.size,
          brand: item.brand,
          notes: item.notes
        },
        createdAt: new Date(item.createdAt)
      }))
      
      // Merge clothes with other credentials
      const allCredentials = [...clothesCredentials, ...loadedCredentials.filter(c => c.type !== 'clothing')]
      
      setCredentials(allCredentials)
      console.log('✓ Loaded', allCredentials.length, 'credentials from cloud (', clothesCredentials.length, 'clothes)')
    } catch (error) {
      console.error('Failed to load credentials:', error)
      Alert.alert(
        translations.error[language],
        language === "en" 
          ? "Failed to load your data. Please check your connection." 
          : "Échec du chargement de vos données. Vérifiez votre connexion."
      )
    } finally {
      setLoading(false)
    }
  }

  // Auto-update location every 3 minutes
  useEffect(() => {
    // Initial location update
    updateCurrentLocation()

    // Set up interval for updates every 3 minutes (180000 ms)
    locationUpdateInterval.current = setInterval(() => {
      updateCurrentLocation()
    }, 180000)

    // Cleanup on unmount
    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current)
      }
    }
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

  const handleAddCredential = async (type: CredentialType) => {
    setSelectedType(type)
    
    // Use current location when adding a location credential
    if (type === "location") {
      // Check if we have current location already
      if (autoCurrentLocation) {
        // Use the automatically updated current location
        setInitialLocationData({
          address: autoCurrentLocation.address,
          latitude: autoCurrentLocation.latitude,
          longitude: autoCurrentLocation.longitude,
        })
        setShowAddModal(true)
      } else {
        // If no current location yet, try to get it now
        try {
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status !== "granted") {
            Alert.alert(
              translations.permissionDenied[language], 
              translations.locationPermission[language],
              [
                { text: translations.cancel[language], style: "cancel" },
                { 
                  text: "Settings", 
                  onPress: () => {
                    Alert.alert(
                      language === "en" ? "Info" : "Info",
                      language === "en" 
                        ? "Please enable location permission in your device settings to use this feature."
                        : "Veuillez activer l'autorisation de localisation dans les paramètres de votre appareil."
                    )
                  }
                }
              ]
            )
            return
          }

          // Get current location now
          const newLocation = await updateCurrentLocation()
          
          if (newLocation) {
            setInitialLocationData({
              address: newLocation.address,
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            })
          }
          setShowAddModal(true)
        } catch (error) {
          console.error("Location error:", error)
          Alert.alert(
            translations.error[language], 
            translations.failedToGetLocation[language],
            [
              { text: translations.cancel[language], style: "cancel" },
              { text: language === "en" ? "Retry" : "Réessayer", onPress: () => handleAddCredential(type) }
            ]
          )
        }
      }
    } else {
      // For other types, just open the modal
      setShowAddModal(true)
    }
  }

  const handleDeleteCredential = (id: string) => {
    if (deletingIds.has(id)) return // Already deleting
    
    Alert.alert(
      translations.deleteTitle[language],
      translations.deleteMessage[language],
      [
        { text: translations.cancel[language], style: "cancel" },
        { 
          text: translations.delete[language], 
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingIds(prev => new Set(prev).add(id))
              
              // Find the credential to delete
              const credentialToDelete = credentials.find(c => c.id === id)
              
              if (credentialToDelete?.type === 'clothing') {
                // Delete from clothes service
                const allClothes = credentials
                  .filter(c => c.type === 'clothing')
                  .map(c => ({
                    id: c.id,
                    name: c.title,
                    category: (c.data as ClothingItem).category || '',
                    color: (c.data as any).color || '',
                    size: (c.data as any).size || '',
                    brand: (c.data as any).brand || '',
                    notes: (c.data as any).notes || '',
                    megaFileId: (c.data as any).megaFileId,
                    imageUri: (c.data as ClothingItem).imageUri,
                    createdAt: c.createdAt.toISOString()
                  }))
                
                await ClothesService.deleteClothingItem(id, allClothes)
              } else {
                // Delete from regular credentials service
                const updatedCredentials = await CredentialsService.deleteCredential(id, credentials.filter(c => c.type !== 'clothing'))
              }
              
              // Remove from local state
              setCredentials(credentials.filter(c => c.id !== id))
              
              Alert.alert(
                translations.success[language],
                language === "en" ? "Deleted successfully" : "Supprimé avec succès"
              )
            } catch (error) {
              console.error('Failed to delete credential:', error)
              Alert.alert(
                translations.error[language],
                language === "en" 
                  ? "Failed to delete. Please try again." 
                  : "Échec de la suppression. Réessayez."
              )
            } finally {
              setDeletingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(id)
                return newSet
              })
            }
          }
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>
              {language === "en" ? "Loading your data..." : "Chargement de vos données..."}
            </Text>
          </View>
        ) : (
          <>
        {/* Activity Blocks */}
        <View style={styles.activitiesContainer}>
          
          {/* Clothing Block */}
          <View style={styles.activityBlock}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityIcon}>👕</Text>
                <Text style={styles.activityTitle}>
                  {language === "en" ? "Clothing" : "Vêtements"}
                </Text>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>
                    {credentials.filter(c => c.type === "clothing").length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddCredential("clothing")}
              >
                <Text style={styles.addButtonText}>+ {language === "en" ? "Add" : "Ajouter"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContent}>
              {credentials.filter(c => c.type === "clothing").length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {credentials.filter(c => c.type === "clothing").map(item => {
                    const clothingData = item.data as any
                    // Use local imageUri for now (we'll fetch from MEGA if needed)
                    const imageUri = clothingData.imageUri || null
                    const hasMegaFile = clothingData.megaFileId
                    
                    return (
                      <View key={item.id} style={styles.activityItem}>
                        {hasMegaFile && (
                          <MegaImage fileId={clothingData.megaFileId} style={styles.itemImage} />
                        )}
                        {!hasMegaFile && imageUri && (
                          <Image source={{ uri: imageUri }} style={styles.itemImage} />
                        )}
                        {!hasMegaFile && !imageUri && (
                          <View style={[styles.itemImage, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                            <Text style={{ fontSize: 40 }}>👕</Text>
                          </View>
                        )}
                        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteCredential(item.id)}
                          disabled={deletingIds.has(item.id)}
                        >
                          {deletingIds.has(item.id) ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.deleteButtonText}>✕</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.emptyBlockText}>
                  {language === "en" ? "No items yet. Tap + Add to start." : "Aucun élément. Appuyez sur + Ajouter."}
                </Text>
              )}
            </View>
          </View>

          {/* Credit Cards Block */}
          <View style={styles.activityBlock}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityIcon}>💳</Text>
                <Text style={styles.activityTitle}>
                  {language === "en" ? "Credit Cards" : "Cartes"}
                </Text>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>
                    {credentials.filter(c => c.type === "card").length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddCredential("card")}
              >
                <Text style={styles.addButtonText}>+ {language === "en" ? "Add" : "Ajouter"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContent}>
              {credentials.filter(c => c.type === "card").length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {credentials.filter(c => c.type === "card").map(item => (
                    <View key={item.id} style={styles.cardItem}>
                      {typeof item.data === "object" && "cardNumber" in item.data && (
                        <>
                          <Text style={styles.cardNumber}>•••• {item.data.cardNumber.slice(-4)}</Text>
                          <Text style={styles.cardHolder}>{item.data.cardHolder}</Text>
                          <Text style={styles.cardExpiry}>{item.data.expiryDate}</Text>
                        </>
                      )}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteCredential(item.id)}
                        disabled={deletingIds.has(item.id)}
                      >
                        {deletingIds.has(item.id) ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.deleteButtonText}>✕</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.emptyBlockText}>
                  {language === "en" ? "No cards saved. Tap + Add to start." : "Aucune carte. Appuyez sur + Ajouter."}
                </Text>
              )}
            </View>
          </View>

          {/* Email Block */}
          <View style={styles.activityBlock}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityIcon}>�</Text>
                <Text style={styles.activityTitle}>
                  {language === "en" ? "Email Addresses" : "Adresses E-mail"}
                </Text>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>
                    {credentials.filter(c => c.type === "email").length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddCredential("email")}
              >
                <Text style={styles.addButtonText}>+ {language === "en" ? "Add" : "Ajouter"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContent}>
              {credentials.filter(c => c.type === "email").length > 0 ? (
                credentials.filter(c => c.type === "email").map(item => (
                  <View key={item.id} style={styles.listItem}>
                    <Text style={styles.listItemText} numberOfLines={1}>
                      {typeof item.data === "string" ? item.data : item.title}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButtonSmall}
                      onPress={() => handleDeleteCredential(item.id)}
                      disabled={deletingIds.has(item.id)}
                    >
                      {deletingIds.has(item.id) ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.deleteButtonText}>✕</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyBlockText}>
                  {language === "en" ? "No emails saved. Tap + Add to start." : "Aucun e-mail. Appuyez sur + Ajouter."}
                </Text>
              )}
            </View>
          </View>

          {/* Phone Block */}
          <View style={styles.activityBlock}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityIcon}>📱</Text>
                <Text style={styles.activityTitle}>
                  {language === "en" ? "Phone Numbers" : "Téléphones"}
                </Text>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>
                    {credentials.filter(c => c.type === "phone").length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddCredential("phone")}
              >
                <Text style={styles.addButtonText}>+ {language === "en" ? "Add" : "Ajouter"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContent}>
              {credentials.filter(c => c.type === "phone").length > 0 ? (
                credentials.filter(c => c.type === "phone").map(item => (
                  <View key={item.id} style={styles.listItem}>
                    <Text style={styles.listItemText} numberOfLines={1}>
                      {typeof item.data === "string" ? item.data : item.title}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButtonSmall}
                      onPress={() => handleDeleteCredential(item.id)}
                      disabled={deletingIds.has(item.id)}
                    >
                      {deletingIds.has(item.id) ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.deleteButtonText}>✕</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyBlockText}>
                  {language === "en" ? "No phones saved. Tap + Add to start." : "Aucun téléphone. Appuyez sur + Ajouter."}
                </Text>
              )}
            </View>
          </View>

          {/* Location Block - Shows current auto-updated location */}
          <View style={styles.activityBlock}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityIcon}>📍</Text>
                <Text style={styles.activityTitle}>
                  {language === "en" ? "Current Location" : "Position Actuelle"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: "rgba(34, 197, 94, 0.2)", borderColor: "#22c55e" }]}
                onPress={async () => {
                  const newLocation = await updateCurrentLocation()
                  if (newLocation) {
                    Alert.alert(
                      translations.success[language],
                      language === "en" ? "Location refreshed!" : "Position actualisée !",
                      [{ text: "OK" }]
                    )
                  }
                }}
              >
                <Text style={[styles.addButtonText, { color: "#22c55e" }]}>
                  🔄 {language === "en" ? "Refresh" : "Actualiser"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContent}>
              {autoCurrentLocation ? (
                <View style={styles.currentLocationCard}>
                  <View style={styles.locationUpdateInfo}>
                    <Text style={styles.locationUpdateText}>
                      {language === "en" ? "📡 Auto-updates every 3 minutes" : "📡 Actualisation automatique chaque 3 min"}
                    </Text>
                  </View>
                  <View style={styles.locationDetailsContainer}>
                    <View style={styles.locationIconContainer}>
                      <Text style={styles.locationIconLarge}>📍</Text>
                    </View>
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.currentLocationLabel}>{autoCurrentLocation.label}</Text>
                      <Text style={styles.currentLocationAddress}>{autoCurrentLocation.address}</Text>
                      <View style={styles.coordsRow}>
                        <Text style={styles.coordLabel}>
                          {language === "en" ? "Coordinates:" : "Coordonnées:"}
                        </Text>
                        <Text style={styles.currentLocationCoords}>
                          {autoCurrentLocation.latitude.toFixed(6)}, {autoCurrentLocation.longitude.toFixed(6)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.changeLocationButton}
                    onPress={() => {
                      // Set initial map position to current location
                      if (autoCurrentLocation) {
                        setSelectedMapLocation({
                          latitude: autoCurrentLocation.latitude,
                          longitude: autoCurrentLocation.longitude,
                        })
                      }
                      setShowMapModal(true)
                    }}
                  >
                    <Text style={styles.changeLocationText}>
                      ✏️ {language === "en" ? "Change Location" : "Modifier la position"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.locationLoadingContainer}>
                  <Text style={styles.locationLoadingText}>
                    {language === "en" ? "🔍 Getting your location..." : "🔍 Récupération de votre position..."}
                  </Text>
                  <Text style={styles.locationLoadingSubtext}>
                    {language === "en" 
                      ? "Please make sure location permissions are enabled" 
                      : "Veuillez vous assurer que les autorisations de localisation sont activées"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Personal Info Block */}
          <View style={styles.activityBlock}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityIcon}>👤</Text>
                <Text style={styles.activityTitle}>
                  {language === "en" ? "Personal Info" : "Infos Personnelles"}
                </Text>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>
                    {credentials.filter(c => c.type === "personal").length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddCredential("personal")}
              >
                <Text style={styles.addButtonText}>+ {language === "en" ? "Add" : "Ajouter"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContent}>
              {credentials.filter(c => c.type === "personal").length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {credentials.filter(c => c.type === "personal").map(item => {
                    const personalData = typeof item.data === "object" && "name" in item.data && "details" in item.data ? item.data : null
                    return (
                      <View key={item.id} style={styles.personalInfoCard}>
                        {personalData && (
                          <>
                            {personalData.imageUri && (
                              <Image source={{ uri: personalData.imageUri }} style={styles.personalInfoImage} />
                            )}
                            {!personalData.imageUri && (
                              <View style={styles.personalInfoImagePlaceholder}>
                                <Text style={styles.personalInfoImagePlaceholderText}>👤</Text>
                              </View>
                            )}
                            <Text style={styles.personalInfoName}>{personalData.name}</Text>
                            <Text style={styles.personalInfoDetails} numberOfLines={2}>{personalData.details}</Text>
                          </>
                        )}
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteCredential(item.id)}
                          disabled={deletingIds.has(item.id)}
                        >
                          {deletingIds.has(item.id) ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.deleteButtonText}>✕</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.emptyBlockText}>
                  {language === "en" ? "No personal info saved. Tap + Add to start." : "Aucune info. Appuyez sur + Ajouter."}
                </Text>
              )}
            </View>
          </View>

        </View>
        </>
        )}
      </ScrollView>

      {/* Add Modal */}
      <AddCredentialModal
        visible={showAddModal}
        type={selectedType}
        initialLocationData={initialLocationData}
        onClose={() => {
          setShowAddModal(false)
          setSelectedType(null)
          setInitialLocationData(null) // Clear location data when closing
        }}
        onAdd={async (credential) => {
          try {
            if (credential.type === 'clothing') {
              // Handle clothing separately using ClothesService
              const clothingItem = {
                id: credential.id,
                name: credential.title,
                category: (credential.data as ClothingItem).category || '',
                color: (credential.data as any).color || '',
                size: (credential.data as any).size || '',
                brand: (credential.data as any).brand || '',
                notes: (credential.data as any).notes || '',
                imageUri: (credential.data as ClothingItem).imageUri || '',
                megaFileId: (credential.data as any).megaFileId,
                createdAt: credential.createdAt.toISOString()
              }
              
              // Get all current clothes
              const allClothes = credentials
                .filter(c => c.type === 'clothing')
                .map(c => ({
                  id: c.id,
                  name: c.title,
                  category: (c.data as ClothingItem).category || '',
                  color: (c.data as any).color || '',
                  size: (c.data as any).size || '',
                  brand: (c.data as any).brand || '',
                  notes: (c.data as any).notes || '',
                  megaFileId: (c.data as any).megaFileId,
                  imageUri: (c.data as ClothingItem).imageUri,
                  createdAt: c.createdAt.toISOString()
                }))
              
              await ClothesService.addClothingItem(clothingItem, allClothes)
              
              // Add to local state
              setCredentials([...credentials, credential])
            } else {
              // Handle other credentials normally
              const updatedCredentials = await CredentialsService.addCredential(credential, credentials.filter(c => c.type !== 'clothing'))
              
              // Merge with clothes in state
              const clothesInState = credentials.filter(c => c.type === 'clothing')
              setCredentials([...clothesInState, ...updatedCredentials])
            }
            
            setShowAddModal(false)
            setSelectedType(null)
            setInitialLocationData(null)
            Alert.alert(
              translations.success[language],
              language === "en" ? "Saved successfully" : "Enregistré avec succès"
            )
          } catch (error) {
            console.error('Failed to add credential:', error)
            Alert.alert(
              translations.error[language],
              language === "en" 
                ? "Failed to save. Please try again." 
                : "Échec de l'enregistrement. Réessayez."
            )
          }
        }}
        translations={translations}
        language={language}
      />

      {/* Location Edit Modal */}
      <Modal visible={showMapModal} animationType="slide" transparent={false}>
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>
              {language === "en" ? "Edit Location" : "Modifier la position"}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowMapModal(false)} 
              style={styles.mapCloseButton}
            >
              <Text style={styles.mapCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.mapContent}>
            <View style={styles.locationEditSection}>
              <Text style={styles.locationEditLabel}>
                {language === "en" ? "Current Coordinates" : "Coordonnées actuelles"}
              </Text>
              {selectedMapLocation && (
                <View style={styles.currentCoordsDisplay}>
                  <Text style={styles.coordDisplayText}>
                    📍 Latitude: {selectedMapLocation.latitude.toFixed(6)}
                  </Text>
                  <Text style={styles.coordDisplayText}>
                    📍 Longitude: {selectedMapLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.locationEditSection}>
              <Text style={styles.locationEditLabel}>
                {language === "en" ? "Enter New Coordinates" : "Entrer nouvelles coordonnées"}
              </Text>
              <TextInput
                style={styles.coordInput}
                placeholder={language === "en" ? "Latitude (e.g., 36.8065)" : "Latitude (ex: 36.8065)"}
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={selectedMapLocation?.latitude.toString() || ""}
                onChangeText={(text) => {
                  const lat = parseFloat(text)
                  if (!isNaN(lat) && selectedMapLocation) {
                    setSelectedMapLocation({ ...selectedMapLocation, latitude: lat })
                  }
                }}
              />
              <TextInput
                style={styles.coordInput}
                placeholder={language === "en" ? "Longitude (e.g., 10.1815)" : "Longitude (ex: 10.1815)"}
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={selectedMapLocation?.longitude.toString() || ""}
                onChangeText={(text) => {
                  const lng = parseFloat(text)
                  if (!isNaN(lng) && selectedMapLocation) {
                    setSelectedMapLocation({ ...selectedMapLocation, longitude: lng })
                  }
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.useCurrentLocationButton}
              onPress={async () => {
                const newLocation = await updateCurrentLocation()
                if (newLocation) {
                  setSelectedMapLocation({
                    latitude: newLocation.latitude,
                    longitude: newLocation.longitude,
                  })
                  Alert.alert(
                    translations.success[language],
                    language === "en" ? "Current location loaded!" : "Position actuelle chargée !",
                    [{ text: "OK" }]
                  )
                }
              }}
            >
              <Text style={styles.useCurrentLocationText}>
                🎯 {language === "en" ? "Use Current Location" : "Utiliser position actuelle"}
              </Text>
            </TouchableOpacity>

            <View style={styles.locationEditHint}>
              <Text style={styles.locationHintText}>
                💡 {language === "en" 
                  ? "Tip: You can paste coordinates from Google Maps or any location service" 
                  : "Astuce : Vous pouvez coller des coordonnées depuis Google Maps"}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.mapFooter}>
            <View style={styles.mapButtonsRow}>
              <TouchableOpacity 
                style={styles.mapCancelButton}
                onPress={() => setShowMapModal(false)}
              >
                <Text style={styles.mapCancelButtonText}>
                  {translations.cancel[language]}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mapConfirmButton}
                onPress={async () => {
                  if (selectedMapLocation) {
                    try {
                      const geocode = await Location.reverseGeocodeAsync(selectedMapLocation)
                      let address = "Unknown Location"
                      if (geocode[0]) {
                        address = `${geocode[0].street || ""}, ${geocode[0].city || ""}, ${geocode[0].region || ""}, ${geocode[0].country || ""}`.trim()
                      }
                      
                      const newLocationData: LocationData = {
                        address,
                        latitude: selectedMapLocation.latitude,
                        longitude: selectedMapLocation.longitude,
                        label: "Current Location"
                      }
                      setAutoCurrentLocation(newLocationData)
                      setShowMapModal(false)
                      
                      Alert.alert(
                        translations.success[language],
                        language === "en" ? "Location updated!" : "Position mise à jour !",
                        [{ text: "OK" }]
                      )
                    } catch (error) {
                      Alert.alert(
                        translations.error[language],
                        language === "en" ? "Failed to get address" : "Échec de récupération de l'adresse"
                      )
                    }
                  }
                }}
              >
                <Text style={styles.mapConfirmButtonText}>
                  {language === "en" ? "Confirm" : "Confirmer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// Add Credential Modal Component
function AddCredentialModal({
  visible,
  type,
  initialLocationData,
  onClose,
  onAdd,
  translations,
  language,
}: {
  visible: boolean
  type: CredentialType | null
  initialLocationData: { address: string; latitude: number; longitude: number } | null
  onClose: () => void
  onAdd: (credential: Credential) => Promise<void>
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
  const [personalName, setPersonalName] = useState("")
  const [personalDetails, setPersonalDetails] = useState("")
  const [personalImageUri, setPersonalImageUri] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Auto-populate location fields when initialLocationData is provided
  useEffect(() => {
    if (initialLocationData && type === "location") {
      setAddress(initialLocationData.address)
      setCurrentLocation({
        latitude: initialLocationData.latitude,
        longitude: initialLocationData.longitude,
      })
    }
  }, [initialLocationData, type])

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

  const handleSave = async () => {
    if (isSaving) return // Prevent double-save
    
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
    } else if (type === "personal") {
      if (!personalName.trim()) {
        Alert.alert(translations.error[language], language === "en" ? "Please enter a name" : "Veuillez saisir un nom")
        return
      }
      if (!personalDetails.trim()) {
        Alert.alert(translations.error[language], language === "en" ? "Please enter some details" : "Veuillez saisir des détails")
        return
      }
      data = {
        name: personalName,
        details: personalDetails,
        imageUri: personalImageUri || undefined,
      }
    }

    const credential: Credential = {
      id: Date.now().toString(),
      type: type!,
      title,
      data,
      createdAt: new Date(),
    }

    try {
      setIsSaving(true)
      await onAdd(credential)
      resetForm()
    } catch (error) {
      console.error('Save error:', error)
      // Error is already handled in onAdd
    } finally {
      setIsSaving(false)
    }
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
    setPersonalName("")
    setPersonalDetails("")
    setPersonalImageUri("")
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

            {type === "personal" && (
              <>
                <TouchableOpacity style={styles.imagePickerButton} onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    quality: 1,
                  })
                  if (!result.canceled && result.assets[0]) {
                    setPersonalImageUri(result.assets[0].uri)
                  }
                }}>
                  {personalImageUri ? (
                    <Image source={{ uri: personalImageUri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.personalPhotoPlaceholder}>
                      <Text style={styles.personalPhotoPlaceholderIcon}>👤</Text>
                      <Text style={styles.imagePickerText}>
                        {language === "en" ? "📷 Add Photo (Optional)" : "📷 Ajouter une photo (Facultatif)"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TextInput
                  style={styles.modalInput}
                  placeholder={language === "en" ? "Name" : "Nom"}
                  placeholderTextColor="#64748b"
                  value={personalName}
                  onChangeText={setPersonalName}
                />
                <TextInput
                  style={[styles.modalInput, styles.personalDetailsInput]}
                  placeholder={language === "en" ? "Details (e.g., role, relationship, contact info)" : "Détails (ex: rôle, relation, contact)"}
                  placeholderTextColor="#64748b"
                  value={personalDetails}
                  onChangeText={setPersonalDetails}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>{translations.cancel[language]}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, isSaving && { opacity: 0.6 }]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{translations.save[language]}</Text>
              )}
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
  // New Activity Block Styles
  activitiesContainer: {
    gap: 20,
  },
  activityBlock: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  activityIcon: {
    fontSize: 28,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
  },
  activityBadge: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    marginRight: 8,
    alignItems: "center",
  },
  activityBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  addButton: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderWidth: 1,
    borderColor: "#0ea5e9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0ea5e9",
  },
  activityContent: {
    minHeight: 80,
  },
  activityItem: {
    width: 140,
    marginRight: 12,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 12,
    padding: 12,
    position: "relative",
  },
  itemImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 4,
  },
  cardItem: {
    width: 200,
    height: 120,
    marginRight: 12,
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
    position: "relative",
  },
  cardExpiry: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 14,
    color: "#ffffff",
    flex: 1,
    marginRight: 12,
  },
  locationItem: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyBlockText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  // Current Location Styles
  currentLocationCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  locationUpdateInfo: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  locationUpdateText: {
    fontSize: 12,
    color: "#22c55e",
    textAlign: "center",
    fontWeight: "600",
  },
  locationDetailsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  locationIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationIconLarge: {
    fontSize: 32,
  },
  locationTextContainer: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#22c55e",
    marginBottom: 8,
  },
  currentLocationAddress: {
    fontSize: 15,
    color: "#ffffff",
    lineHeight: 22,
    marginBottom: 8,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  coordLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  currentLocationCoords: {
    fontSize: 11,
    color: "#0ea5e9",
    fontFamily: "monospace",
    flexShrink: 1,
  },
  changeLocationButton: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderWidth: 1,
    borderColor: "#0ea5e9",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  changeLocationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0ea5e9",
  },
  locationLoadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  locationLoadingText: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 8,
    textAlign: "center",
  },
  locationLoadingSubtext: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
  },
  // Location Edit Modal Styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  mapHeader: {
    backgroundColor: "#1e293b",
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 165, 233, 0.3)",
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  mapCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapCloseButtonText: {
    fontSize: 24,
    color: "#ef4444",
  },
  mapContent: {
    flex: 1,
    padding: 20,
  },
  locationEditSection: {
    marginBottom: 24,
  },
  locationEditLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0ea5e9",
    marginBottom: 12,
  },
  currentCoordsDisplay: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)",
    borderRadius: 12,
    padding: 16,
  },
  coordDisplayText: {
    fontSize: 15,
    color: "#ffffff",
    marginBottom: 8,
    fontFamily: "monospace",
  },
  coordInput: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "#0369a1",
    borderRadius: 12,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 12,
    fontFamily: "monospace",
  },
  useCurrentLocationButton: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 1,
    borderColor: "#22c55e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  useCurrentLocationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22c55e",
  },
  locationEditHint: {
    backgroundColor: "rgba(251, 146, 60, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(251, 146, 60, 0.3)",
    borderRadius: 12,
    padding: 16,
  },
  locationHintText: {
    fontSize: 13,
    color: "#fb923c",
    lineHeight: 20,
  },
  mapFooter: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(14, 165, 233, 0.3)",
  },
  mapButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  mapCancelButton: {
    flex: 1,
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#64748b",
  },
  mapCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  mapConfirmButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  mapConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  // Personal Info Styles
  personalInfoCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 12,
    padding: 12,
    position: "relative",
    alignItems: "center",
  },
  personalInfoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginBottom: 12,
  },
  personalInfoImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  personalInfoImagePlaceholderText: {
    fontSize: 48,
  },
  personalInfoName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 6,
  },
  personalInfoDetails: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 16,
  },
  personalPhotoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  personalPhotoPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  personalDetailsInput: {
    height: 100,
    paddingTop: 16,
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 16,
  },
})
