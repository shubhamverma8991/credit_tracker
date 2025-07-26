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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Gift, Calendar, Percent, DollarSign, Edit, Trash2, AlertTriangle } from "lucide-react"
import { getCreditCards, getOffers, addOffer, updateOffer, deleteOffer } from "@/lib/database"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/lib/supabase"

type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"]
type Offer = Database["public"]["Tables"]["offers"]["Row"]
type OfferInsert = Database["public"]["Tables"]["offers"]["Insert"]

const OFFER_CATEGORIES = [
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

export function OffersManager() {
  const { user } = useAuth()
  const [cards, setCards] = useState<CreditCard[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [selectedCard, setSelectedCard] = useState<string>("all")
  const [formData, setFormData] = useState<Partial<OfferInsert>>({
    card_id: "",
    title: "",
    description: "",
    category: "",
    cashback: 0,
    expiry_date: "",
    is_active: true,
    min_spend: 0,
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const [cardsData, offersData] = await Promise.all([getCreditCards(user.id), getOffers()])
    setCards(cardsData)
    setOffers(offersData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const offerData = {
      ...formData,
      cashback: Number(formData.cashback),
      min_spend: formData.min_spend ? Number(formData.min_spend) : null,
    } as OfferInsert

    if (editingOffer) {
      const updated = await updateOffer(editingOffer.id, offerData)
      if (updated) {
        setOffers(offers.map((offer) => (offer.id === editingOffer.id ? updated : offer)))
      }
    } else {
      const newOffer = await addOffer(offerData)
      if (newOffer) {
        setOffers([newOffer, ...offers])
      }
    }

    resetForm()
  }

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer)
    setFormData({
      card_id: offer.card_id,
      title: offer.title,
      description: offer.description,
      category: offer.category,
      cashback: offer.cashback,
      expiry_date: offer.expiry_date,
      is_active: offer.is_active,
      min_spend: offer.min_spend,
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      const success = await deleteOffer(id)
      if (success) {
        setOffers(offers.filter((offer) => offer.id !== id))
      }
    }
  }

  const toggleOfferStatus = async (offer: Offer) => {
    const updated = await updateOffer(offer.id, { is_active: !offer.is_active })
    if (updated) {
      setOffers(offers.map((o) => (o.id === offer.id ? updated : o)))
    }
  }

  const resetForm = () => {
    setFormData({
      card_id: "",
      title: "",
      description: "",
      category: "",
      cashback: 0,
      expiry_date: "",
      is_active: true,
      min_spend: 0,
    })
    setEditingOffer(null)
    setIsAddDialogOpen(false)
  }

  const getCardName = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId)
    return card ? `${card.name} •••• ${card.last_four_digits}` : "Unknown Card"
  }

  const isOfferExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredOffers = offers.filter((offer) => {
    if (selectedCard === "all") return true
    return offer.card_id === selectedCard
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Offers</h2>
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
          <h2 className="text-2xl font-bold text-gray-900">Offers & Rewards</h2>
          <p className="text-gray-600">Manage cashback offers and reward programs for your cards</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedCard} onValueChange={setSelectedCard}>
            <SelectTrigger className="w-full sm:w-48 border-red-200">
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white border-red-100">
              <DialogHeader>
                <DialogTitle className="text-gray-900">{editingOffer ? "Edit Offer" : "Add New Offer"}</DialogTitle>
                <DialogDescription className="text-gray-600">
                  {editingOffer ? "Update offer details" : "Create a new cashback offer or reward program"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="title" className="text-gray-700">
                    Offer Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Grocery Cashback Offer"
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the offer details..."
                    className="border-red-200 focus:border-red-400"
                    rows={3}
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
                        {OFFER_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            <span className="capitalize">{category}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashback" className="text-gray-700">
                      Cashback (%)
                    </Label>
                    <Input
                      id="cashback"
                      type="number"
                      step="0.01"
                      value={formData.cashback}
                      onChange={(e) => setFormData({ ...formData, cashback: Number(e.target.value) })}
                      placeholder="5.00"
                      required
                      className="border-red-200 focus:border-red-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date" className="text-gray-700">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      required
                      className="border-red-200 focus:border-red-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_spend" className="text-gray-700">
                      Min Spend (₹)
                    </Label>
                    <Input
                      id="min_spend"
                      type="number"
                      value={formData.min_spend || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, min_spend: e.target.value ? Number(e.target.value) : null })
                      }
                      placeholder="1000 (optional)"
                      className="border-red-200 focus:border-red-400"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="text-gray-700">
                    Active Offer
                  </Label>
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
                    {editingOffer ? "Update Offer" : "Add Offer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredOffers.length === 0 ? (
        <Card className="bg-white border-red-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Offers Found</h3>
            <p className="text-gray-600 text-center mb-4">
              {offers.length === 0
                ? "Add your first cashback offer or reward program to start tracking benefits."
                : "No offers match your current filter. Try selecting a different card."}
            </p>
            {offers.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-black hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Offer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => {
            const expired = isOfferExpired(offer.expiry_date)
            const daysUntilExpiry = getDaysUntilExpiry(offer.expiry_date)

            return (
              <Card
                key={offer.id}
                className={`bg-white border-red-100 hover:shadow-lg transition-shadow ${expired ? "opacity-75" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 mb-1">{offer.title}</CardTitle>
                      <CardDescription className="text-gray-600">{getCardName(offer.card_id)}</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(offer)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(offer.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-50 text-red-700 border-red-200 capitalize">{offer.category}</Badge>
                    <div className="flex items-center space-x-2">
                      <Percent className="h-4 w-4 text-red-600" />
                      <span className="text-lg font-bold text-red-600">{offer.cashback}%</span>
                    </div>
                  </div>

                  {offer.description && <p className="text-sm text-gray-600">{offer.description}</p>}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expires
                      </div>
                      <span
                        className={`font-medium ${
                          expired ? "text-red-600" : daysUntilExpiry <= 7 ? "text-orange-600" : "text-gray-900"
                        }`}
                      >
                        {expired ? "Expired" : new Date(offer.expiry_date).toLocaleDateString()}
                      </span>
                    </div>

                    {offer.min_spend && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Min Spend
                        </div>
                        <span className="font-medium text-gray-900">₹{offer.min_spend.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={offer.is_active}
                        onCheckedChange={() => toggleOfferStatus(offer)}
                        disabled={expired}
                      />
                      <span className="text-sm text-gray-600">{offer.is_active ? "Active" : "Inactive"}</span>
                    </div>

                    {expired && (
                      <Badge variant="destructive" className="bg-red-100 text-red-700">
                        Expired
                      </Badge>
                    )}

                    {!expired && daysUntilExpiry <= 7 && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        {daysUntilExpiry <= 0 ? "Expires today" : `${daysUntilExpiry}d left`}
                      </Badge>
                    )}
                  </div>

                  {expired && (
                    <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-700">This offer has expired</span>
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
