import { buildUrl } from './config'
import { StorageService } from './storage'

export interface ClothingItem {
  id: string
  name: string
  category: string
  color: string
  size: string
  brand: string
  notes: string
  megaFileId?: string
  imageUri?: string
  createdAt: string
}

class ClothesService {
  private async getAuthHeaders() {
    const token = await StorageService.getToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  /**
   * Upgrade user's folder structure to support clothes folders
   */
  async upgradeFolderStructure(): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(buildUrl('/storage/upgrade-folder'), {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to upgrade folder: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Folder structure upgraded:', data.message)
    } catch (error) {
      console.error('Error upgrading folder structure:', error)
      throw error
    }
  }

  /**
   * Load all clothes from MEGA
   */
  async loadClothes(): Promise<ClothingItem[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(buildUrl('/storage/clothes'), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to load clothes: ${response.statusText}`)
      }

      const data = await response.json()
      return data.clothes || []
    } catch (error) {
      console.error('Error loading clothes:', error)
      throw error
    }
  }

  /**
   * Save all clothes to MEGA
   */
  async saveClothes(clothes: ClothingItem[]): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(buildUrl('/storage/clothes'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ clothes })
      })

      if (!response.ok) {
        throw new Error(`Failed to save clothes: ${response.statusText}`)
      }

      console.log('Clothes saved successfully')
    } catch (error) {
      console.error('Error saving clothes:', error)
      throw error
    }
  }

  /**
   * Upload image to MEGA clothes/images folder
   */
  async uploadClothesImage(imageUri: string, filename: string): Promise<string | null> {
    try {
      // Convert image to base64
      const response = await fetch(imageUri)
      const blob = await response.blob()
      
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string
          // Remove data:image/jpeg;base64, prefix
          resolve(base64.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      
      const base64Data = await base64Promise
      
      // Upload to backend
      const token = await StorageService.getToken()
      const uploadResponse = await fetch(buildUrl('/storage/clothes/image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename,
          imageData: base64Data
        })
      })
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${uploadResponse.statusText}`)
      }
      
      const uploadData = await uploadResponse.json()
      return uploadData.file_id
      
    } catch (error) {
      console.error('Error uploading clothes image:', error)
      throw error
    }
  }

  /**
   * Add a new clothing item
   */
  async addClothingItem(item: ClothingItem, allClothes: ClothingItem[]): Promise<void> {
    try {
      // If item has a local image, upload it to MEGA
      if (item.imageUri && item.imageUri.startsWith('file://')) {
        const filename = `clothing_${item.id}.jpg`
        const megaFileId = await this.uploadClothesImage(item.imageUri, filename)
        
        console.log('Uploaded image, received file ID:', megaFileId, typeof megaFileId)
        
        if (megaFileId) {
          // Ensure megaFileId is a string, not an object
          item.megaFileId = typeof megaFileId === 'string' ? megaFileId : String(megaFileId)
          item.imageUri = '' // Clear local URI after upload
        }
      }
      
      // Add to the list
      allClothes.push(item)
      
      console.log('Saving clothing item with megaFileId:', item.megaFileId)
      
      // Save to MEGA
      await this.saveClothes(allClothes)
      
      console.log('Clothing item added successfully')
    } catch (error) {
      console.error('Error adding clothing item:', error)
      throw error
    }
  }

  /**
   * Update an existing clothing item
   */
  async updateClothingItem(updatedItem: ClothingItem, allClothes: ClothingItem[]): Promise<void> {
    try {
      // If item has a new local image, upload it
      if (updatedItem.imageUri && updatedItem.imageUri.startsWith('file://')) {
        const filename = `clothing_${updatedItem.id}.jpg`
        const megaFileId = await this.uploadClothesImage(updatedItem.imageUri, filename)
        
        if (megaFileId) {
          updatedItem.megaFileId = megaFileId
          updatedItem.imageUri = ''
        }
      }
      
      // Find and update the item
      const index = allClothes.findIndex(c => c.id === updatedItem.id)
      if (index !== -1) {
        allClothes[index] = updatedItem
        await this.saveClothes(allClothes)
        console.log('Clothing item updated successfully')
      } else {
        throw new Error('Clothing item not found')
      }
    } catch (error) {
      console.error('Error updating clothing item:', error)
      throw error
    }
  }

  /**
   * Delete a clothing item
   */
  async deleteClothingItem(itemId: string, allClothes: ClothingItem[]): Promise<void> {
    try {
      // Filter out the item
      const updatedClothes = allClothes.filter(c => c.id !== itemId)
      
      // Save to MEGA
      await this.saveClothes(updatedClothes)
      
      console.log('Clothing item deleted successfully')
    } catch (error) {
      console.error('Error deleting clothing item:', error)
      throw error
    }
  }

  /**
   * Get image URL for displaying MEGA-stored images
   * Returns a data URI with the image content
   */
  async getImageUrl(fileId: string): Promise<string | null> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(buildUrl(`/storage/download/${fileId}`), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        console.error('Failed to fetch image:', response.statusText)
        return null
      }

      // Get the image as blob
      const blob = await response.blob()
      
      // Convert to base64 data URI
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error fetching image:', error)
      return null
    }
  }
}

export default new ClothesService()
