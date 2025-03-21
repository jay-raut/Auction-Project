"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuction } from "@/Context/AuctionContext";

type AuctionItem = {
  id: number;
  name: string;
  description: string;
  currentPrice: number;
  minBidIncrement: number;
  shippingPrice: number;
};
export default function Dutch() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const { socket } = useAuction();
  const navigate = useNavigate();
  const [auctionItem, setAuctionItem] = useState<AuctionItem | null>(null);
  const [auctionEnded, setAuctionEnded] = useState(false);

  // Fetch auction details
  useEffect(() => {
    async function getAuctionById(id: string) {
      try {
        const response = await fetch(`http://localhost:3000/api/auction/${id}`);
        if (!response.ok) {
          throw new Error("Could not fetch auction data");
        }

        const data = await response.json();
        const auction = data.auction;

        setAuctionItem({
          id: auction.auction_id,
          name: auction.item_name,
          description: auction.item_description,
          minBidIncrement: 100,
          shippingPrice: auction.shipping_cost,
          currentPrice: auction?.current_bid || auction.starting_amount,
        });
      } catch (error) {
        toast.error("Failed to fetch auction");
      }
    }

    if (id) {
      getAuctionById(id);
      socket?.emit("subscribe", id); // Subscribe to the auction updates
      socket?.emit("unsubscribe", "all");
    }
  }, [id, socket]);

  useEffect(() => {
    if (!socket) return;

    // Handle price update (no user data required)
    const handleBidUpdate = (newBid: number) => {
      setAuctionItem((prevItem) => {
        if (prevItem && newBid.bid < prevItem.currentPrice) {
          return {
            ...prevItem,
            currentPrice: newBid.bid,
          };
        }
        return prevItem;
      });
    };

    const await_order = (created_order: any) => {
      setOrder(created_order);
    };

    socket.on("auction.bid", handleBidUpdate);
    socket.on("order.ready", await_order);

    return () => {
      socket.off("auction.bid", handleBidUpdate);
    };
  }, [socket]);

  const handleBuyNow = async () => {
    // In a real app, this would call your buy now API
    console.log("Buying now at:", auctionItem.currentPrice);

    try {
      const response = await fetch(`http://localhost:3000/api/auction//buy-now/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setAuctionEnded(true);
        toast.success("Purchase successful! Proceed to payment.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Could not buy dutch auction ");
    }
  };

  const handleProceedToPayment = () => {
    if (!order) {
      return;
    }
    console.log(order);
    navigate(`/auction-ended/${order.order.order_id}`);
  };

  if (!auctionItem) {
    return <p>Loading auction...</p>;
  }

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
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
                      <AlertDescription>You've successfully purchased this item! Proceed to payment to complete your order.</AlertDescription>
                    </Alert>

                    <Button className="w-full" onClick={handleProceedToPayment}>
                      Proceed to Payment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm">In a Dutch auction, the price is fixed. Click "Buy Now" to purchase the item immediately and end the auction.</p>

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
  );
}
