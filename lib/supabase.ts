import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://pbdlgejiewgymyoqombx.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZGxnZWppZXdneW15b3FvbWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTcyMjgsImV4cCI6MjA2OTEzMzIyOH0.pNXlMCyfMza6CgvUIj_oi6fqUAlTZ6eQfGQiR4FbUqE"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("credit_cards").select("count", { count: "exact" })
    if (error) {
      console.error("❌ Database connection error:", error.message)
      return { success: false, error: error.message }
    }
    console.log("✅ Database connected successfully!")
    return { success: true, count: data }
  } catch (err) {
    console.error("❌ Connection test failed:", err)
    return { success: false, error: "Connection failed" }
  }
}

// Database types
export interface Database {
  public: {
    Tables: {
      credit_cards: {
        Row: {
          id: string
          user_id: string
          name: string
          bank: string
          last_four_digits: string
          credit_limit: number
          current_balance: number
          due_date: string
          min_payment: number
          interest_rate: number
          reward_type: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          bank: string
          last_four_digits: string
          credit_limit: number
          current_balance: number
          due_date: string
          min_payment: number
          interest_rate: number
          reward_type: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          bank?: string
          last_four_digits?: string
          credit_limit?: number
          current_balance?: number
          due_date?: string
          min_payment?: number
          interest_rate?: number
          reward_type?: string
          color?: string
          created_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          card_id: string
          title: string
          description: string
          category: string
          cashback: number
          expiry_date: string
          is_active: boolean
          min_spend: number | null
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          title: string
          description: string
          category: string
          cashback: number
          expiry_date: string
          is_active?: boolean
          min_spend?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          title?: string
          description?: string
          category?: string
          cashback?: number
          expiry_date?: string
          is_active?: boolean
          min_spend?: number | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          card_id: string
          user_id: string
          amount: number
          description: string
          category: string
          date: string
          merchant: string
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          user_id: string
          amount: number
          description: string
          category: string
          date: string
          merchant: string
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          user_id?: string
          amount?: number
          description?: string
          category?: string
          date?: string
          merchant?: string
          created_at?: string
        }
      }
    }
  }
}
