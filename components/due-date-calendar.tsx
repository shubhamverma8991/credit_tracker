"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { getCreditCards } from "@/lib/database"
import { useAuth } from "@/hooks/use-auth"
import type { DueDateInfo } from "@/types/DueDateInfo" // Declare the DueDateInfo variable

export function DueDateCalendar() {
  const { user } = useAuth()
  const [cards, setCards] = useState<DueDateInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadCards()
    }
  }, [user])

  const loadCards = async () => {
    if (!user) return
    setLoading(true)
    const data = await getCreditCards(user.id)

    const cardsWithDueDates = data.map((card) => {
      const today = new Date()
      const dueDate = new Date(card.due_date)
      const diffTime = dueDate.getTime() - today.getTime()
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let status: "overdue" | "due_soon" | "upcoming" | "paid" = "upcoming"
      if (daysUntilDue < 0) {
        status = "overdue"
      } else if (daysUntilDue <= 3) {
        status = "due_soon"
      } else if (daysUntilDue <= 7) {
        status = "upcoming"
      }

      return {
        ...card,
        daysUntilDue,
        status,
      }
    })

    // Sort by days until due (overdue first, then ascending)
    cardsWithDueDates.sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1
      if (b.status === "overdue" && a.status !== "overdue") return 1
      return a.daysUntilDue - b.daysUntilDue
    })

    setCards(cardsWithDueDates)
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200"
      case "due_soon":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "upcoming":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <AlertTriangle className="h-4 w-4" />
      case "due_soon":
        return <Clock className="h-4 w-4" />
      case "upcoming":
        return <Calendar className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getStatusText = (card: DueDateInfo) => {
    if (card.daysUntilDue < 0) {
      return `${Math.abs(card.daysUntilDue)} days overdue`
    } else if (card.daysUntilDue === 0) {
      return "Due today"
    } else if (card.daysUntilDue === 1) {
      return "Due tomorrow"
    } else {
      return `Due in ${card.daysUntilDue} days`
    }
  }

  if (loading) {
    return (
      <Card className="bg-white border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Calendar className="h-5 w-5 mr-2" />
            Due Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
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
        <CardTitle className="flex items-center text-gray-900">
          <Calendar className="h-5 w-5 mr-2 text-red-600" />
          Due Dates
        </CardTitle>
        <CardDescription className="text-gray-600">Upcoming payment due dates for your credit cards</CardDescription>
      </CardHeader>
      <CardContent>
        {cards.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">No credit cards found</p>
            <p className="text-sm text-gray-500">Add credit cards to track due dates</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-4 bg-white border border-red-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-8 rounded-sm flex-shrink-0" style={{ backgroundColor: card.color }} />
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{card.name}</h3>
                      <span className="text-sm text-gray-500">•••• {card.last_four_digits}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Due: {new Date(card.due_date).toLocaleDateString()}</span>
                      <span>Min Payment: ₹{card.min_payment.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={`${getStatusColor(card.status)} flex items-center space-x-1`}>
                    {getStatusIcon(card.status)}
                    <span>{getStatusText(card)}</span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {cards.some((card) => card.status === "overdue" || card.status === "due_soon") && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Payment Reminder</h4>
                <p className="text-sm text-red-700">
                  You have {cards.filter((card) => card.status === "overdue").length} overdue and{" "}
                  {cards.filter((card) => card.status === "due_soon").length} upcoming payments. Make sure to pay on
                  time to avoid late fees and maintain your credit score.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
