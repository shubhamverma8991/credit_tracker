"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCardIcon, TrendingUpIcon, CalendarIcon, GiftIcon, LogOut, User, Receipt, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardsManager } from "@/components/cards-manager"
import { ExpenseTracker } from "@/components/expense-tracker"
import { DueDateCalendar } from "@/components/due-date-calendar"
import { Analytics } from "@/components/analytics"
import { NotificationCenter } from "@/components/notification-center"
import { OffersManager } from "@/components/offers-manager"
import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/hooks/use-auth"
import { getCreditCards, getExpenses } from "@/lib/database"
import { supabase } from "@/lib/supabaseClient"

// Add this function to test database connection
const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("credit_cards").select("count", { count: "exact" })
    if (error) {
      console.error("Database connection error:", error)
      return false
    }
    console.log("Database connected successfully!")
    return true
  } catch (err) {
    console.error("Connection test failed:", err)
    return false
  }
}

export interface CreditCard {
  id: string
  name: string
  bank: string
  lastFourDigits: string
  creditLimit: number
  currentBalance: number
  dueDate: string
  minPayment: number
  interestRate: number
  rewardType: string
  offers: Offer[]
  color: string
}

export interface Offer {
  id: string
  title: string
  description: string
  category: string
  cashback: number
  expiryDate: string
  isActive: boolean
  minSpend?: number
}

export interface Expense {
  id: string
  cardId: string
  amount: number
  description: string
  category: string
  date: string
  merchant: string
}

export default function CreditCardTracker() {
  const { user, loading, signOut } = useAuth()
  const [cards, setCards] = useState<CreditCard[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("cards")

  // Load data from database when user is authenticated
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      setDataLoading(true)
      const [cardsData, expensesData] = await Promise.all([getCreditCards(user.id), getExpenses(user.id)])

      setCards(cardsData)
      setExpenses(expensesData)
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  // Generate notifications based on due dates and offers
  useEffect(() => {
    const today = new Date()
    const newNotifications = []

    cards.forEach((card) => {
      const dueDate = new Date(card.dueDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

      if (daysUntilDue <= 7 && daysUntilDue > 0) {
        newNotifications.push({
          id: `due-${card.id}`,
          type: "due-date",
          title: `Payment Due Soon`,
          message: `${card.name} payment of ₹${card.minPayment.toLocaleString("en-IN")} due in ${daysUntilDue} days`,
          priority: daysUntilDue <= 3 ? "high" : "medium",
          cardId: card.id,
        })
      }

      // Check for expiring offers
      card.offers.forEach((offer) => {
        const expiryDate = new Date(offer.expiryDate)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0 && offer.isActive) {
          newNotifications.push({
            id: `offer-${offer.id}`,
            type: "offer-expiry",
            title: `Offer Expiring Soon`,
            message: `${offer.title} on ${card.name} expires in ${daysUntilExpiry} days`,
            priority: daysUntilExpiry <= 7 ? "high" : "low",
            cardId: card.id,
          })
        }
      })
    })

    setNotifications(newNotifications)
  }, [cards])

  const handleSignOut = async () => {
    await signOut()
    setCards([])
    setExpenses([])
    setNotifications([])
  }

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />
  }

  const totalCreditLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0)
  const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0)
  const totalAvailable = totalCreditLimit - totalBalance
  const utilizationRate = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0

  const activeOffers = cards.reduce((sum, card) => sum + card.offers.filter((offer) => offer.isActive).length, 0)
  const upcomingDueDates = cards.filter((card) => {
    const dueDate = new Date(card.dueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return daysUntilDue <= 7 && daysUntilDue > 0
  }).length

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate monthly spending trend for real data
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

  const currentMonthExpenses = expenses.filter((expense) => expense.date.startsWith(currentMonth))
  const lastMonthExpenses = expenses.filter((expense) => expense.date.startsWith(lastMonth))

  const currentMonthSpending = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const lastMonthSpending = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const monthlyChange =
    lastMonthSpending > 0 ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 : 0
  const hasMonthlyData = currentMonthExpenses.length > 0 || lastMonthExpenses.length > 0

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-[20px] border-b border-red-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-[20%] flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CardTracker Pro</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Manage your credit cards smartly</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-red-200 text-gray-700 hover:bg-red-50 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white/60 backdrop-blur-[20px] border border-red-100 rounded-2xl p-2">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-transparent gap-1">
              <TabsTrigger
                value="cards"
                className="flex items-center space-x-2 data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-xl"
              >
                <CreditCardIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="flex items-center space-x-2 data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-xl"
              >
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Expenses</span>
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="flex items-center space-x-2 data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-xl"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Due Dates</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center space-x-2 data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-xl"
              >
                <TrendingUpIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="offers"
                className="flex items-center space-x-2 data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-xl"
              >
                <GiftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Offers</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center space-x-2 data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-xl"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="bg-white/40 backdrop-blur-[10px] border border-red-100 rounded-2xl p-6">
            <TabsContent value="cards" className="mt-0">
              <CardsManager cards={cards} setCards={setCards} />
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <ExpenseTracker cards={cards} expenses={expenses} setExpenses={setExpenses} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <DueDateCalendar cards={cards} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Analytics cards={cards} expenses={expenses} />
            </TabsContent>

            <TabsContent value="offers" className="mt-0">
              <OffersManager cards={cards} />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationCenter notifications={notifications} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
