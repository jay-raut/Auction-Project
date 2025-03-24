import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, Download, Printer, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Receipt() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [auctionItem, setAuctionItem] = useState(null);
  const expeditedShipping = searchParams.get("expedited") === "true";

  useEffect(() => {
    async function getOrder() {
      try {
        const response = await fetch(`http://localhost:3000/api/payment/get/${id}`, {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Could not fetch order data");
        const data = await response.json();
        setOrder(data.order);
        getAuctionById(data.order.auction_id);
      } catch (error) {
        toast.error("Failed to fetch order");
      }
    }

    async function getAuctionById(auctionId) {
      try {
        const response = await fetch(`http://localhost:3000/api/auction/${auctionId}`);
        if (!response.ok) throw new Error("Could not fetch auction data");
        const data = await response.json();
        setAuctionItem(data.auction);
      } catch (error) {
        toast.error("Failed to fetch auction");
      }
    }

    getOrder();
  }, [id]);

  if (!order || !auctionItem) return <p>Loading...</p>;

  const transaction = order.transactions?.[0];
  const paymentMethod = transaction?.payment_method;
  const shippingAddress = transaction?.shipping_address;
  const billingAddress = transaction?.billing_address;
  const cost_breakdown = transaction?.cost_breakdown;

  const totalPrice = parseFloat(transaction.amount);
  const shippingDays = 5;

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Confirmation</h1>
          <p className="text-muted-foreground mt-2">Thank you for your purchase!</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Order #{order.order_id}</CardTitle>
            <Badge className="mt-2 sm:mt-0 w-fit">
              <Check className="mr-1 h-3 w-3" />
              Payment Successful
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-2">Order Details</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Order Date:</span> {new Date(order.created_at).toLocaleDateString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Order Number:</span> {order.order_id}
                </p>
                <p>
                  <span className="text-muted-foreground">Payment Method:</span> Credit Card (****{paymentMethod?.card_number.slice(-4)})
                </p>
              </div>
            </div>

            <div>
              <div>
                <h3 className="font-medium mb-2">Shipping Address</h3>
                <div className="text-sm text-muted-foreground">
                  <p>
                    {shippingAddress.street_number} {shippingAddress.street_address}
                  </p>
                  <p>
                    {shippingAddress.city}, {shippingAddress.zip_code}
                  </p>
                  <p>{shippingAddress.country}</p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="font-medium mb-2">Billing Address</h3>
                <div className="text-sm text-muted-foreground">
                  <p>
                    {billingAddress.street_number} {billingAddress.street_address}
                  </p>
                  <p>
                    {billingAddress.city}, {billingAddress.zip_code}
                  </p>
                  <p>{billingAddress.country}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium">{auctionItem.item_name}</h3>
                    <p className="text-sm text-muted-foreground">Auction #{auctionItem.auction_id}</p>
                  </div>
                  <p className="font-medium mt-1 sm:mt-0">${parseFloat(order.final_price).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${parseFloat(order.final_price).toLocaleString()}</span>
              </div>

              {cost_breakdown.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>${cost_breakdown.shipping_cost}</span>
                </div>
              )}

              {cost_breakdown.expedited_shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Expedited Shipping:</span>
                  <span>${cost_breakdown.expedited_shipping_cost}</span>
                </div>
              )}

              <Separator className="my-2" />

              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-medium">Shipping Status</h3>
              <p className="text-sm text-muted-foreground">
                The item will be shipped in {shippingDays} days
                {expeditedShipping && " with expedited shipping"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
