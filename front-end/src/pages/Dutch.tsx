"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for a Dutch auction item
const auctionItem = {
  id: 3,
  name: "Antique Wooden Desk",
  description:
    "19th century mahogany writing desk with intricate carvings and original brass hardware. This exquisite piece features three drawers with the original handles, a leather writing surface, and secret compartments typical of fine furniture from this period. The desk has been professionally restored to preserve its historical integrity while ensuring it remains functional for modern use.",
  currentPrice: 3500,
  shippingPrice: 150,
  image: "/placeholder.svg?height=400&width=600",
}

export default function Dutch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [auctionEnded, setAuctionEnded] = useState(false)

  const handleBuyNow = () => {
    // In a real app, this would call your buy now API
    console.log("Buying now at:", auctionItem.currentPrice)

    setAuctionEnded(true)
    toast.success("Purchase successful! Proceed to payment.")
  }

  const handleProceedToPayment = () => {
    navigate(`/auction-ended/${id}`)
  }

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border">
            <img src={auctionItem.image || "/placeholder.svg"} alt={auctionItem.name} className="w-full object-cover" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">{auctionItem.name}</h2>
            <p className="mt-2 text-muted-foreground">{auctionItem.description}</p>
          </div>
        </div>

        <div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  Dutch Auction
                </Badge>
                {auctionEnded && (
                  <Badge variant="destructive" className="px-3 py-1 text-sm">
                    Auction Ended
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current price</p>
                  <p className="text-3xl font-bold">${auctionItem.currentPrice.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Shipping</p>
                  <p className="font-medium">${auctionItem.shippingPrice.toLocaleString()}</p>
                </div>

                <Separator />

                {auctionEnded ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You've successfully purchased this item! Proceed to payment to complete your order.
                      </AlertDescription>
                    </Alert>

                    <Button className="w-full" onClick={handleProceedToPayment}>
                      Proceed to Payment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm">
                      In a Dutch auction, the price is fixed. Click "Buy Now" to purchase the item immediately and end
                      the auction.
                    </p>

                    <Button className="w-full" onClick={handleBuyNow}>
                      Buy Now
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

