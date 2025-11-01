import { buildUrl } from './config'
import { StorageService } from './storage'

export interface LocationData {
  address: string
  latitude: number
  longitude: number
  city?: string
  country?: string
  timestamp: string
  source: 'manual' | 'automatic'
}

export interface LocationHistoryEntry extends LocationData {
  start_date: string
  end_date: string | null
}

export interface LocationResponse {
  current_location: LocationData | null
  location_history: LocationHistoryEntry[]
}

class LocationService {
  private async getAuthHeaders() {
    const token = await StorageService.getToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  /**
   * Get current location and history from cloud
   */
  async getLocationData(): Promise<LocationResponse> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(buildUrl('/location'), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to load location: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error loading location data:', error)
      throw error
    }
  }

  /**
   * Update location (saves to cloud and updates history)
   */
  async updateLocation(locationData: Partial<LocationData>): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      
      const payload = {
        address: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        country: locationData.country,
        timestamp: locationData.timestamp || new Date().toISOString(),
        source: locationData.source || 'manual'
      }

      const response = await fetch(buildUrl('/location'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to update location: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✓ Location updated:', result.message)
      console.log('  Current:', result.current_location?.address)
      console.log('  History entries:', result.history_count)
    } catch (error) {
      console.error('Error updating location:', error)
      throw error
    }
  }

  /**
   * Get location history only
   */
  async getLocationHistory(): Promise<LocationHistoryEntry[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(buildUrl('/location/history'), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to load location history: ${response.statusText}`)
      }

      const data = await response.json()
      return data.location_history || []
    } catch (error) {
      console.error('Error loading location history:', error)
      throw error
    }
  }

  /**
   * Format date range for display
   */
  formatDateRange(startDate: string, endDate: string | null): string {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    
    const startFormatted = start.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    
    if (!endDate) {
      return `${startFormatted} - Present`
    }
    
    const endFormatted = end.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    
    // Calculate duration
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `${startFormatted} (same day)`
    } else if (diffDays === 1) {
      return `${startFormatted} - ${endFormatted} (1 day)`
    } else if (diffDays < 30) {
      return `${startFormatted} - ${endFormatted} (${diffDays} days)`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${startFormatted} - ${endFormatted} (${months} ${months === 1 ? 'month' : 'months'})`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${startFormatted} - ${endFormatted} (${years} ${years === 1 ? 'year' : 'years'})`
    }
  }
}

export default new LocationService()
