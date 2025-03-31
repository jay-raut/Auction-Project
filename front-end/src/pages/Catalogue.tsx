"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuction } from "@/Context/AuctionContext";

async function get_all_auctions() {
  const response = await fetch("https://localhost:3000/api/auction/all", {
    method: "GET",
  });
  if (response.ok) {
    const response_json = await response.json();
    const formattedData = response_json.auctions.map((auction) => {
      let auction_data = {
        id: auction.auction_id,
        name: auction.item_name,
        description: auction.item_description,
        currentPrice: auction?.current_bid || auction.starting_amount,
        type: auction.auction_type,
        is_active: auction.is_active,
        start_time: auction.start_time,
      };
      if (auction_data.type == "forward_auction") {
        const now = new Date();
        const end_time = new Date(auction.end_time);
        const calculate_end_time = end_time.getTime() - now.getTime();

        if (calculate_end_time > 0) {
          const days = Math.floor(calculate_end_time / (1000 * 60 * 60 * 24)); // Calculate days
          const hours = Math.floor((calculate_end_time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); // Remaining hours
          const minutes = Math.floor((calculate_end_time % (1000 * 60 * 60)) / (1000 * 60)); // Remaining minutes

          if (days > 0) {
            auction_data.remainingTime = `${days}d ${hours}hr ${minutes}m`;
          } else {
            auction_data.remainingTime = `${hours}hr ${minutes}m`;
          }
        } else {
          auction_data.remainingTime = "Auction Ended";
        }
      }

      return auction_data;
    });
    return formattedData;
  }
  toast("Could not auctions");
}

const auctionItems = await get_all_auctions();

export default function Catalogue() {
  const { isAuthenticated, socket } = useAuction();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [forceUpdate, setForceUpdate] = useState(0);

  const rerender = () => {
    setForceUpdate(forceUpdate + 1);
  };

  socket?.emit("subscribe", "all");
  socket?.on("auction.bid", (bid) => {
    const update_auction = auctionItems.find((auction) => auction.id === bid.auction_id);

    if (update_auction) {
      update_auction.currentPrice = bid.bid;
      rerender();
    }
  });
  const filteredItems = auctionItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    console.log(item);
    if (activeTab === "all") {
      return matchesSearch;
    } else if (activeTab === "active") {
      return matchesSearch && item.is_active === true;
    } else if (activeTab === "past") {
      return matchesSearch && item.is_active === false;
    } else if (activeTab === "soon") {
      return matchesSearch && item.is_active === false && new Date(item.start_time) > new Date();
    }

    return item.type === activeTab;
  });

  return (
    <div className="container py-10">
      {isAuthenticated ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Auction Catalogue</h1>
            <p className="text-muted-foreground">Browse and bid on unique items from around the world</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search items..." className="w-full pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Tabs defaultValue="active" className="w-full sm:w-auto" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="soon">Starting Soon</TabsTrigger>
                <TabsTrigger value="forward_auction">Forward</TabsTrigger>
                <TabsTrigger value="dutch_auction">Dutch</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="all">All Auctions</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No items found</p>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-[3/2] relative">
                    <Badge className="absolute top-2 right-2" variant={item.type === "forward_auction" ? "default" : "secondary"}>
                      {item.type === "forward_auction" ? "Forward Auction" : "Dutch Auction"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 h-10">{item.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        {item.is_active ? (
                          <>
                            <p className="text-sm text-muted-foreground">Current bid</p>
                          </>
                        ) : (
                          !(new Date(item.start_time) > new Date()) && (
                            <>
                              <p className="text-sm text-muted-foreground">Started At</p>
                            </>
                          )
                        )}
                        <p className="font-semibold">${item.currentPrice || "N/A"}</p>
                      </div>

                      {item.type === "forward_auction" && item.is_active && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {item.remainingTime}
                        </div>
                      )}
                      {item.is_active !== true && new Date(item.start_time) > new Date() && (
                        <div className="flex items-center text-sm text-muted-foreground ml-7">
                          Starts on{" "}
                          {new Date(item.start_time).toLocaleString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            second: "numeric",
                            hour12: true,
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Link to={item.type === "forward_auction" ? `/forward_auction/${item.id}` : `/dutch_auction/${item.id}`} className="w-full">
                      <Button className="w-full">{item.type === "forward_auction" ? (item.is_active ? "Place Bid" : "View Auction") : "View Auction"}</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium">Please log in to view the catalogue</p>
        </div>
      )}
    </div>
  );
}
