"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"
import { Plus, CreditCardIcon, Calendar, DollarSign, Percent, Edit, Trash2, AlertTriangle } from "lucide-react"
import { getCreditCards, addCreditCard, updateCreditCard, deleteCreditCard } from "@/lib/database"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/lib/supabase"

type CreditCardRow = Database["public"]["Tables"]["credit_cards"]["Row"]
type CreditCardInsert = Database["public"]["Tables"]["credit_cards"]["Insert"]

const INDIAN_BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Yes Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "IDFC First Bank",
  "RBL Bank",
  "Federal Bank",
  "South Indian Bank",
  "HSBC India",
  "Standard Chartered",
  "Citibank India",
  "American Express",
  "Other",
]

const REWARD_TYPES = [
  { value: "cashback", label: "Cashback" },
  { value: "reward_points", label: "Reward Points" },
  { value: "miles", label: "Air Miles" },
  { value: "fuel_points", label: "Fuel Points" },
  { value: "none", label: "No Rewards" },
]

const CARD_COLORS = [
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#f97316",
  "#ea580c",
  "#c2410c",
  "#9a3412",
  "#eab308",
  "#ca8a04",
  "#a16207",
  "#854d0e",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#166534",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#8b5cf6",
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
  "#ec4899",
  "#db2777",
  "#be185d",
  "#9d174d",
]

