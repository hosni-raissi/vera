import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { API_CONFIG } from '../services/config'

/**
 * API Test Component
 * Use this to verify your backend connection is working
 * 
 * To use:
 * 1. Import this in App.tsx temporarily
 * 2. Render <ApiTest /> to see test buttons
 * 3. Test each endpoint
 */
export default function ApiTest() {
  const [status, setStatus] = useState<string>('Not tested')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const baseUrl = API_CONFIG.BASE_URL.replace('/api', '')
      const response = await fetch(`${baseUrl}/`)
      const data = await response.json()
      
      setStatus(`✅ Connected: ${data.message}`)
      Alert.alert('Success', `Backend is running!\nVersion: ${data.version}`)
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message}`)
      Alert.alert('Error', `Cannot connect to backend.\n\nURL: ${API_CONFIG.BASE_URL}\n\nError: ${error.message}`)
    }
    setLoading(false)
  }

  const testRegister = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'test123',
          username: 'Test User',
        }),
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setStatus(`✅ Register works! User: ${data.user.username}`)
      Alert.alert('Success', `User registered!\nMEGA folder: ${data.user.mega_folder_link}`)
    } catch (error: any) {
      setStatus(`❌ Register failed: ${error.message}`)
      Alert.alert('Error', `Registration failed: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 API Test Panel</Text>
      <Text style={styles.url}>URL: {API_CONFIG.BASE_URL}</Text>
      <Text style={styles.status}>{status}</Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '⏳ Testing...' : '🔌 Test Connection'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '⏳ Testing...' : '👤 Test Register'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        💡 If tests fail:{'\n'}
        1. Check backend is running{'\n'}
        2. Update API_CONFIG.BASE_URL{'\n'}
        3. Use your computer's IP for physical device
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    margin: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  url: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 20,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 20,
    lineHeight: 18,
  },
})
