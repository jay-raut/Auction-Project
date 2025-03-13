import { useParams, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Check, Download, Printer, Truck } from "lucide-react"

// Mock user data
const userData = {
  firstName: "John",
  lastName: "Doe",
  streetName: "Main Street",
  streetNumber: "123",
  city: "New York",
  country: "United States",
  postalCode: "10001",
}

// Mock auction data
const auctionItem = {
  id: 1,
  name: "Vintage Rolex Submariner",
  winningPrice: 5750,
  shippingPrice: 75,
  expeditedShippingPrice: 50,
  shippingDays: 5,
  expeditedShippingDays: 2,
  orderNumber: "ORD-" + Math.floor(100000 + Math.random() * 900000),
  paymentDate: new Date().toLocaleDateString(),
  image: "/placeholder.svg?height=200&width=300",
}

export default function Receipt() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const expeditedShipping = searchParams.get("expedited") === "true"

  const totalShippingCost = expeditedShipping
    ? auctionItem.shippingPrice + auctionItem.expeditedShippingPrice
    : auctionItem.shippingPrice

  const totalPrice = auctionItem.winningPrice + totalShippingCost

  const shippingDays = expeditedShipping ? auctionItem.expeditedShippingDays : auctionItem.shippingDays

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Confirmation</h1>
          <p className="text-muted-foreground mt-2">Thank you for your purchase!</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Order #{auctionItem.orderNumber}</CardTitle>
            <Badge className="mt-2 sm:mt-0 w-fit">
              <Check className="mr-1 h-3 w-3" />
              Payment Successful
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-2">Order Details</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Order Date:</span> {auctionItem.paymentDate}
                </p>
                <p>
                  <span className="text-muted-foreground">Order Number:</span> {auctionItem.orderNumber}
                </p>
                <p>
                  <span className="text-muted-foreground">Payment Method:</span> Credit Card (****1234)
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Shipping Address</h3>
              <div className="text-sm text-muted-foreground">
                <p>
                  {userData.firstName} {userData.lastName}
                </p>
                <p>
                  {userData.streetNumber} {userData.streetName}
                </p>
                <p>
                  {userData.city}, {userData.postalCode}
                </p>
                <p>{userData.country}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-md border flex-shrink-0">
                <img
                  src={auctionItem.image || "/placeholder.svg"}
                  alt={auctionItem.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium">{auctionItem.name}</h3>
                    <p className="text-sm text-muted-foreground">Auction #{id}</p>
                  </div>
                  <p className="font-medium mt-1 sm:mt-0">${auctionItem.winningPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${auctionItem.winningPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>${totalShippingCost.toLocaleString()}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-medium">Shipping Status</h3>
              <p className="text-sm text-muted-foreground">
                The item will be shipped in {shippingDays} days
                {expeditedShipping && " with expedited shipping"}
              </p>
            </div>
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            <p>
              You will receive a shipping confirmation email with tracking information once your item has been shipped.
              If you have any questions about your order, please contact our customer support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

