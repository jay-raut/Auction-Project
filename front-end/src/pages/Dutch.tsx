"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ownerId: string;
  isActive: boolean;
};

export default function Dutch() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const { socket, user } = useAuction();
  const navigate = useNavigate();
  const [auctionItem, setAuctionItem] = useState<AuctionItem | null>(null);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [priceReduction, setPriceReduction] = useState(0);

  useEffect(() => {
    async function getAuctionById(id: string) {
      try {
        const response = await fetch(`https://localhost:3000/api/auction/${id}`);
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
          ownerId: auction.auction_owner,
          isActive: auction.is_active, // Include is_active field
        });
      } catch (error) {
        toast.error("Failed to fetch auction");
      }
    }

    if (id) {
      getAuctionById(id);
      socket?.emit("subscribe", id);
      socket?.emit("unsubscribe", "all");
    }
  }, [id, socket]);

  useEffect(() => {
    if (!socket) return;

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

    const handleAuctionEnded = () => {
      setAuctionEnded(true);
    };

    socket.on("auction.bid", handleBidUpdate);
    socket.on("order.ready", await_order);
    socket.on("auction.ended", handleAuctionEnded);

    return () => {
      socket.off("auction.bid", handleBidUpdate);
      socket.off("order.ready", await_order);
      socket.off("auction.ended", handleAuctionEnded);
    };
  }, [socket]);

  const handleBuyNow = async () => {
    try {
      const response = await fetch(`https://localhost:3000/api/auction/buy-now/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setAuctionEnded(true);
        setIsWinner(true);
        toast.success("Purchase successful! Proceed to payment.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Could not buy dutch auction");
    }
  };

  const handleProceedToPayment = () => {
    if (!order) {
      return;
    }
    navigate(`/auction-ended/${order.order.order_id}`);
  };

  const handleReducePrice = async () => {
    if (!priceReduction || priceReduction <= 0) {
      toast.error("Enter a valid price reduction amount.");
      return;
    }
    try {
      const response = await fetch(`https://localhost:3000/api/auction/bid/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid: priceReduction }),
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setAuctionItem((prevItem) => (prevItem ? { ...prevItem, currentPrice: priceReduction } : prevItem));
        toast.success("Price reduced successfully.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Could not reduce price.");
    }
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
              </div>
              {auctionEnded && (
                <Badge variant="destructive" className="px-3 py-1 text-sm">
                  Auction Ended
                </Badge>
              )}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Current price</p>
                <p className="text-3xl font-bold">${auctionItem.currentPrice.toLocaleString()}</p>
                <Separator />

                {!auctionItem.isActive ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>This auction has ended.</AlertDescription>
                  </Alert>
                ) : auctionEnded ? (
                  isWinner ? (
                    <Button className="w-full" onClick={handleProceedToPayment}>
                      Proceed to Payment
                    </Button>
                  ) : order ? (
                    <Button className="w-full" onClick={handleProceedToPayment}>
                      Proceed to Payment
                    </Button>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>This auction has ended.</AlertDescription>
                    </Alert>
                  )
                ) : (
                  <>
                    <Button className="w-full" onClick={handleBuyNow}>
                      Buy Now
                    </Button>
                    {user?.user_id === auctionItem.ownerId && (
                      <div className="flex space-x-2">
                        <Input type="number" value={priceReduction} onChange={(e) => setPriceReduction(Number(e.target.value))} placeholder="Enter reduction" />
                        <Button onClick={handleReducePrice}>Reduce Price</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
