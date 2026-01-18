import mongoose from 'mongoose'

// Global variable to track connection status
let isConnected = false

/**
 * Connects to MongoDB only in production environment
 * Uses VERCEL_ENV to detect production deployment
 * Safe to call multiple times - will not reconnect if already connected
 */
export async function connectToDatabase() {
  // Only connect in production
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('[v0] MongoDB: Skipping connection (not in production environment)')
    return { connected: false, isProduction: false }
  }

  // Check if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('[v0] MongoDB: Using existing connection')
    return { connected: true, isProduction: true }
  }

  // Check if MongoDB URI is configured
  if (!process.env.MONGODB_URI) {
    console.warn('[v0] MongoDB: MONGODB_URI not configured')
    return { connected: false, isProduction: true, error: 'MONGODB_URI not configured' }
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI)
    isConnected = true
    console.log('[v0] MongoDB: Connected successfully')
    return { connected: true, isProduction: true }
  } catch (error) {
    console.error('[v0] MongoDB: Connection failed:', error)
    return { connected: false, isProduction: true, error: String(error) }
  }
}

/**
 * Returns whether the app is running in production
 */
export function isProductionEnvironment() {
  return process.env.VERCEL_ENV === 'production'
}

/**
 * Returns whether MongoDB is connected
 */
export function isDatabaseConnected() {
  return isConnected && mongoose.connection.readyState === 1
}
