import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gavel, LogOut, ShoppingBag, User, ShoppingCart, CirclePlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuction } from "@/Context/AuctionContext";

export default function Layout() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuction();

  const handleLogout = async () => {
    localStorage.removeItem("isAuthenticated");
    try {
      const response = await fetch("https://localhost:3000/api/authentication/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("Logged out successfully");
        navigate("/", { replace: true });
        window.location.reload();
      } else {
        toast.error("Could not log out");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleOrders = async () => {
    navigate("/orders", { replace: true });
  };

  const handleCreate = async () => {
    navigate("/create", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 font-bold text-xl">
            <Gavel className="h-6 w-6" />
            <span>AuctionHub</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Button
                variant="ghost"
                onClick={() => {
                  window.location.href = "/";
                }}>
                <ShoppingBag className="h-5 w-5 mr-2" />
                Auctions
              </Button>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="p-4">
                    <p className="font-semibold text-sm">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">ID:{user.user_id}</p>
                  </div>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOrders}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreate}>
                    <CirclePlus className="h-5 w-5 mr-2" />
                    <span>Create an Auction</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} AuctionHub. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="#" className="hover:underline">
              Terms
            </Link>
            <Link to="#" className="hover:underline">
              Privacy
            </Link>
            <Link to="#" className="hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
