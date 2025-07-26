"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, PieChart, TrendingUp, DollarSign, CreditCardIcon, Target } from "lucide-react"
import { getCreditCards, getExpenses, getExpensesByCategory, getMonthlySpending } from "@/lib/database"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/lib/supabase"

type Expense = Database["public"]["Tables"]["expenses"]["Row"]

interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface MonthlyData {
  month: string
  amount: number
}

const CATEGORY_COLORS = {
  grocery: "#22c55e",
  dining: "#f97316",
  shopping: "#ec4899",
  fuel: "#eab308",
  entertainment: "#8b5cf6",
  travel: "#06b6d4",
  healthcare: "#ef4444",
  utilities: "#64748b",
  education: "#3b82f6",
  insurance: "#10b981",
  investment: "#f59e0b",
  other: "#6b7280",
}

export function Analytics() {
  const { user } = useAuth()
  const [cards, setCards] = useState<any[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, selectedPeriod])

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    const [cardsData, expensesData, categoryExpenses, monthlyExpenses] = await Promise.all([
      getCreditCards(user.id),
      getExpenses(user.id),
      getExpensesByCategory(user.id),
      getMonthlySpending(user.id),
    ])

    setCards(cardsData)
    setExpenses(expensesData)

    // Process category data
    const totalAmount = categoryExpenses.reduce((sum, cat) => sum + cat.amount, 0)
    const processedCategoryData = categoryExpenses
      .map((cat) => ({
        category: cat.category,
        amount: cat.amount,
        percentage: totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0,
        color: CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || "#6b7280",
      }))
      .sort((a, b) => b.amount - a.amount)

    setCategoryData(processedCategoryData)
    setMonthlyData(monthlyExpenses)
    setLoading(false)
  }

  const getFilteredExpenses = () => {
    const days = Number.parseInt(selectedPeriod)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return expenses.filter((expense) => new Date(expense.date) >= cutoffDate)
  }

  const getTotalSpending = () => {
    return getFilteredExpenses().reduce((total, expense) => total + expense.amount, 0)
  }

  const getAverageTransaction = () => {
    const filtered = getFilteredExpenses()
    return filtered.length > 0 ? getTotalSpending() / filtered.length : 0
  }

  const getTotalUtilization = () => {
    const totalLimit = cards.reduce((sum, card) => sum + card.credit_limit, 0)
    const totalBalance = cards.reduce((sum, card) => sum + card.current_balance, 0)
    return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0
  }

  const getTopSpendingCard = () => {
    const cardSpending = cards.map((card) => {
      const cardExpenses = getFilteredExpenses().filter((expense) => expense.card_id === card.id)
      const totalSpent = cardExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      return { card, totalSpent }
    })

    return cardSpending.reduce((max, current) => (current.totalSpent > max.totalSpent ? current : max), {
      card: null,
      totalSpent: 0,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalSpending = getTotalSpending()
  const averageTransaction = getAverageTransaction()
  const totalUtilization = getTotalUtilization()
  const topSpendingCard = getTopSpendingCard()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-600">Insights into your spending patterns and credit utilization</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48 border-red-200">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-white border-red-100">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spending</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalSpending.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-gray-900">₹{averageTransaction.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credit Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{totalUtilization.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <CreditCardIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Cards</p>
                <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <Target className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card className="bg-white border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <PieChart className="h-5 w-5 mr-2 text-red-600" />
              Spending by Category
            </CardTitle>
            <CardDescription className="text-gray-600">
              Breakdown of expenses by category for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-600">No spending data available</p>
                <p className="text-sm text-gray-500">Add some expenses to see category breakdown</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryData.slice(0, 6).map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-sm font-medium text-gray-900 capitalize">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">₹{category.amount.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-2">{category.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress
                      value={category.percentage}
                      className="h-2"
                      style={{ backgroundColor: `${category.color}20` }}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Performance */}
        <Card className="bg-white border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <CreditCardIcon className="h-5 w-5 mr-2 text-red-600" />
              Card Performance
            </CardTitle>
            <CardDescription className="text-gray-600">Credit utilization and spending by card</CardDescription>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <div className="text-center py-8">
                <CreditCardIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-600">No credit cards found</p>
                <p className="text-sm text-gray-500">Add credit cards to see performance metrics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cards.map((card) => {
                  const cardExpenses = getFilteredExpenses().filter((expense) => expense.card_id === card.id)
                  const cardSpending = cardExpenses.reduce((sum, expense) => sum + expense.amount, 0)
                  const utilization = card.credit_limit > 0 ? (card.current_balance / card.credit_limit) * 100 : 0

                  return (
                    <div key={card.id} className="p-4 border border-red-100 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-8 rounded-sm" style={{ backgroundColor: card.color }} />
                          <div>
                            <h3 className="font-medium text-gray-900">{card.name}</h3>
                            <p className="text-sm text-gray-600">•••• {card.last_four_digits}</p>
                          </div>
                        </div>
                        <Badge
                          className={`${
                            utilization >= 80
                              ? "bg-red-100 text-red-800"
                              : utilization >= 60
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {utilization.toFixed(1)}% utilized
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Spending ({selectedPeriod} days)</span>
                          <span className="font-medium text-gray-900">₹{cardSpending.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current Balance</span>
                          <span className="font-medium text-gray-900">₹{card.current_balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Available Credit</span>
                          <span className="font-medium text-gray-900">
                            ₹{(card.credit_limit - card.current_balance).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Spending Card Highlight */}
      {topSpendingCard.card && topSpendingCard.totalSpent > 0 && (
        <Card className="bg-gradient-to-r from-red-50 to-white border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Top Spending Card</h3>
                  <p className="text-gray-600">
                    {topSpendingCard.card.name} has the highest spending in the last {selectedPeriod} days
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">₹{topSpendingCard.totalSpent.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
