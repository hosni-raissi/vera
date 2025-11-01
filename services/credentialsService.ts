import { buildUrl, API_ENDPOINTS } from './config'
import { StorageService } from './storage'

export type CredentialType = "clothing" | "card" | "email" | "phone" | "personal" | "location"

export interface Credential {
  id: string
  type: CredentialType
  title: string
  data: any
  createdAt: Date
}

class CredentialsService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await StorageService.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  /**
   * Save credentials to MEGA storage
   */
  async saveCredentials(credentials: Credential[]): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(buildUrl(API_ENDPOINTS.UPLOAD_DATA), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filename: 'credentials.json',
          content: JSON.stringify(credentials, null, 2)
        })
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save credentials')
      }

      console.log('✓ Credentials saved to MEGA:', result.file_link)
    } catch (error: any) {
      console.error('Failed to save credentials:', error)
      throw new Error(error.message || 'Failed to save credentials to cloud storage')
    }
  }

  /**
   * Load credentials from MEGA storage
   */
  async loadCredentials(): Promise<Credential[]> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(buildUrl(API_ENDPOINTS.GET_FILES), {
        method: 'GET',
        headers
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        console.log('No credentials found or error:', result.error)
        return []
      }

      // Find credentials.json file
      const credentialsFile = result.files?.find((file: any) => 
        file.name === 'credentials.json'
      )

      if (!credentialsFile) {
        console.log('No credentials.json file found')
        return []
      }

      // Download the file content using the file ID
      if (credentialsFile.id) {
        const downloadResponse = await fetch(buildUrl(`/storage/download/${credentialsFile.id}`), {
          method: 'GET',
          headers
        })

        if (!downloadResponse.ok) {
          console.log('Failed to download credentials file')
          return []
        }

        const fileContent = await downloadResponse.text()
        const credentials = JSON.parse(fileContent)
        
        console.log('✓ Credentials loaded from MEGA:', credentials.length)
        return credentials.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt)
        }))
      }

      return []
    } catch (error: any) {
      console.error('Failed to load credentials:', error)
      // Don't throw error - return empty array to allow app to work offline
      return []
    }
  }

  /**
   * Upload image to MEGA and return the file ID
   */
  async uploadImage(imageUri: string, filename: string, subfolder: string): Promise<string | null> {
    try {
      const token = await StorageService.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Read the image file
      const response = await fetch(imageUri)
      const blob = await response.blob()
      
      // Convert blob to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string
          resolve(base64.split(',')[1]) // Remove data:image/jpeg;base64, prefix
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      
      const base64Data = await base64Promise

      // Upload to MEGA
      const uploadResponse = await fetch(buildUrl('/storage/upload-image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename,
          imageData: base64Data,
          subfolder
        })
      })

      const result = await uploadResponse.json()

      if (!uploadResponse.ok || result.error) {
        throw new Error(result.error || 'Failed to upload image')
      }

      console.log('✓ Image uploaded to MEGA:', result.file_id)
      return result.file_id
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      throw error
    }
  }

  /**
   * Add a new credential with image upload support
   */
  async addCredential(credential: Credential, allCredentials: Credential[]): Promise<Credential[]> {
    // Handle image uploads for clothing and personal info
    if (credential.type === 'clothing' && typeof credential.data === 'object' && 'imageUri' in credential.data) {
      const imageUri = credential.data.imageUri
      if (imageUri && imageUri.startsWith('file://')) {
        const filename = `clothing_${credential.id}.jpg`
        const megaFileId = await this.uploadImage(imageUri, filename, 'images')
        credential.data.megaFileId = megaFileId
        credential.data.imageUri = '' // Clear local URI
      }
    } else if (credential.type === 'personal' && typeof credential.data === 'object' && 'imageUri' in credential.data) {
      const imageUri = credential.data.imageUri
      if (imageUri && imageUri.startsWith('file://')) {
        const filename = `personal_${credential.id}.jpg`
        const megaFileId = await this.uploadImage(imageUri, filename, 'images')
        credential.data.megaFileId = megaFileId
        credential.data.imageUri = '' // Clear local URI
      }
    }

    const updatedCredentials = [credential, ...allCredentials]
    await this.saveCredentials(updatedCredentials)
    return updatedCredentials
  }

  /**
   * Get image URL from MEGA file ID
   */
  async getImageUrl(fileId: string): Promise<string | null> {
    try {
      return buildUrl(`/storage/download/${fileId}`)
    } catch (error) {
      console.error('Failed to get image URL:', error)
      return null
    }
  }

  /**
   * Delete a credential
   */
  async deleteCredential(credentialId: string, allCredentials: Credential[]): Promise<Credential[]> {
    const updatedCredentials = allCredentials.filter(c => c.id !== credentialId)
    await this.saveCredentials(updatedCredentials)
    return updatedCredentials
  }

  /**
   * Update a credential
   */
  async updateCredential(credentialId: string, updatedData: any, allCredentials: Credential[]): Promise<Credential[]> {
    const updatedCredentials = allCredentials.map(c => 
      c.id === credentialId ? { ...c, ...updatedData } : c
    )
    await this.saveCredentials(updatedCredentials)
    return updatedCredentials
  }
}

export default new CredentialsService()
