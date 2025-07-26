import { supabase } from "./supabase"
import type { Database } from "./supabase"

type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"]
type CreditCardInsert = Database["public"]["Tables"]["credit_cards"]["Insert"]
type CreditCardUpdate = Database["public"]["Tables"]["credit_cards"]["Update"]

type Offer = Database["public"]["Tables"]["offers"]["Row"]
type OfferInsert = Database["public"]["Tables"]["offers"]["Insert"]
type OfferUpdate = Database["public"]["Tables"]["offers"]["Update"]

type Expense = Database["public"]["Tables"]["expenses"]["Row"]
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"]
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"]

// Credit Cards
export const getCreditCards = async (userId: string): Promise<CreditCard[]> => {
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching credit cards:", error)
    return []
  }

  return data || []
}

export const addCreditCard = async (card: CreditCardInsert): Promise<CreditCard | null> => {
  const { data, error } = await supabase.from("credit_cards").insert(card).select().single()

  if (error) {
    console.error("Error adding credit card:", error)
    return null
  }

  return data
}

export const updateCreditCard = async (id: string, updates: CreditCardUpdate): Promise<CreditCard | null> => {
  const { data, error } = await supabase.from("credit_cards").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating credit card:", error)
    return null
  }

  return data
}

export const deleteCreditCard = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("credit_cards").delete().eq("id", id)

  if (error) {
    console.error("Error deleting credit card:", error)
    return false
  }

  return true
}

// Offers
export const getOffers = async (cardId?: string): Promise<Offer[]> => {
  let query = supabase.from("offers").select(`
      *,
      credit_cards!inner(user_id)
    `)

  if (cardId) {
    query = query.eq("card_id", cardId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching offers:", error)
    return []
  }

  return data || []
}

export const addOffer = async (offer: OfferInsert): Promise<Offer | null> => {
  const { data, error } = await supabase.from("offers").insert(offer).select().single()

  if (error) {
    console.error("Error adding offer:", error)
    return null
  }

  return data
}

export const updateOffer = async (id: string, updates: OfferUpdate): Promise<Offer | null> => {
  const { data, error } = await supabase.from("offers").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating offer:", error)
    return null
  }

  return data
}

export const deleteOffer = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("offers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting offer:", error)
    return false
  }

  return true
}

// Expenses
export const getExpenses = async (userId: string, cardId?: string): Promise<Expense[]> => {
  let query = supabase.from("expenses").select("*").eq("user_id", userId)

  if (cardId) {
    query = query.eq("card_id", cardId)
  }

  const { data, error } = await query.order("date", { ascending: false })

  if (error) {
    console.error("Error fetching expenses:", error)
    return []
  }

  return data || []
}

export const addExpense = async (expense: ExpenseInsert): Promise<Expense | null> => {
  const { data, error } = await supabase.from("expenses").insert(expense).select().single()

  if (error) {
    console.error("Error adding expense:", error)
    return null
  }

  return data
}

export const updateExpense = async (id: string, updates: ExpenseUpdate): Promise<Expense | null> => {
  const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating expense:", error)
    return null
  }

  return data
}

export const deleteExpense = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) {
    console.error("Error deleting expense:", error)
    return false
  }

  return true
}

// Analytics
export const getExpensesByCategory = async (userId: string) => {
  const { data, error } = await supabase.from("expenses").select("category, amount").eq("user_id", userId)

  if (error) {
    console.error("Error fetching expenses by category:", error)
    return []
  }

  // Group by category
  const categoryTotals = data.reduce((acc: Record<string, number>, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {})

  return Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
  }))
}

export const getMonthlySpending = async (userId: string) => {
  const { data, error } = await supabase
    .from("expenses")
    .select("date, amount")
    .eq("user_id", userId)
    .gte("date", new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().split("T")[0])

  if (error) {
    console.error("Error fetching monthly spending:", error)
    return []
  }

  // Group by month
  const monthlyTotals = data.reduce((acc: Record<string, number>, expense) => {
    const month = expense.date.substring(0, 7) // YYYY-MM format
    acc[month] = (acc[month] || 0) + expense.amount
    return acc
  }, {})

  return Object.entries(monthlyTotals)
    .map(([month, amount]) => ({
      month,
      amount,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
