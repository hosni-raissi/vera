import { buildUrl } from './config'
import { StorageService } from './storage'

export interface PersonItem {
  id: string
  name: string
  details: string
  megaFileId?: string
  imageUri?: string
  createdAt: string
}

class PersonService {
  private async getAuthHeaders() {
    const token = await StorageService.getToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  /**
   * Load all persons from cloud
   */
  async loadPersons(): Promise<PersonItem[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(buildUrl('/storage/person'), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to load persons: ${response.statusText}`)
      }

      const data = await response.json()
      const persons = data.persons || []
      console.log('📥 Loaded persons from cloud:', JSON.stringify(persons, null, 2))
      return persons
    } catch (error) {
      console.error('Error loading persons:', error)
      throw error
    }
  }

  /**
   * Save all persons to cloud
   */
  async savePersons(persons: PersonItem[]): Promise<void> {
    try {
      console.log('💾 Saving persons to cloud:', JSON.stringify(persons, null, 2))
      
      const headers = await this.getAuthHeaders()
      const response = await fetch(buildUrl('/storage/person'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ persons })
      })

      if (!response.ok) {
        throw new Error(`Failed to save persons: ${response.statusText}`)
      }

      console.log('✅ Persons saved successfully')
    } catch (error) {
      console.error('Error saving persons:', error)
      throw error
    }
  }

  /**
   * Upload image to cloud person folder
   */
  async uploadPersonImage(imageUri: string, filename: string): Promise<string | null> {
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
      const uploadResponse = await fetch(buildUrl('/storage/person/image'), {
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
      console.log('✅ Person image uploaded with ID:', uploadData.file_id)
      return uploadData.file_id
      
    } catch (error) {
      console.error('Error uploading person image:', error)
      throw error
    }
  }

  /**
   * Add a new person
   */
  async addPerson(person: Omit<PersonItem, 'id' | 'createdAt'>): Promise<PersonItem> {
    try {
      // Load existing persons
      const persons = await this.loadPersons()
      
      // Upload image if provided
      let megaFileId: string | undefined
      if (person.imageUri) {
        const timestamp = Date.now()
        const filename = `person_${timestamp}.jpg`
        megaFileId = await this.uploadPersonImage(person.imageUri, filename) || undefined
      }
      
      // Create new person
      const newPerson: PersonItem = {
        ...person,
        id: Date.now().toString(),
        megaFileId,
        createdAt: new Date().toISOString()
      }
      
      // Add to list and save
      persons.push(newPerson)
      await this.savePersons(persons)
      
      console.log('✅ Person added successfully:', newPerson.name)
      return newPerson
    } catch (error) {
      console.error('Error adding person:', error)
      throw error
    }
  }

  /**
   * Update an existing person
   */
  async updatePerson(id: string, updates: Partial<Omit<PersonItem, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const persons = await this.loadPersons()
      const index = persons.findIndex(p => p.id === id)
      
      if (index === -1) {
        throw new Error('Person not found')
      }
      
      // Upload new image if provided
      let megaFileId = persons[index].megaFileId
      if (updates.imageUri && updates.imageUri !== persons[index].imageUri) {
        // Delete old image if exists
        if (megaFileId) {
          await this.deletePersonImage(megaFileId)
        }
        
        // Upload new image
        const timestamp = Date.now()
        const filename = `person_${timestamp}.jpg`
        megaFileId = await this.uploadPersonImage(updates.imageUri, filename) || undefined
      }
      
      // Update person
      persons[index] = {
        ...persons[index],
        ...updates,
        megaFileId
      }
      
      await this.savePersons(persons)
      console.log('✅ Person updated successfully')
    } catch (error) {
      console.error('Error updating person:', error)
      throw error
    }
  }

  /**
   * Delete a person
   */
  async deletePerson(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting person with ID:', id)
      
      const persons = await this.loadPersons()
      const person = persons.find(p => p.id === id)
      
      if (!person) {
        throw new Error('Person not found')
      }
      
      // Delete image from cloud if exists
      if (person.megaFileId) {
        console.log('🗑️ Deleting person image:', person.megaFileId)
        await this.deletePersonImage(person.megaFileId)
      }
      
      // Remove person from list
      const updatedPersons = persons.filter(p => p.id !== id)
      await this.savePersons(updatedPersons)
      
      console.log('✅ Person deleted successfully')
    } catch (error) {
      console.error('Error deleting person:', error)
      throw error
    }
  }

  /**
   * Delete person image from cloud
   */
  private async deletePersonImage(fileId: string): Promise<void> {
    try {
      const token = await StorageService.getToken()
      const response = await fetch(buildUrl(`/storage/delete/${fileId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.statusText}`)
      }
      
      console.log('✅ Person image deleted from cloud')
    } catch (error) {
      console.error('❌ Error deleting person image:', error)
      throw error
    }
  }
}

export default new PersonService()
