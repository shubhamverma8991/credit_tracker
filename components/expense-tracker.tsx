"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Receipt, Calendar, DollarSign, Store, Edit, Trash2, Filter } from "lucide-react"
import { getCreditCards, getExpenses, addExpense, updateExpense, deleteExpense } from "@/lib/database"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/lib/supabase"
import { CreditCard } from "@/components/ui/credit-card" // Import CreditCard component

type CreditCardType = Database["public"]["Tables"]["credit_cards"]["Row"]
type Expense = Database["public"]["Tables"]["expenses"]["Row"]
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"]

const EXPENSE_CATEGORIES = [
  "grocery",
  "dining",
  "shopping",
  "fuel",
  "entertainment",
  "travel",
  "healthcare",
  "utilities",
  "education",
  "insurance",
  "investment",
  "other",
]

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

export function ExpenseTracker() {
  const { user } = useAuth()
  const [cards, setCards] = useState<CreditCardType[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [selectedCard, setSelectedCard] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [formData, setFormData] = useState<Partial<ExpenseInsert>>({
    card_id: "",
    amount: 0,
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    merchant: "",
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const [cardsData, expensesData] = await Promise.all([getCreditCards(user.id), getExpenses(user.id)])
    setCards(cardsData)
    setExpenses(expensesData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const expenseData = {
      ...formData,
      user_id: user.id,
      amount: Number(formData.amount),
    } as ExpenseInsert

    if (editingExpense) {
      const updated = await updateExpense(editingExpense.id, expenseData)
      if (updated) {
        setExpenses(expenses.map((expense) => (expense.id === editingExpense.id ? updated : expense)))
      }
    } else {
      const newExpense = await addExpense(expenseData)
      if (newExpense) {
        setExpenses([newExpense, ...expenses])
      }
    }

    resetForm()
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      card_id: expense.card_id,
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: expense.date,
      merchant: expense.merchant,
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const success = await deleteExpense(id)
      if (success) {
        setExpenses(expenses.filter((expense) => expense.id !== id))
      }
    }
  }

  const resetForm = () => {
    setFormData({
      card_id: "",
      amount: 0,
      description: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      merchant: "",
    })
    setEditingExpense(null)
    setIsAddDialogOpen(false)
  }

  const filteredExpenses = expenses.filter((expense) => {
    const cardMatch = selectedCard === "all" || expense.card_id === selectedCard
    const categoryMatch = selectedCategory === "all" || expense.category === selectedCategory
    return cardMatch && categoryMatch
  })

  const getCardName = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId)
    return card ? `${card.name} •••• ${card.last_four_digits}` : "Unknown Card"
  }

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-600">Track and manage your credit card expenses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white border-red-100">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingExpense ? "Update your expense information" : "Record a new expense transaction"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card_id" className="text-gray-700">
                    Credit Card
                  </Label>
                  <Select
                    value={formData.card_id}
                    onValueChange={(value) => setFormData({ ...formData, card_id: value })}
                  >
                    <SelectTrigger className="border-red-200 focus:border-red-400">
                      <SelectValue placeholder="Select card" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-red-100">
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name} •••• {card.last_four_digits}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-gray-700">
                    Amount (₹)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="1000.00"
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Grocery shopping"
                  required
                  className="border-red-200 focus:border-red-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-700">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="border-red-200 focus:border-red-400">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-red-100">
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }}
                            />
                            <span className="capitalize">{category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-700">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchant" className="text-gray-700">
                  Merchant (Optional)
                </Label>
                <Input
                  id="merchant"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="e.g., Amazon, Big Bazaar"
                  className="border-red-200 focus:border-red-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-red-200 text-gray-700 hover:bg-red-50 bg-transparent"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800 text-white">
                  {editingExpense ? "Update Expense" : "Add Expense"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Summary */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1 bg-white border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">₹{getTotalExpenses().toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedCard} onValueChange={setSelectedCard}>
            <SelectTrigger className="w-full sm:w-48 border-red-200">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by card" />
            </SelectTrigger>
            <SelectContent className="bg-white border-red-100">
              <SelectItem value="all">All Cards</SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name} •••• {card.last_four_digits}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 border-red-200">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-red-100">
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }}
                    />
                    <span className="capitalize">{category}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <Card className="bg-white border-red-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Expenses Found</h3>
            <p className="text-gray-600 text-center mb-4">
              {expenses.length === 0
                ? "Start tracking your expenses by adding your first transaction."
                : "No expenses match your current filters. Try adjusting your selection."}
            </p>
            {expenses.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-black hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="bg-white border-red-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{expense.description}</h3>
                        <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          {expense.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <CreditCard /> {/* Use CreditCard component */}
                          {getCardName(expense.card_id)}
                        </div>
                        {expense.merchant && (
                          <div className="flex items-center">
                            <Store className="h-3 w-3 mr-1" />
                            {expense.merchant}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₹{expense.amount.toLocaleString()}</div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
