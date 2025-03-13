"use client"

import { useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CreditCard, Lock } from "lucide-react"

// Mock user data (would come from your auth context in a real app)
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
  image: "/placeholder.svg?height=200&width=300",
}

const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(16, "Card number must be at least 16 digits")
    .max(19, "Card number must be at most 19 digits")
    .regex(/^[0-9\s-]+$/, "Card number must contain only digits, spaces, or hyphens"),
  cardName: z.string().min(1, "Cardholder name is required"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Expiry date must be in MM/YY format"),
  cvv: z
    .string()
    .min(3, "CVV must be at least 3 digits")
    .max(4, "CVV must be at most 4 digits")
    .regex(/^[0-9]+$/, "CVV must contain only digits"),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

export default function Payment() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const expeditedShipping = searchParams.get("expedited") === "true"

  const totalShippingCost = expeditedShipping
    ? auctionItem.shippingPrice + auctionItem.expeditedShippingPrice
    : auctionItem.shippingPrice

  const totalPrice = auctionItem.winningPrice + totalShippingCost

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
    },
  })

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      setError(null)
      // In a real app, this would call your payment processing API
      console.log("Processing payment:", data)

      // Simulate payment processing
      toast.success("Payment processed successfully")
      navigate(`/receipt/${id}?expedited=${expeditedShipping}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing failed")
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
        <p className="text-muted-foreground mt-2">Please review your information and enter payment details</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-6">
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

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-9" placeholder="1234 5678 9012 3456" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cardholder Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="MM/YY" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cvv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="123" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        "Processing..."
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Pay ${totalPrice.toLocaleString()}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-md border">
                  <img
                    src={auctionItem.image || "/placeholder.svg"}
                    alt={auctionItem.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{auctionItem.name}</p>
                  <p className="text-sm text-muted-foreground">Auction #{id}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Item price:</span>
                  <span>${auctionItem.winningPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Standard shipping:</span>
                  <span>${auctionItem.shippingPrice.toLocaleString()}</span>
                </div>
                {expeditedShipping && (
                  <div className="flex justify-between text-sm">
                    <span>Expedited shipping:</span>
                    <span>+${auctionItem.expeditedShippingPrice.toLocaleString()}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 text-xs text-muted-foreground flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                Secure payment processing
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

