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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userData?.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success("Account information updated successfully");
        setIsEditing(false);
        fetchUserData();
      } else {
        toast.error("Failed to update account information");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      toast.error("An error occurred while updating your information");
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
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={userData.username} disabled />
                  <p className="text-sm text-muted-foreground">Username cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={isEditing ? formData.first_name : userData.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={isEditing ? formData.last_name : userData.last_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={isEditing ? formData.email : userData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              {isEditing && (
                <div className="mt-6 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              )}
            </form>
          </CardContent>
          {!isEditing && (
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
} 