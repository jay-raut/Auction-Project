import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trophy, Truck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuction } from "@/Context/AuctionContext";

// Mock data for an ended auction
const auctionItem = {
  id: 1,
  name: "Vintage Rolex Submariner",
  description: "A classic timepiece in excellent condition",
  winningPrice: 5750,
  shippingPrice: 75,
  expeditedShippingPrice: 50,
  winningBidder: "yourUsername", // This would be the current user in a real app
  auctionType: "forward",
  image: "/placeholder.svg?height=400&width=600",
};

type AuctionItem = {
  id: number;
  name: string;
  description: string;
  currentPrice: number;
  minBidIncrement: number;
  shippingPrice: number;
};

export default function AuctionEnded() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expeditedShipping, setExpeditedShipping] = useState(false);
  const [order, setOrder] = useState(null);
  const [auction, setAuction] = useState<AuctionItem | null>(null);
  const { user } = useAuction();

  useEffect(() => {
    async function getOrder() {
      try {
        const response = await fetch(`https://localhost:3000/api/payment/get/${id}`, { method: "GET", credentials: "include" });
        if (!response.ok) throw new Error("Could not fetch order data");
        const data = await response.json();
        setOrder(data.order);
        getAuctionById(data.order.auction_id);
        console.log(data.order)
      } catch (error) {
        toast.error("Failed to fetch order");
      }
    }

    async function getAuctionById(auctionId: string) {
      try {
        const response = await fetch(`https://localhost:3000/api/auction/${auctionId}`);
        if (!response.ok) throw new Error("Could not fetch auction data");
        const data = await response.json();
        setAuction(data.auction);
        console.log(data.auction)
      } catch (error) {
        toast.error("Failed to fetch auction");
      }
    }

    getOrder();
  }, [id]);

  if (!order || !auction) return <p>Loading...</p>;

  // Check if the logged-in user is the auction winner
  const isWinner = user.user_id === order.user_winner_id;

  const totalShippingCost = expeditedShipping ? parseFloat(auction.shipping_cost) + parseFloat(auction.expedited_shipping_cost) : parseFloat(auction.shipping_cost);
  const totalPrice = parseFloat(order.final_price) + totalShippingCost;

  const handlePayNow = () => {
    if (!isWinner) {
      toast.error("Only the winning bidder can proceed to payment");
      return;
    }
    navigate(`/payment/${id}?expedited=${expeditedShipping}`);
  };

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border">
            <img src={"/placeholder.svg"} alt={auction.item_name} className="w-full object-cover" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">{auction.item_name}</h2>
            <p className="mt-2 text-muted-foreground">{auction.item_description}</p>
          </div>
        </div>

        <div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <Badge variant={auction.auction_type === "forward" ? "default" : "secondary"} className="px-3 py-1 text-sm">
                  {auction.auction_type === "forward" ? "Forward Auction" : "Dutch Auction"}
                </Badge>
                <Badge variant="destructive" className="px-3 py-1 text-sm">
                  Auction Ended
                </Badge>
              </div>

              <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <Trophy className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold text-lg">Auction Complete</h3>
                  <p className="text-sm text-muted-foreground">{isWinner ? "Congratulations! You won this auction." : `The auction was won by another user.`}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Winning bid</p>
                  <p className="text-3xl font-bold">${parseFloat(order.final_price).toLocaleString()}</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Standard shipping</p>
                    <p className="font-medium">${parseFloat(auction.shipping_cost).toLocaleString()}</p>
                  </div>

                  {isWinner && (
                    <div className="flex items-center space-x-2">
                      <Switch id="expedited-shipping" checked={expeditedShipping} onCheckedChange={setExpeditedShipping} />
                      <div className="grid gap-1.5">
                        <Label htmlFor="expedited-shipping" className="font-medium">
                          Expedited shipping +${(auction.expedited_shipping_cost)}
                        </Label>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Truck className="h-3 w-3 mr-1" />
                          Get your item faster with priority shipping
                        </p>
                      </div>
                    </div>
                  )}

                  {isWinner && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm">
                        <span>Item price:</span>
                        <span>${parseFloat(order.final_price).toLocaleString()}</span>
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
                  )}
                </div>

                <Separator />

                {isWinner ? (
                  <Button className="w-full" onClick={handlePayNow}>
                    Pay Now
                  </Button>
                ) : (
                  <Alert>
                    <AlertDescription>This auction has been won by another user.</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
