import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuction } from "@/Context/AuctionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface UserData {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchUserData();
  }, [isAuthenticated, navigate]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
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
            <CardTitle>Account Information</CardTitle>
            <CardDescription>View and manage your account details</CardDescription>
          </CardHeader>
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