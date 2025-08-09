import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MiniAppProvider } from "@/providers/MiniAppProvider";
import { Web3Provider } from "@/providers/Web3Provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Step1Camera = lazy(() => import("./pages/snap/Step1Camera"));
const Step2ChooseCafe = lazy(() => import("./pages/snap/Step2ChooseCafe"));
const Step3ReviewPost = lazy(() => import("./pages/snap/Step3ReviewPost"));
const Coupon = lazy(() => import("./pages/Coupon"));
const Profile = lazy(() => import("./pages/Profile"));
const Redeem = lazy(() => import("./pages/Redeem"));

const App = () => (
  <MiniAppProvider>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="p-4">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/snap" element={<Step1Camera />} />
              <Route path="/snap/cafe" element={<Step2ChooseCafe />} />
              <Route path="/snap/review" element={<Step3ReviewPost />} />
              <Route path="/coupon" element={<Coupon />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/redeem" element={<Redeem />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </MiniAppProvider>
);

export default App;
