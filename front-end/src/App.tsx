import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Layout from "./components/Layout";
import Signup from "./pages/Signup";
import Catalogue from "./pages/Catalogue";
import Forward from "./pages/Forward";
import Dutch from "./pages/Dutch";
import AuctionEnded from "./pages/AuctionEnded";
import Payment from "./pages/Payment";
import Receipt from "./pages/Receipt";
import { Toaster } from "sonner";
import { AuctionProvider, useAuction } from "./Context/AuctionContext";

function App() {
  return (
    <AuctionProvider>
      <AuthenticatedApp />
    </AuctionProvider>
  );
}

const AuthenticatedApp = () => {
  const { isAuthenticated, isAuthLoading } = useAuction();
  if (isAuthLoading) {
    return <></>;
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Catalogue />} />
          <Route path="/login" element={isAuthenticated ? <Catalogue /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Catalogue /> : <Signup />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/catalogue" element={isAuthenticated ? <Catalogue /> : <Landing />} />
          <Route path="/forward_auction/:id" element={isAuthenticated ? <Forward /> : <Login />} />
          <Route path="/dutch_auction/:id" element={isAuthenticated ? <Dutch /> : <Login />} />
          <Route path="/auction-ended/:id" element={isAuthenticated ? <AuctionEnded /> : <Login />} />
          <Route path="/payment/:id" element={isAuthenticated ? <Payment /> : <Login />} />
          <Route path="/receipt/:id" element={isAuthenticated ? <Receipt /> : <Login />} />
        </Route>
      </Routes>
      <Toaster position="bottom-left" />
    </BrowserRouter>
  );
};

export default App;
