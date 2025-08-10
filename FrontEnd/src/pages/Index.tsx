import MobileLayout from "@/layouts/MobileLayout";
import ProgressBar from "@/components/ProgressBar";
import { FeedCard } from "@/components/FeedCard";
import { FarcasterShareButton } from "@/components/FarcasterShareButton";
import coffee1 from "@/assets/coffee1.jpg";
import coffee2 from "@/assets/coffee2.jpg";
import coffee3 from "@/assets/coffee3.jpg";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

const TOTAL = 10;

export default function Index() {
  const [count, setCount] = useState<number>(() => Number(localStorage.getItem("coffees") || 2));
  const location = useLocation() as { state?: { posted?: boolean; shareUrl?: string; snap?: any } };
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Snap Coffee — Home";
  }, []);

  useEffect(() => {
    if (location.state?.posted) {
      const next = Math.min(TOTAL, count + 1);
      setCount(next);
      localStorage.setItem("coffees", String(next));
      
      // Store share URL if available
      if (location.state.shareUrl) {
        setShareUrl(location.state.shareUrl);
      }
      
      // Clear state
      navigate("/", { replace: true, state: undefined });
      if (next === TOTAL) {
        // Confetti celebration
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => navigate("/coupon"), 800);
      }
    }
  }, [location.state]);

  return (
    <MobileLayout title="Snap Coffee">
      <section className="bg-background">
        <h1 className="sr-only">Discover coffee snaps nearby</h1>
        <ProgressBar current={count} total={TOTAL} />
        
        {/* Show share button if we have a share URL */}
        {shareUrl && (
          <div className="px-4 pb-3 pt-2">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <h2 className="text-sm font-medium text-amber-800 mb-2">🎉 Coffee snap uploaded!</h2>
              <p className="text-xs text-amber-700 mb-3">
                Share your coffee snap on Farcaster to earn bonus rewards and connect with other coffee lovers!
              </p>
              <FarcasterShareButton 
                shareUrl={shareUrl} 
                variant="default" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              />
            </div>
          </div>
        )}
        
        <div className="px-4 pb-4">
          <FeedCard image={coffee1} cafe="Blue Bean Cafe" distance="0.3 mi" coffeeType="Latte" rating={5} pairing="almond croissant" />
          <FeedCard image={coffee2} cafe="Roast & Co." distance="0.5 mi" coffeeType="Cold Brew" rating={4} pairing="cinnamon roll" />
          <FeedCard image={coffee3} cafe="Cuppa Corner" distance="0.8 mi" coffeeType="Espresso" rating={4} pairing="dark chocolate" />
        </div>
      </section>
    </MobileLayout>
  );
}
