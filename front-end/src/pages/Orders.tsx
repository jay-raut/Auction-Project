"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("completed");
  const [auctionDetails, setAuctionDetails] = useState(new Map());

  const [expandedOrderId, setExpandedOrderId] = useState([]);
  const [loadingAuction, setLoadingAuction] = useState(false);

  async function getAuctionById(auctionId, orderId) {
    setLoadingAuction(true);
    try {
      const response = await fetch(`http://localhost:3000/api/auction/${auctionId}`);
      if (!response.ok) throw new Error("Could not fetch auction data");
      const data = await response.json();
      console.log(data);
      auctionDetails.set(orderId, data.auction);
    } catch (error) {
      console.error("Failed to fetch auction details:", error);
    } finally {
      setLoadingAuction(false);
    }
  }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/payment/all", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data.orders);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handlePayment = async (orderId) => {
    navigate(`/payment/${orderId}`);
  };

  const viewReceipt = async (orderId) => {
    navigate(`/receipt/${orderId}`);
  };

  const handleExpandOrder = (orderId, auctionId) => {
    if (expandedOrderId.includes(orderId)) {
      setExpandedOrderId(expandedOrderId.filter((id) => id !== orderId));
    } else {
      setExpandedOrderId([...expandedOrderId, orderId]);
    }
    if (!auctionDetails.has(orderId)) {
      getAuctionById(auctionId, orderId);
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;

  const completedOrders = orders.filter((order) => order.status === "completed");
  const pendingOrders = orders.filter((order) => order.status === "pending");

  return (
    <div className="container max-w-6xl py-12">
      <h1 className="text-4xl font-semibold text-center mb-8 text-primary">Orders</h1>

      <Tabs defaultValue="completed" className="w-full sm:w-auto" onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex justify-center gap-6">
          <TabsTrigger value="completed" className="text-xl font-medium py-2 px-4 rounded-md transition-all duration-300 hover:bg-primary/10 active:bg-primary/20">
            Completed Orders
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xl font-medium py-2 px-4 rounded-md transition-all duration-300 hover:bg-primary/10 active:bg-primary/20">
            Pending Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          {completedOrders.length === 0 ? (
            <div className="text-center text-lg text-muted">No completed orders found.</div>
          ) : (
            <div className="space-y-6">
              {completedOrders.map((order) => (
                <Card key={order.order_id} className="shadow-lg rounded-lg border bg-white p-4">
                  <CardHeader className="bg-primary/5 border-b rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-semibold">Order #{order.order_id}</CardTitle>
                      <Badge className="bg-green-500 text-white">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="font-medium mb-2">Transaction Breakdown</h3>
                        {order.transactions && order.transactions.length > 0 && (
                          <div className="space-y-4">
                            {order.transactions.map((transaction) => (
                              <div key={transaction.transaction_id} className="border p-3 rounded-lg shadow-sm">
                                <h4 className="font-medium">Transaction #{transaction.transaction_id}</h4>
                                <p>
                                  <strong>Amount:</strong> ${parseFloat(transaction.amount).toFixed(2)}
                                </p>
                                <p>
                                  <strong>Status:</strong> Complete
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button className="my-4 w-full md:w-auto" variant="outline" onClick={() => handleExpandOrder(order.order_id, order.auction_id)}>
                      {expandedOrderId.includes(order.order_id) ? "Hide Auction Details" : "View Auction Details"}
                    </Button>

                    {expandedOrderId.includes(order.order_id) && !auctionDetails.get(order.order_id) && loadingAuction ? (
                      <div>Loading auction details...</div>
                    ) : (
                      expandedOrderId.includes(order.order_id) &&
                      auctionDetails.get(order.order_id) && (
                        <div className="mt-4 space-y-1">
                          <p>
                            <strong>Item Name:</strong> {auctionDetails.get(order.order_id).item_name}
                          </p>
                          <p>
                            <strong>Item Description:</strong> {auctionDetails.get(order.order_id).item_description}
                          </p>
                          <p>
                            <strong>Auction Type:</strong> {auctionDetails.get(order.order_id).auction_type}
                          </p>
                          <p>
                            <strong>Starting Amount:</strong> ${auctionDetails.get(order.order_id).starting_amount}
                          </p>
                          <p>
                            <strong>Shipping Cost:</strong> ${auctionDetails.get(order.order_id).shipping_cost}
                          </p>
                          <p>
                            <strong>Expedited Shipping Cost:</strong> ${auctionDetails.get(order.order_id).expedited_shipping_cost}
                          </p>
                        </div>
                      )
                    )}
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">Created At: {new Date(order.created_at).toLocaleString()}</p>
                      <Button onClick={() => viewReceipt(order.order_id)} className="bg-primary text-white hover:bg-primary/80">
                        View Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingOrders.length === 0 ? (
            <div className="text-center text-lg text-muted">No pending orders found.</div>
          ) : (
            <div className="space-y-6">
              {pendingOrders.map((order) => (
                <Card key={order.order_id} className="shadow-lg rounded-lg border bg-white p-4">
                  <CardHeader className="bg-primary/5 border-b rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-semibold">Order #{order.order_id}</CardTitle>
                      <Badge variant="warning" className="text-white bg-yellow-500">
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Button variant="outline" onClick={() => handleExpandOrder(order.order_id, order.auction_id)} className="w-full md:w-auto">
                      {expandedOrderId.includes(order.order_id) ? "Hide Auction Details" : "View Auction Details"}
                    </Button>

                    {expandedOrderId.includes(order.order_id) && !auctionDetails.get(order.order_id) && loadingAuction ? (
                      <div>Loading auction details...</div>
                    ) : (
                      expandedOrderId.includes(order.order_id) &&
                      auctionDetails.get(order.order_id) && (
                        <div className="mt-4 space-y-2">
                          <p>
                            <strong>Item Name:</strong> {auctionDetails.get(order.order_id).item_name}
                          </p>
                          <p>
                            <strong>Item Description:</strong> {auctionDetails.get(order.order_id).item_description}
                          </p>
                          <p>
                            <strong>Auction Type:</strong> {auctionDetails.get(order.order_id).auction_type}
                          </p>
                          <p>
                            <strong>Starting Amount:</strong> ${auctionDetails.get(order.order_id).starting_amount}
                          </p>
                          <p>
                            <strong>Shipping Cost:</strong> ${auctionDetails.get(order.order_id).shipping_cost}
                          </p>
                          <p>
                            <strong>Expedited Shipping Cost:</strong> ${auctionDetails.get(order.order_id).expedited_shipping_cost}
                          </p>
                        </div>
                      )
                    )}

                    <Separator className="my-4" />
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">Created At: {new Date(order.created_at).toLocaleString()}</p>
                      <Button onClick={() => handlePayment(order.order_id)} className="bg-yellow-500 text-white hover:bg-yellow-400">
                        Pay Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
