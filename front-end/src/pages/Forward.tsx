import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowUp, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for a forward auction item
const auctionItem = {
  id: 1,
  name: "Vintage Rolex Submariner",
  description:
    "A classic timepiece in excellent condition. This vintage Rolex Submariner features a black dial with luminous hour markers and a date function. The watch comes with its original box and papers, confirming its authenticity and provenance. The stainless steel case and bracelet show minimal signs of wear, making this a collector's piece in remarkable condition for its age.",
  currentPrice: 5250,
  minBidIncrement: 100,
  highestBidder: "user123",
  shippingPrice: 75,
  remainingTime: "2:15:30",
  image: "/placeholder.svg?height=400&width=600",
}

const bidSchema = z.object({
  bidAmount: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val)
      return !isNaN(num) && num >= auctionItem.currentPrice + auctionItem.minBidIncrement
    },
    {
      message: `Bid must be at least $${auctionItem.currentPrice + auctionItem.minBidIncrement}`,
    },
  ),
})

type BidFormValues = z.infer<typeof bidSchema>

export default function Forward() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentPrice, setCurrentPrice] = useState(auctionItem.currentPrice)
  const [highestBidder, setHighestBidder] = useState(auctionItem.highestBidder)
  const [remainingTime, setRemainingTime] = useState(auctionItem.remainingTime)
  const [auctionEnded, setAuctionEnded] = useState(false)

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      bidAmount: "",
    },
  })

  // Simulate countdown timer
  useEffect(() => {
    if (auctionEnded) return

    const timer = setInterval(() => {
      // Parse the time string (HH:MM:SS)
      const [hours, minutes, seconds] = remainingTime.split(":").map(Number)

      let totalSeconds = hours * 3600 + minutes * 60 + seconds
      totalSeconds -= 1

      if (totalSeconds <= 0) {
        clearInterval(timer)
        setAuctionEnded(true)
        toast.info("Auction has ended!")
        return
      }

      const newHours = Math.floor(totalSeconds / 3600)
      const newMinutes = Math.floor((totalSeconds % 3600) / 60)
      const newSeconds = totalSeconds % 60

      setRemainingTime(
        `${newHours}:${newMinutes.toString().padStart(2, "0")}:${newSeconds.toString().padStart(2, "0")}`,
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime, auctionEnded])

  const onSubmit = (data: BidFormValues) => {
    if (auctionEnded) {
      toast.error("Auction has ended. No more bids can be placed.")
      return
    }

    const bidAmount = Number.parseFloat(data.bidAmount)

    // In a real app, this would call your bid API
    console.log("Placing bid:", bidAmount)

    // Simulate successful bid
    setCurrentPrice(bidAmount)
    setHighestBidder("yourUsername") // In a real app, this would be the current user's username
    toast.success(`Bid of $${bidAmount.toLocaleString()} placed successfully!`)
    form.reset()
  }

  const handleAuctionEnd = () => {
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
                <Badge className="px-3 py-1 text-sm">Forward Auction</Badge>
                {!auctionEnded ? (
                  <div className="flex items-center text-sm font-medium">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{remainingTime}</span>
                  </div>
                ) : (
                  <Badge variant="destructive" className="px-3 py-1 text-sm">
                    Auction Ended
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current bid</p>
                  <p className="text-3xl font-bold">${currentPrice.toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    Highest bidder: <span className="font-medium">{highestBidder}</span>
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Shipping</p>
                  <p className="font-medium">${auctionItem.shippingPrice.toLocaleString()}</p>
                </div>

                <Separator />

                {auctionEnded ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        This auction has ended. The highest bidder can proceed to payment.
                      </AlertDescription>
                    </Alert>

                    <Button className="w-full" onClick={handleAuctionEnd} disabled={highestBidder !== "yourUsername"}>
                      {highestBidder === "yourUsername" ? "Proceed to Payment" : "Auction Ended"}
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="bidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    $
                                  </span>
                                  <Input
                                    {...field}
                                    type="number"
                                    className="pl-7"
                                    placeholder={`${currentPrice + auctionItem.minBidIncrement}`}
                                  />
                                </div>
                              </FormControl>
                              <Button type="submit" disabled={form.formState.isSubmitting}>
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Bid
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <p className="text-xs text-muted-foreground">
                        Minimum bid increment: ${auctionItem.minBidIncrement}
                      </p>
                    </form>
                  </Form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
