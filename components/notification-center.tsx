"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Calendar, Gift, X, CheckCircle } from "lucide-react"
import { getCreditCards, getOffers } from "@/lib/database"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/lib/supabase"

type Offer = Database["public"]["Tables"]["offers"]["Row"]

interface Notification {
  id: string
  type: "due_date" | "high_utilization" | "offer_expiry" | "payment_reminder"
  title: string
  message: string
  priority: "high" | "medium" | "low"
  cardId?: string
  offerId?: string
  createdAt: Date
}

export function NotificationCenter() {
  const { user } = useAuth()
  const [cards, setCards] = useState<any[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())

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
    generateNotifications(cardsData, offersData)
    setLoading(false)
  }

  const generateNotifications = (cards: any[], offers: Offer[]) => {
    const newNotifications: Notification[] = []
    const today = new Date()

    // Due date notifications
    cards.forEach((card) => {
      const dueDate = new Date(card.due_date)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilDue <= 0) {
        newNotifications.push({
          id: `due-overdue-${card.id}`,
          type: "due_date",
          title: "Payment Overdue",
          message: `Your ${card.name} payment is ${Math.abs(daysUntilDue)} days overdue. Pay ₹${card.min_payment.toLocaleString()} immediately to avoid late fees.`,
          priority: "high",
          cardId: card.id,
          createdAt: today,
        })
      } else if (daysUntilDue <= 3) {
        newNotifications.push({
          id: `due-soon-${card.id}`,
          type: "due_date",
          title: "Payment Due Soon",
          message: `Your ${card.name} payment of ₹${card.min_payment.toLocaleString()} is due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}.`,
          priority: daysUntilDue === 1 ? "high" : "medium",
          cardId: card.id,
          createdAt: today,
        })
      }
    })

    // High utilization notifications
    cards.forEach((card) => {
      const utilization = card.credit_limit > 0 ? (card.current_balance / card.credit_limit) * 100 : 0

      if (utilization >= 80) {
        newNotifications.push({
          id: `utilization-${card.id}`,
          type: "high_utilization",
          title: "High Credit Utilization",
          message: `Your ${card.name} is ${utilization.toFixed(1)}% utilized. Consider paying down the balance to improve your credit score.`,
          priority: utilization >= 90 ? "high" : "medium",
          cardId: card.id,
          createdAt: today,
        })
      }
    })

    // Offer expiry notifications
    offers.forEach((offer) => {
      const expiryDate = new Date(offer.expiry_date)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (offer.is_active && daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        const card = cards.find((c) => c.id === offer.card_id)
        newNotifications.push({
          id: `offer-expiry-${offer.id}`,
          type: "offer_expiry",
          title: "Offer Expiring Soon",
          message: `${offer.title} on ${card?.name || "your card"} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}. Use it before ${expiryDate.toLocaleDateString()}.`,
          priority: daysUntilExpiry <= 3 ? "high" : "medium",
          cardId: offer.card_id,
          offerId: offer.id,
          createdAt: today,
        })
      }
    })

    // Sort by priority and date
    newNotifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    setNotifications(newNotifications)
  }

  const dismissNotification = (notificationId: string) => {
    setDismissedNotifications((prev) => new Set([...prev, notificationId]))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "due_date":
        return <Calendar className="h-5 w-5" />
      case "high_utilization":
        return <AlertTriangle className="h-5 w-5" />
      case "offer_expiry":
        return <Gift className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const visibleNotifications = notifications.filter((n) => !dismissedNotifications.has(n.id))

  if (loading) {
    return (
      <Card className="bg-white border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3 p-3 bg-gray-100 rounded-lg">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-red-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-900">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-red-600" />
            Notifications
            {visibleNotifications.length > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-700 border-red-200">{visibleNotifications.length}</Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription className="text-gray-600">
          Important alerts and reminders for your credit cards
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visibleNotifications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No new notifications at the moment.</p>
            <p className="text-sm text-gray-500 mt-1">We'll notify you of important updates and reminders.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                      <p className="text-sm text-gray-700">{notification.message}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            notification.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : notification.priority === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {notification.priority} priority
                        </Badge>
                        <span className="text-xs text-gray-500">{notification.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-6 w-6 p-0 hover:bg-white/50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {dismissedNotifications.size > 0 && (
          <div className="mt-4 pt-4 border-t border-red-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDismissedNotifications(new Set())}
              className="text-gray-600 border-red-200 hover:bg-red-50"
            >
              Show dismissed notifications ({dismissedNotifications.size})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
