import { buildUrl, API_ENDPOINTS, API_CONFIG } from './config'
import { StorageService } from './storage'

export interface RegisterData {
  email: string
  password?: string
  username: string
  cin?: string
  faceImage?: string
  voiceRecording?: string
}

export interface LoginData {
  email: string
  password?: string
  voiceRecording?: string
}

export interface AuthResponse {
  token?: string
  user: {
    id: number
    email: string
    username: string
    mega_folder_link: string
    created_at: string
    updated_at: string
  }
  message?: string
  error?: string
}

class AuthService {
  private token: string | null = null

  async initialize(): Promise<void> {
    this.token = await StorageService.getToken()
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // NEW: If voice recording provided, send as multipart/form-data for validation
      if (data.voiceRecording) {
        const formData = new FormData()
        formData.append('email', data.email)
        formData.append('username', data.username)
        if (data.cin) {
          formData.append('cin', data.cin)
        }
        
        // Append voice file
        const voiceFile = {
          uri: data.voiceRecording,
          type: 'audio/mpeg',
          name: `voice_registration_${Date.now()}.mp3`,
        } as any
        formData.append('voice', voiceFile)
        
        const response = await fetch(buildUrl(API_ENDPOINTS.REGISTER), {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            // Don't set Content-Type - let fetch set it automatically for FormData
          },
          body: formData,
        })

        const result = await response.json()

        if (result.error) {
          throw new Error(result.error)
        }

        // If registration is successful and returns a token
        if (result.token) {
          await StorageService.saveToken(result.token)
          await StorageService.saveUser(result.user)
          this.token = result.token
        }

        return result
      } else {
        // OLD: JSON-only registration (no voice validation)
        const response = await fetch(buildUrl(API_ENDPOINTS.REGISTER), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            username: data.username,
            cin: data.cin, // CIN will be used to generate password
          }),
        })

        const result = await response.json()

        if (result.error) {
          throw new Error(result.error)
        }

        // If registration is successful and returns a token (future enhancement)
        if (result.token) {
          await StorageService.saveToken(result.token)
          await StorageService.saveUser(result.user)
          this.token = result.token
        }

        return result
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.message || 'Failed to register. Please try again.')
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(buildUrl(API_ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password || 'voice-auth',
        }),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      // Save token and user data
      if (result.token) {
        await StorageService.saveToken(result.token)
        await StorageService.saveUser(result.user)
        this.token = result.token
      }

      return result
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Failed to login. Please try again.')
    }
  }

  async verifyVoice(email: string, voiceUri: string): Promise<AuthResponse> {
    try {
      const formData = new FormData()
      formData.append('email', email)
      
      // Create voice file object from URI
      const voiceFile = {
        uri: voiceUri,
        type: 'audio/mp3',
        name: `voice_login_${Date.now()}.mp3`,
      } as any
      
      formData.append('voice', voiceFile)

      const response = await fetch(buildUrl(API_ENDPOINTS.VERIFY_VOICE), {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      // Save token and user data if voice is verified
      if (result.verified && result.token) {
        await StorageService.saveToken(result.token)
        await StorageService.saveUser(result.user)
        this.token = result.token
      }

      return result
    } catch (error: any) {
      console.error('Voice verification error:', error)
      throw new Error(error.message || 'Voice authentication failed. Please try again.')
    }
  }

  async logout(): Promise<void> {
    try {
      await StorageService.clearAuth()
      this.token = null
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  async getProfile(): Promise<any> {
    try {
      const token = await StorageService.getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(buildUrl(API_ENDPOINTS.GET_PROFILE), {
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

      // Update stored user data
      await StorageService.saveUser(result)

      return result
    } catch (error: any) {
      console.error('Get profile error:', error)
      throw error
    }
  }

  async updateProfile(data: any): Promise<any> {
    try {
      const token = await StorageService.getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(buildUrl(API_ENDPOINTS.UPDATE_PROFILE), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      // Update stored user data
      if (result.user) {
        await StorageService.saveUser(result.user)
      }

      return result
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await StorageService.getToken()
    return token !== null
  }

  getToken(): string | null {
    return this.token
  }
}

export default new AuthService()
