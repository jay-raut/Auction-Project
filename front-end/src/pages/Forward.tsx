import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuction } from "@/Context/AuctionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuctionItem = {
  id: number;
  name: string;
  description: string;
  currentPrice: number;
  minBidIncrement: number;
  shippingPrice: number;
  ownerId: string;
  isActive: boolean;
  startTime: string;
  isFutureAuction: boolean;
};

export default function Forward() {
  const { id } = useParams();
  const { socket, user } = useAuction();
  const [auctionItem, setAuctionItem] = useState<AuctionItem | null>(null);
  const navigate = useNavigate();
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [order, setOrder] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState<string>("");

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
        setAuctionEnded(!auction.is_active);
        const startTime = new Date(auction.start_time);
        const now = new Date();
        const isFutureAuction = !auction.is_active && startTime > now;
        setAuctionItem({
          id: auction.auction_id,
          name: auction.item_name,
          description: auction.item_description,
          minBidIncrement: 100,
          shippingPrice: auction.shipping_cost,
          currentPrice: auction?.current_bid || auction.starting_amount,
          ownerId: auction.auction_owner,
          isActive: auction.is_active,
          startTime: auction.start_time,
          isFutureAuction,
        });
        if (isFutureAuction) {
          const updateCountdown = () => {
            const now = new Date();
            const diff = startTime.getTime() - now.getTime();

            if (diff <= 0) {
              clearInterval(interval);
              setTimeUntilStart("Auction is starting...");
              return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeUntilStart(`${days}d ${hours}h ${minutes}m ${seconds}s`);
          };

          updateCountdown();
          const interval = setInterval(updateCountdown, 1000);
          return () => clearInterval(interval);
        }
      } catch (error) {
        toast.error("Failed to fetch auction");
      }
    }

    if (id) {
      getAuctionById(id);
      socket?.emit("unsubscribe", "all");
      socket?.emit("subscribe", id);
    }
  }, [id, socket]);

  const handleProceedToPayment = () => {
    if (!order) {
      return;
    }
    navigate(`/auction-ended/${order.order.order_id}`);
  };

  useEffect(() => {
    if (!socket) return;

    const handleBidUpdate = (newBid: number) => {
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

    const handleAuctionEnded = (auction: any) => {
      console.log(auction);
      if (auction.winner === user.user_id) {
        setIsWinner(true);
        setAuctionEnded(true);
      }
    };

    const await_order = (created_order: any) => {
      setOrder(created_order);
    };

    const handleAuctionStarted = () => {
      console.log("Auction started");
      setAuctionEnded(false);
      setAuctionItem((prev) => (prev ? { ...prev, isActive: true, isFutureAuction: false } : null));
    };

    socket.on("auction.bid", handleBidUpdate);
    socket.on("auction.ended", handleAuctionEnded);
    socket.on("order.ready", await_order);
    socket.on("auction.start", handleAuctionStarted);

    return () => {
      socket.off("auction.bid", handleBidUpdate);
      socket.off("auction.ended", handleAuctionEnded);
      socket.off("order.ready", await_order);
      socket.off("auction.start", handleAuctionStarted);
    };
  }, [socket]);

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

  const placeBid = async () => {
    if (!auctionItem) return;
    const bidValue = parseFloat(bidAmount);

    if (isNaN(bidValue) || bidValue <= auctionItem.currentPrice) {
      toast.error("Bid must be higher than the current price!");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/auction/bid/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid: bidValue }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Bid failed");
      }

      toast.success("Bid placed successfully!");
      setBidAmount("");
    } catch (error) {
      toast.error("Failed to place bid");
    }
  };

  if (!auctionItem) {
    return <p>Loading auction...</p>;
  }

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{auctionItem.name}</h2>
          <p className="text-muted-foreground">{auctionItem.description}</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <Badge className="px-3 py-1 text-sm">Forward Auction</Badge>

              {auctionItem.isFutureAuction ? (
                <div className="flex items-center text-sm font-medium">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Starts in: {timeUntilStart}</span>
                </div>
              ) : !auctionEnded ? (
                <div className="flex items-center text-sm font-medium">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Ends in: {remainingTime}</span>
                </div>
              ) : (
                <Badge variant="destructive" className="px-3 py-1 text-sm">
                  Auction Ended
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Current bid</p>
              <p className="text-3xl font-bold">${auctionItem.currentPrice.toLocaleString()}</p>

              {auctionItem.isFutureAuction ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>This auction hasn't started yet. Check back when it begins.</AlertDescription>
                </Alert>
              ) : !auctionEnded ? (
                <div className="space-y-2">
                  <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Enter your bid" />
                  <Button onClick={placeBid} className="w-full">
                    Place Bid
                  </Button>
                </div>
              ) : isWinner ? (
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
