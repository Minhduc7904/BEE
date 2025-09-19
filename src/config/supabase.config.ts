// src/config/supabase.config.ts
import { registerAs } from '@nestjs/config'

export interface SupabaseConfig {
  url: string
  apiKey: string
  bucketName: string
}

export default registerAs('supabase', (): SupabaseConfig => ({
  url: process.env.PROJECT_SUPABASE_URL || '',
  apiKey: process.env.API_SUPABASE_KEY || '',
  bucketName: process.env.SUPABASE_BUCKET_NAME || 'uploads', // Default bucket name
}))