"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format, addHours } from "date-fns";
import { Switch } from "@/components/ui/switch";

export default function CreateAuction() {
  const navigate = useNavigate();
  const [auctionType, setAuctionType] = useState("forward_auction");
  const [startNow, setStartNow] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date;
  });

  const [formData, setFormData] = useState({
    item_name: "",
    item_description: "",
    auction_type: "forward_auction",
    starting_amount: "",
    shipping_cost: "",
    expedited_shipping_cost: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let auctionData = {
      ...formData,
      start_time: startNow ? "now" : Math.floor(startDate.getTime() / 1000),
      auction_type: auctionType,
    };

    if (auctionType === "forward_auction") {
      auctionData.end_time = Math.floor(endDate.getTime() / 1000);
    }

    try {
      const response = await fetch("http://localhost:3000/api/auction/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auctionData),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success("Auction created successfully!");
      console.log(data);
      navigate(`/${data.auction_info.auction_type}/${data.auction_info.auction_id}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-semibold text-center mb-6">Create Auction</h1>
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Select Auction Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forward_auction" onValueChange={setAuctionType}>
            <TabsList className="mb-4 flex gap-4">
              <TabsTrigger value="forward_auction">Forward Auction</TabsTrigger>
              <TabsTrigger value="dutch_auction">Dutch Auction</TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Input name="item_name" value={formData.item_name} onChange={handleChange} required />
            </div>
            <div>
              <Label>Item Description</Label>
              <Input name="item_description" value={formData.item_descxription} onChange={handleChange} required />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Start Time</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="start-now">Start Immediately</Label>
                  <Switch
                    id="start-now"
                    checked={startNow}
                    onCheckedChange={(checked) => {
                      setStartNow(checked);
                      if (!checked) {
                        const now = new Date();
                        setStartDate(now);
                        const endDate = new Date();
                        endDate.setHours(now.getHours() + 24);
                        setEndDate(endDate);
                      }
                    }}
                  />
                </div>
              </div>

              {!startNow && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPPpp") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    <div className="p-3 border-t">
                      <input
                        type="time"
                        value={format(startDate, "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":");
                          const newDate = new Date(startDate);
                          newDate.setHours(parseInt(hours, 10));
                          newDate.setMinutes(parseInt(minutes, 10));
                          setStartDate(newDate);
                        }}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {auctionType === "forward_auction" && (
              <div>
                <Label>End Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPPpp") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus fromDate={startDate} />
                    <div className="p-3 border-t">
                      <input
                        type="time"
                        value={format(endDate, "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":");
                          const newDate = new Date(endDate);
                          newDate.setHours(parseInt(hours, 10));
                          newDate.setMinutes(parseInt(minutes, 10));
                          setEndDate(newDate);
                        }}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div>
              <Label>Starting Amount ($)</Label>
              <Input name="starting_amount" type="number" value={formData.starting_amount} onChange={handleChange} required />
            </div>
            <div>
              <Label>Shipping Cost ($)</Label>
              <Input name="shipping_cost" type="number" value={formData.shipping_cost} onChange={handleChange} required />
            </div>
            <div>
              <Label>Expedited Shipping Cost ($)</Label>
              <Input name="expedited_shipping_cost" type="number" value={formData.expedited_shipping_cost} onChange={handleChange} required />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/80">
              Create Auction
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
