import MobileLayout from "@/layouts/MobileLayout";
import ProgressBar from "@/components/ProgressBar";
import { FeedCard } from "@/components/FeedCard";
import coffee1 from "@/assets/coffee1.jpg";
import coffee2 from "@/assets/coffee2.jpg";
import coffee3 from "@/assets/coffee3.jpg";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

const TOTAL = 10;

export default function Index() {
  const [count, setCount] = useState<number>(() => Number(localStorage.getItem("coffees") || 2));
  const location = useLocation() as { state?: { posted?: boolean } };
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Snap Coffee — Home";
  }, []);

  useEffect(() => {
    if (location.state?.posted) {
      const next = Math.min(TOTAL, count + 1);
      setCount(next);
      localStorage.setItem("coffees", String(next));
      // Clear state
      navigate("/", { replace: true });
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
        <div className="px-4 pb-4">
          <FeedCard image={coffee1} cafe="Blue Bean Cafe" distance="0.3 mi" coffeeType="Latte" rating={5} pairing="almond croissant" />
          <FeedCard image={coffee2} cafe="Roast & Co." distance="0.5 mi" coffeeType="Cold Brew" rating={4} pairing="cinnamon roll" />
          <FeedCard image={coffee3} cafe="Cuppa Corner" distance="0.8 mi" coffeeType="Espresso" rating={4} pairing="dark chocolate" />
        </div>
      </section>
    </MobileLayout>
  );
}
