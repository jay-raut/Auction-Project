"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Search } from "lucide-react";

async function get_all_auctions() {
  const response = await fetch("http://localhost:3000/api/auction/all", {
    method: "GET",
  });
  if (response.ok) {
    const response_json = await response.json();
    const formattedData = response_json.auctions.map((auction) => {
      let auction_data = {
        id: auction.auction_id,
        name: auction.item_name,
        description: auction.item_description,
        currentPrice: auction.starting_amount,
        type: auction.auction_type,
        is_active: auction.is_active,
      };
      if (auction_data.type == "forward_auction"){
        auction_data.remainingTime = auction.
      }
    });
    console.log(formattedData);
    return response_json.auctions;
  }
}
await get_all_auctions();

// Mock data for auction items
const auctionItems = [
  {
    id: 1,
    name: "Vintage Rolex Submariner",
    description: "A classic timepiece in excellent condition",
    currentPrice: 5250,
    type: "forward",
    remainingTime: "2h 15m",
    is_active: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 2,
    name: "Rare First Edition Book",
    description: "First edition of a classic novel",
    currentPrice: 1200,
    type: "forward",
    remainingTime: "4h 30m",
    is_active: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 3,
    name: "Antique Wooden Desk",
    description: "19th century mahogany writing desk",
    currentPrice: 3500,
    type: "dutch",
    is_active: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 4,
    name: "Modern Art Painting",
    description: "Original canvas by contemporary artist",
    currentPrice: 2800,
    type: "dutch",
    is_active: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 5,
    name: "Vintage Camera Collection",
    description: "Set of 5 rare film cameras from the 1960s",
    currentPrice: 950,
    type: "forward",
    remainingTime: "1d 3h",
    is_active: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 6,
    name: "Handcrafted Leather Sofa",
    description: "Premium full-grain leather sofa",
    currentPrice: 4200,
    type: "dutch",
    is_active: false,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 7,
    name: "Limited Edition Sneakers",
    description: "Rare collector's edition, never worn",
    currentPrice: 750,
    type: "forward",
    remainingTime: "5h 45m",
    is_active: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 8,
    name: "Gaming PC Setup",
    description: "High-end gaming computer with accessories",
    currentPrice: 1800,
    type: "dutch",
    is_active: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 9,
    name: "Classic Car",
    description: "This classic car auction has ended.",
    currentPrice: 15000,
    type: "forward",
    is_active: false,
    remainingTime: "",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 10,
    name: "Luxury Watch",
    description: "Luxury watch auction that is no longer active.",
    currentPrice: 8000,
    type: "forward",
    is_active: false,
    remainingTime: "",
    image: "/placeholder.svg?height=200&width=300",
  },
];

export default function Catalogue() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredItems = auctionItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") {
      return matchesSearch;
    } else if (activeTab === "active") {
      return matchesSearch && item.is_active === true;
    } else if (activeTab === "past") {
      return matchesSearch && item.is_active === false;
    }

    return matchesSearch && item.type === activeTab;
  });

  return (
    <div className="container py-10">
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
          <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Auctions</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="forward">Forward</TabsTrigger>
              <TabsTrigger value="dutch">Dutch</TabsTrigger>
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
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="object-cover w-full h-full" />
                  <Badge className="absolute top-2 right-2" variant={item.type === "forward" ? "default" : "secondary"}>
                    {item.type === "forward" ? "Forward Auction" : "Dutch Auction"}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 h-10">{item.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Current bid</p>
                      <p className="font-semibold">${item.currentPrice.toLocaleString()}</p>
                    </div>
                    {item.type === "forward" && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {item.remainingTime}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Link to={item.type === "forward" ? `/forward/${item.id}` : `/dutch/${item.id}`} className="w-full">
                    <Button className="w-full">{item.type === "forward" ? "Place Bid" : "View Auction"}</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
