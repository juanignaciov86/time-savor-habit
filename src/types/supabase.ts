
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          name: string
          description: string
          color: string
          createdAt: number
          userId: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          color: string
          createdAt?: number
          userId: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          color?: string
          createdAt?: number
          userId?: string
        }
      }
    }
  }
}
