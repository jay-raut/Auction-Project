"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CreditCard, Lock } from "lucide-react";

const PAYMENT_API = "http://localhost:3000/api/authentication/payment";
const ADDRESS_API = "http://localhost:3000/api/authentication/address";
const CREATE_PAYMENT_API = "http://localhost:3000/api/authentication/create-payment-method";
const CREATE_ADDRESS_API = "http://localhost:3000/api/authentication/create-address";

const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(16, "Card number must be at least 16 digits")
    .max(19, "Card number must be at most 19 digits")
    .regex(/^[0-9\s-]+$/, "Card number must contain only digits, spaces, or hyphens"),
  cardName: z.string().min(1, "Cardholder name is required"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Expiry date must be in MM/YY format"),
  cvv: z
    .string()
    .min(3, "CVV must be at least 3 digits")
    .max(4, "CVV must be at most 4 digits")
    .regex(/^[0-9]+$/, "CVV must contain only digits"),
});

const addressSchema = z.object({
  streetAddress: z.string().min(1, "Street address is required"),
  streetNumber: z.string().min(1, "Street number is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

export default function Payment() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
  const [order, setOrder] = useState(null);
  const [auctionItem, setAuctionItem] = useState<AuctionItem | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [showAddBillingAddressForm, setShowAddBillingAddressForm] = useState(false);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);

  const expeditedShipping = searchParams.get("expedited") === "true";
  const totalShippingCost = expeditedShipping ? Number(auctionItem?.shipping_cost) + Number(auctionItem?.expedited_shipping_cost) : Number(auctionItem?.shipping_cost);
  const totalPrice = Number(order?.final_price || 0) + Number(totalShippingCost);

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
    },
  });

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      streetAddress: "",
      streetNumber: "",
      city: "",
      zipCode: "",
      country: "",
    },
  });

  useEffect(() => {
    async function getOrder() {
      try {
        const response = await fetch(`http://localhost:3000/api/payment/get/${id}`, { method: "GET", credentials: "include" });
        if (!response.ok) throw new Error("Could not fetch order data");
        const data = await response.json();
        setOrder(data.order);
        getAuctionById(data.order.auction_id);
      } catch (error) {
        toast.error("Failed to fetch order");
      }
    }

    async function getAuctionById(auctionId: string) {
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

  useEffect(() => {
    const fetchSavedData = async () => {
      try {
        const paymentRes = await fetch(PAYMENT_API, { method: "GET", credentials: "include" });
        if (!paymentRes.ok) throw new Error(`Failed to fetch payment methods: ${paymentRes.statusText}`);
        const paymentData = await paymentRes.json();
        setSavedPaymentMethods(paymentData?.payments || []);

        const addressRes = await fetch(ADDRESS_API, { method: "GET", credentials: "include" });
        if (!addressRes.ok) throw new Error(`Failed to fetch addresses: ${addressRes.statusText}`);
        const addressData = await addressRes.json();
        setSavedAddresses(addressData?.addresses || []);
      } catch (err) {
        console.error(err);
        setError("Error fetching saved data: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    };

    fetchSavedData();
  }, []);

  const onSubmitPayment = async (data: PaymentFormValues) => {
    console.log(data);
    try {
      setError(null);
      const paymentResponse = await fetch(CREATE_PAYMENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          card_number: data.cardNumber,
          name_on_card: data.cardName,
          expiration_date: {
            year: parseInt(data.expiryDate.split("/")[1]),
            month: parseInt(data.expiryDate.split("/")[0]),
          },
        }),
      });

      if (!paymentResponse.ok) throw new Error("Failed to create payment method");
      toast.success("Payment method added successfully");
      setShowAddPaymentForm(false);
      const paymentRes = await fetch(PAYMENT_API, { method: "GET", credentials: "include" });
      const paymentData = await paymentRes.json();
      setSavedPaymentMethods(paymentData?.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing failed");
    }
  };

  const onSubmitAddress = async (data: AddressFormValues) => {
    console.log(data);
    try {
      const response = await fetch(CREATE_ADDRESS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          street_address: data.streetAddress,
          street_number: data.streetNumber,
          zip_code: data.zipCode,
          city: data.city,
          country: data.country,
        }),
      });

      if (!response.ok) throw new Error("Failed to add new address");
      toast.success("Address added successfully");
      setShowAddAddressForm(false);
      setShowAddBillingAddressForm(false);
      const addressRes = await fetch(ADDRESS_API, { method: "GET", credentials: "include" });
      const addressData = await addressRes.json();
      setSavedAddresses(addressData.addresses);
    } catch (err) {
      toast.error("Failed to add new address");
    }
  };

  const handlePayment = async () => {
    if (!selectedAddressId || !selectedPaymentMethodId || !selectedBillingAddressId) {
      setError("Please select a shipping address, billing address, and payment method");
      return;
    }

    try {
      const selectedPaymentMethod = savedPaymentMethods.find((method) => method.payment_method_id === selectedPaymentMethodId);
      const selectedShippingAddress = savedAddresses.find((address) => address.address_id === selectedAddressId);
      const selectedBillingAddress = savedAddresses.find((address) => address.address_id === selectedBillingAddressId);

      if (!selectedPaymentMethod || !selectedShippingAddress || !selectedBillingAddress) {
        setError("Invalid selection. Please try again.");
        return;
      }

      const paymentPayload = {
        choosen_expedited_shipping: expeditedShipping,
        payment_details: {
          card_number: selectedPaymentMethod.card_number,
          name_on_card: selectedPaymentMethod.name_on_card,
          expiration_date: {
            year: selectedPaymentMethod.expiration_date.year,
            month: selectedPaymentMethod.expiration_date.month,
          },
        },
        shipping_address: {
          street_address: selectedShippingAddress.street_address,
          street_number: selectedShippingAddress.street_number,
          city: selectedShippingAddress.city,
          zip_code: selectedShippingAddress.zip_code,
          country: selectedShippingAddress.country,
        },
        billing_address: {
          street_address: selectedBillingAddress.street_address,
          street_number: selectedBillingAddress.street_number,
          city: selectedBillingAddress.city,
          zip_code: selectedBillingAddress.zip_code,
          country: selectedBillingAddress.country,
        },
      };

      const response = await fetch(`http://localhost:3000/api/payment/submit-payment/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error("Failed to process payment: " + message.message);
      }
      navigate(`/receipt/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing failed");
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
        <p className="text-muted-foreground mt-2">Please review your information and enter payment details</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-6">
                <h3 className="font-medium mb-2">Shipping Address</h3>
                {savedAddresses.length > 0 ? (
                  <div>
                    {savedAddresses.map((address) => (
                      <div key={address.address_id} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          id={`address-${address.address_id}`}
                          name="address"
                          value={address.address_id}
                          checked={selectedAddressId === address.address_id}
                          onChange={() => setSelectedAddressId(address.address_id)}
                        />
                        <label htmlFor={`address-${address.address_id}`} className="text-sm text-muted-foreground">
                          <p>
                            {address.street_address}, {address.street_number}
                          </p>
                          <p>
                            {address.city}, {address.zip_code}
                          </p>
                          <p>{address.country}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>No saved addresses</div>
                )}
                <Button onClick={() => setShowAddAddressForm(!showAddAddressForm)}>{showAddAddressForm ? "Cancel" : "Add New Address"}</Button>
                {showAddAddressForm && (
                  <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4 mt-4">
                      <FormField
                        control={addressForm.control}
                        name="streetAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123 Main St" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="streetNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Apt 4B" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="New York" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="10001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="USA" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Save Address
                      </Button>
                    </form>
                  </Form>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Billing Address</h3>
                {savedAddresses.length > 0 ? (
                  <div>
                    {savedAddresses.map((address) => (
                      <div key={address.address_id} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          id={`billing-address-${address.address_id}`}
                          name="billing-address"
                          value={address.address_id}
                          checked={selectedBillingAddressId === address.address_id}
                          onChange={() => setSelectedBillingAddressId(address.address_id)}
                        />
                        <label htmlFor={`billing-address-${address.address_id}`} className="text-sm text-muted-foreground">
                          <p>
                            {address.street_address}, {address.street_number}
                          </p>
                          <p>
                            {address.city}, {address.zip_code}
                          </p>
                          <p>{address.country}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>No saved addresses</div>
                )}
                <Button onClick={() => setShowAddBillingAddressForm(!showAddBillingAddressForm)}>{showAddBillingAddressForm ? "Cancel" : "Add New Billing Address"}</Button>
                {showAddBillingAddressForm && (
                  <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4 mt-4">
                      <FormField
                        control={addressForm.control}
                        name="streetAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123 Main St" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="streetNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Apt 4B" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="New York" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="10001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="USA" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Save Billing Address
                      </Button>
                    </form>
                  </Form>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Saved Payment Methods</h3>
                {savedPaymentMethods.length > 0 ? (
                  <div>
                    {savedPaymentMethods.map((method) => (
                      <div key={method.payment_method_id} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          id={`payment-${method.payment_method_id}`}
                          name="payment"
                          value={method.payment_method_id}
                          checked={selectedPaymentMethodId === method.payment_method_id}
                          onChange={() => setSelectedPaymentMethodId(method.payment_method_id)}
                        />
                        <label htmlFor={`payment-${method.payment_method_id}`} className="text-sm text-muted-foreground">
                          <p>
                            {method.name_on_card} - {method.card_number}
                          </p>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>No saved payment methods</div>
                )}
                <Button onClick={() => setShowAddPaymentForm(!showAddPaymentForm)}>{showAddPaymentForm ? "Cancel" : "Add New Payment Method"}</Button>
                {showAddPaymentForm && (
                  <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4 mt-4">
                      <FormField
                        control={paymentForm.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-9" placeholder="1234 5678 9012 3456" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="cardName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cardholder Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John Doe" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="MM/YY" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Save Payment Method
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">{auctionItem?.item_name}</p>
                  <p className="text-sm text-muted-foreground">Auction #{id}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Item price:</span>
                  <span>${order?.final_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Standard Shipping:</span>
                  <span>${auctionItem?.shipping_cost.toLocaleString()}</span>
                </div>
                {searchParams.get("expedited") === "true" && auctionItem?.expedited_shipping_cost !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span>Expedited Shipping:</span>
                    <span>${auctionItem.expedited_shipping_cost.toLocaleString()}</span>
                  </div>
                )}

                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Total:</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center gap-4 mt-6">
            {" "}
            {/* Added margin-top for spacing */}
            <Button onClick={handlePayment} className="w-full" disabled={!selectedAddressId || !selectedPaymentMethodId || !selectedBillingAddressId}>
              Pay ${totalPrice.toLocaleString()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
