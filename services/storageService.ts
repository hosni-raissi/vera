import { buildUrl, API_ENDPOINTS } from './config'
import { StorageService } from './storage'

class StorageApiService {
  async uploadFile(file: any, type: string = 'data'): Promise<any> {
    try {
      const token = await StorageService.getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch(buildUrl(API_ENDPOINTS.UPLOAD_FILE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    } catch (error: any) {
      console.error('Upload file error:', error)
      throw error
    }
  }

  async uploadData(content: string, filename: string): Promise<any> {
    try {
      const token = await StorageService.getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(buildUrl(API_ENDPOINTS.UPLOAD_DATA), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          filename,
        }),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    } catch (error: any) {
      console.error('Upload data error:', error)
      throw error
    }
  }

  async getUserFiles(): Promise<any> {
    try {
      const token = await StorageService.getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(buildUrl(API_ENDPOINTS.GET_FILES), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    } catch (error: any) {
      console.error('Get files error:', error)
      throw error
    }
  }

  // Upload voice recording
  async uploadVoiceRecording(uri: string, userId: string): Promise<any> {
    try {
      const file = {
        uri,
        type: 'audio/mp3',
        name: `voice_${userId}_${Date.now()}.mp3`,
      }

      return await this.uploadFile(file, 'voice')
    } catch (error) {
      console.error('Upload voice recording error:', error)
      throw error
    }
  }

  // Upload face image
  async uploadFaceImage(uri: string, userId: string): Promise<any> {
    try {
      const file = {
        uri,
        type: 'image/jpeg',
        name: `face_${userId}_${Date.now()}.jpg`,
      }

      return await this.uploadFile(file, 'images')
    } catch (error) {
      console.error('Upload face image error:', error)
      throw error
    }
  }
}

export default new StorageApiService()