export function CardsManager() {
  const { user } = useAuth()
  const [cards, setCards] = useState<CreditCardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardRow | null>(null)
  const [formData, setFormData] = useState<Partial<CreditCardInsert>>({
    name: "",
    bank: "",
    last_four_digits: "",
    credit_limit: 0,
    current_balance: 0,
    due_date: "",
    min_payment: 0,
    interest_rate: 0,
    reward_type: "cashback",
    color: "#ef4444",
  })

  useEffect(() => {
    if (user) {
      loadCards()
    }
  }, [user])

  const loadCards = async () => {
    if (!user) return
    setLoading(true)
    const data = await getCreditCards(user.id)
    setCards(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const cardData = {
      ...formData,
      user_id: user.id,
      credit_limit: Number(formData.credit_limit),
      current_balance: Number(formData.current_balance),
      min_payment: Number(formData.min_payment),
      interest_rate: Number(formData.interest_rate),
    } as CreditCardInsert

    if (editingCard) {
      const updated = await updateCreditCard(editingCard.id, cardData)
      if (updated) {
        setCards(cards.map((card) => (card.id === editingCard.id ? updated : card)))
      }
    } else {
      const newCard = await addCreditCard(cardData)
      if (newCard) {
        setCards([newCard, ...cards])
      }
    }

    resetForm()
  }

  const handleEdit = (card: CreditCardRow) => {
    setEditingCard(card)
    setFormData({
      name: card.name,
      bank: card.bank,
      last_four_digits: card.last_four_digits,
      credit_limit: card.credit_limit,
      current_balance: card.current_balance,
      due_date: card.due_date,
      min_payment: card.min_payment,
      interest_rate: card.interest_rate,
      reward_type: card.reward_type,
      color: card.color,
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this card?")) {
      const success = await deleteCreditCard(id)
      if (success) {
        setCards(cards.filter((card) => card.id !== id))
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      bank: "",
      last_four_digits: "",
      credit_limit: 0,
      current_balance: 0,
      due_date: "",
      min_payment: 0,
      interest_rate: 0,
      reward_type: "cashback",
      color: "#ef4444",
    })
    setEditingCard(null)
    setIsAddDialogOpen(false)
  }

  const getUtilizationPercentage = (current: number, limit: number) => {
    return limit > 0 ? (current / limit) * 100 : 0
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return "text-red-600"
    if (percentage >= 60) return "text-orange-600"
    return "text-green-600"
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Credit Cards</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Credit Cards</h2>
          <p className="text-gray-600">Manage your credit cards and track utilization</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white border-red-100">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                {editingCard ? "Edit Credit Card" : "Add New Credit Card"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingCard ? "Update your credit card information" : "Add a new credit card to track"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    Card Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., HDFC Regalia"
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank" className="text-gray-700">
                    Bank
                  </Label>
                  <Select value={formData.bank} onValueChange={(value) => setFormData({ ...formData, bank: value })}>
                    <SelectTrigger className="border-red-200 focus:border-red-400">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-red-100">
                      {INDIAN_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="last_four_digits" className="text-gray-700">
                    Last 4 Digits
                  </Label>
                  <Input
                    id="last_four_digits"
                    value={formData.last_four_digits}
                    onChange={(e) => setFormData({ ...formData, last_four_digits: e.target.value.slice(0, 4) })}
                    placeholder="1234"
                    maxLength={4}
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date" className="text-gray-700">
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credit_limit" className="text-gray-700">
                    Credit Limit (₹)
                  </Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                    placeholder="100000"
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_balance" className="text-gray-700">
                    Current Balance (₹)
                  </Label>
                  <Input
                    id="current_balance"
                    type="number"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: Number(e.target.value) })}
                    placeholder="25000"
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_payment" className="text-gray-700">
                    Min Payment (₹)
                  </Label>
                  <Input
                    id="min_payment"
                    type="number"
                    value={formData.min_payment}
                    onChange={(e) => setFormData({ ...formData, min_payment: Number(e.target.value) })}
                    placeholder="2500"
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest_rate" className="text-gray-700">
                    Interest Rate (%)
                  </Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                    placeholder="3.49"
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward_type" className="text-gray-700">
                    Reward Type
                  </Label>
                  <Select
                    value={formData.reward_type}
                    onValueChange={(value) => setFormData({ ...formData, reward_type: value })}
                  >
                    <SelectTrigger className="border-red-200 focus:border-red-400">
                      <SelectValue placeholder="Select reward type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-red-100">
                      {REWARD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-gray-700">
                    Card Color
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? "border-gray-900" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
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
                  {editingCard ? "Update Card" : "Add Card"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <Card className="bg-white border-red-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCardIcon className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Credit Cards</h3>
            <p className="text-gray-600 text-center mb-4">
              Add your first credit card to start tracking your expenses and utilization.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const utilizationPercentage = getUtilizationPercentage(card.current_balance, card.credit_limit)
            const daysUntilDue = getDaysUntilDue(card.due_date)

            return (
              <Card key={card.id} className="bg-white border-red-100 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-8 rounded-sm" style={{ backgroundColor: card.color }} />
                      <div>
                        <CardTitle className="text-lg text-gray-900">{card.name}</CardTitle>
                        <CardDescription className="text-gray-600">
                          {card.bank} •••• {card.last_four_digits}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(card)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(card.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilization</span>
                      <span className={`font-medium ${getUtilizationColor(utilizationPercentage)}`}>
                        {utilizationPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={utilizationPercentage}
                      className="h-2"
                      style={{
                        background:
                          utilizationPercentage >= 80 ? "#fee2e2" : utilizationPercentage >= 60 ? "#fef3c7" : "#f0fdf4",
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>₹{card.current_balance.toLocaleString()}</span>
                      <span>₹{card.credit_limit.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due Date
                      </div>
                      <div className="font-medium text-gray-900">
                        {new Date(card.due_date).toLocaleDateString()}
                        {daysUntilDue <= 7 && (
                          <Badge variant="destructive" className="ml-2 text-xs bg-red-100 text-red-700">
                            {daysUntilDue <= 0 ? "Overdue" : `${daysUntilDue}d left`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Min Payment
                      </div>
                      <div className="font-medium text-gray-900">₹{card.min_payment.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-600">
                        <Percent className="h-3 w-3 mr-1" />
                        Interest Rate
                      </div>
                      <div className="font-medium text-gray-900">{card.interest_rate}% APR</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-600">Rewards</div>
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        {REWARD_TYPES.find((type) => type.value === card.reward_type)?.label || card.reward_type}
                      </Badge>
                    </div>
                  </div>

                  {utilizationPercentage >= 80 && (
                    <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-700">High utilization may affect credit score</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
