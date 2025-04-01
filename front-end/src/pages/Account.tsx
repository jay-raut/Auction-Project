import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuction } from "@/Context/AuctionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash } from "lucide-react";

interface UserData {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface PaymentMethod {
  id: string;
  card_type: string;
  last_four: string;
  expires: string;
  is_default: boolean;
}

export default function Account() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuction();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState({
    username: false,
    first_name: false,
    last_name: false,
    email: false,
  });
  const [activeTab, setActiveTab] = useState("account");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [newPayment, setNewPayment] = useState({
    card_number: "",
    card_holder: "",
    expires: "",
    cvv: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchUserData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (userData?.user_id) {
      fetchAddresses();
      fetchPaymentMethods();
    }
  }, [userData]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/authentication/profile", {
        method: "GET",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setFormData({
          username: data.user.username,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          email: data.user.email,
        });
      } else {
        toast.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("An error occurred while fetching user data");
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/user/addresses", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      } else {
        console.error("Failed to fetch addresses");
        toast.error("Failed to load your addresses");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("An error occurred while loading your addresses");
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/user/payment-methods", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } else {
        console.error("Failed to fetch payment methods");
        toast.error("Failed to load your payment methods");
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("An error occurred while loading your payment methods");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAddress({
      ...newAddress,
      [name]: value,
    });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPayment({
      ...newPayment,
      [name]: value,
    });
  };

  const updateField = async (field: 'username' | 'first_name' | 'last_name' | 'email') => {
    if (!userData?.user_id) return;
    
    setIsLoading({...isLoading, [field]: true});
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userData.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ [field]: formData[field] }),
      });
      
      if (response.ok) {
        toast.success(`${field.replace('_', ' ')} updated successfully`);
        fetchUserData();
      } else {
        toast.error(`Failed to update ${field.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(`An error occurred while updating your ${field.replace('_', ' ')}`);
    } finally {
      setIsLoading({...isLoading, [field]: false});
    }
  };

  const addAddress = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/user/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newAddress),
      });
      
      if (response.ok) {
        toast.success("Address added successfully");
        fetchAddresses();
        setNewAddress({
          street: "",
          city: "",
          state: "",
          postal_code: "",
          country: "",
        });
      } else {
        toast.error("Failed to add address");
      }
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("An error occurred while adding your address");
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/user/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        toast.success("Address deleted successfully");
        fetchAddresses();
      } else {
        toast.error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("An error occurred while deleting your address");
    }
  };

  const addPaymentMethod = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/user/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newPayment),
      });
      
      if (response.ok) {
        toast.success("Payment method added successfully");
        fetchPaymentMethods();
        setNewPayment({
          card_number: "",
          card_holder: "",
          expires: "",
          cvv: "",
        });
      } else {
        toast.error("Failed to add payment method");
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast.error("An error occurred while adding your payment method");
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/user/payment-methods/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        toast.success("Payment method deleted successfully");
        fetchPaymentMethods();
      } else {
        toast.error("Failed to delete payment method");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("An error occurred while deleting your payment method");
    }
  };

  if (!userData) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-[50vh]">
          <p>Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>My Account</CardTitle>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="username" 
                        name="username"
                        value={formData.username} 
                        onChange={handleInputChange}
                        className="flex-grow"
                      />
                      <Button 
                        onClick={() => updateField('username')} 
                        disabled={isLoading.username || formData.username === userData.username}
                        size="sm"
                      >
                        {isLoading.username ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="flex-grow"
                      />
                      <Button 
                        onClick={() => updateField('first_name')} 
                        disabled={isLoading.first_name || formData.first_name === userData.first_name}
                        size="sm"
                      >
                        {isLoading.first_name ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="flex-grow"
                      />
                      <Button 
                        onClick={() => updateField('last_name')} 
                        disabled={isLoading.last_name || formData.last_name === userData.last_name}
                        size="sm"
                      >
                        {isLoading.last_name ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="flex-grow"
                      />
                      <Button 
                        onClick={() => updateField('email')} 
                        disabled={isLoading.email || formData.email === userData.email}
                        size="sm"
                      >
                        {isLoading.email ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="addresses">
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Addresses</h3>
                  
                  {addresses.length === 0 ? (
                    <p className="text-muted-foreground">You don't have any addresses yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div key={address.id} className="border rounded-md p-4 relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2"
                            onClick={() => deleteAddress(address.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          <div className="space-y-1">
                            <p>{address.street}</p>
                            <p>{address.city}, {address.state} {address.postal_code}</p>
                            <p>{address.country}</p>
                            {address.is_default && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium mb-4">Add New Address</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          name="street"
                          value={newAddress.street}
                          onChange={handleAddressChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={newAddress.city}
                            onChange={handleAddressChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            name="state"
                            value={newAddress.state}
                            onChange={handleAddressChange}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="postal_code">Postal Code</Label>
                          <Input
                            id="postal_code"
                            name="postal_code"
                            value={newAddress.postal_code}
                            onChange={handleAddressChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            name="country"
                            value={newAddress.country}
                            onChange={handleAddressChange}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={addAddress}
                        disabled={!newAddress.street || !newAddress.city || !newAddress.postal_code || !newAddress.country}
                        className="w-full"
                      >
                        Add Address
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="payments">
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Payment Methods</h3>
                  
                  {paymentMethods.length === 0 ? (
                    <p className="text-muted-foreground">You don't have any payment methods yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="border rounded-md p-4 relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2"
                            onClick={() => deletePaymentMethod(method.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          <div className="space-y-1">
                            <p className="font-medium">{method.card_type}</p>
                            <p>•••• •••• •••• {method.last_four}</p>
                            <p>Expires: {method.expires}</p>
                            {method.is_default && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium mb-4">Add New Payment Method</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="card_number">Card Number</Label>
                        <Input
                          id="card_number"
                          name="card_number"
                          value={newPayment.card_number}
                          onChange={handlePaymentChange}
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card_holder">Card Holder Name</Label>
                        <Input
                          id="card_holder"
                          name="card_holder"
                          value={newPayment.card_holder}
                          onChange={handlePaymentChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="expires">Expiration Date</Label>
                          <Input
                            id="expires"
                            name="expires"
                            value={newPayment.expires}
                            onChange={handlePaymentChange}
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            value={newPayment.cvv}
                            onChange={handlePaymentChange}
                            type="password"
                            maxLength={4}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={addPaymentMethod}
                        disabled={!newPayment.card_number || !newPayment.card_holder || !newPayment.expires || !newPayment.cvv}
                        className="w-full"
                      >
                        Add Payment Method
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 