import { buildUrl, API_ENDPOINTS } from './config'
import { StorageService } from './storage'

export interface Message {
  id: number
  user_id: number
  content: string
  type: string
  created_at: string
}

class ChatService {
  async getMessages(): Promise<Message[]> {
    try {
      const token = await StorageService.getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(buildUrl(API_ENDPOINTS.GET_MESSAGES), {
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

      return result.messages || []
    } catch (error: any) {
      console.error('Get messages error:', error)
      throw error
    }
  }

  async sendMessage(content: string, type: string = 'user'): Promise<Message> {
    try {
      const token = await StorageService.getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(buildUrl(API_ENDPOINTS.SEND_MESSAGE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
        }),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    } catch (error: any) {
      console.error('Send message error:', error)
      throw error
    }
  }
}

export default new ChatService()
