import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
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

export default function Forward() {
  const { id } = useParams();
  const { socket } = useAuction();
  const [auctionItem, setAuctionItem] = useState<AuctionItem | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>("");
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

        const auctionEndTime = new Date(auction.end_time);
        setEndTime(auctionEndTime);

        setAuctionItem({
          id: auction.auction_id,
          name: auction.item_name,
          description: auction.item_description,
          minBidIncrement: 100,
          shippingPrice: 0,
          currentPrice: auction.current_bid,
        });
      } catch (error) {
        toast.error("Failed to fetch auction");
      }
    }

    if (id) {
      getAuctionById(id);
      socket?.emit("subscribe", id); // Subscribe to the auction updates
    }
  }, [id, socket]);

  useEffect(() => {
    if (!socket) return;

    // Handle price update (no user data required)
    const handleBidUpdate = (newBid: number) => {
      console.log(newBid);
      setAuctionItem((prevItem) => {
        if (prevItem && newBid.bid > prevItem.currentPrice) {
          return {
            ...prevItem,
            currentPrice: newBid.bid,
          };
        }
        return prevItem;
      });
    };

    socket.on("auction.bid", handleBidUpdate);

    return () => {
      socket.off("auction.bid", handleBidUpdate);
    };
  }, [socket]);

  // Countdown Timer
  useEffect(() => {
    if (!endTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const remaining = Math.max((endTime.getTime() - now.getTime()) / 1000, 0);

      if (remaining <= 0) {
        clearInterval(timer);
        setAuctionEnded(true);
        toast.info("Auction has ended!");
        setRemainingTime("0:00:00");
      } else {
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = Math.floor(remaining % 60);
        setRemainingTime(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!auctionItem) {
    return <p>Loading auction...</p>;
  }

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border">
            <img src={"/placeholder.svg"} alt={auctionItem.name} className="w-full object-cover" />
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
                  <p className="text-3xl font-bold">${auctionItem.currentPrice.toLocaleString()}</p>
                </div>
                {auctionEnded ? (
                  <Alert>
                    <AlertDescription>This auction has ended. The highest bidder can proceed to payment.</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
