import { useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "@/layouts/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
const types = ["Espresso", "Latte", "Cold Brew", "Cappuccino", "Mocha"];

export default function Step3ReviewPost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state } = useLocation() as { state?: { image?: string; cafe?: { name: string } } };
  const img = state?.image;
  const cafe = state?.cafe?.name ?? "Unknown Café";

  const [selected, setSelected] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(4);
  const [pair, setPair] = useState<string>("");


  return (
    <MobileLayout title="Review & Post">
      <section className="p-4 pb-28">
        <h1 className="sr-only">Review & Post</h1>
        {img && (
          <div className="rounded-2xl overflow-hidden border mb-3">
            <img src={img} alt="Your coffee" className="w-full h-60 object-cover" />
          </div>
        )}
        <p className="text-sm mb-2">{cafe}</p>

        <div className="mb-3">
          <p className="text-sm mb-1">Coffee type</p>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <Badge
                key={t}
                onClick={() => setSelected(t)}
                className={`cursor-pointer rounded-full ${selected === t ? 'bg-primary text-primary-foreground' : 'bg-coffee text-coffee-foreground'}`}
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-sm mb-1">Rating</p>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => setRating(i + 1)} aria-label={`Rate ${i + 1}`}>
                <Star className={`h-6 w-6 ${i < rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm mb-1">What would you pair this with?</p>
          <textarea
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            placeholder="e.g., almond croissant"
            className="w-full h-20 rounded-2xl border bg-background p-3 text-sm"
          />
        </div>

        <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-4">
          <Button
            className="w-full rounded-full h-12 text-base"
            onClick={() => {
              toast({ title: "You earned 10 $BEAN tokens!" });
              navigate("/", { state: { posted: true } });
            }}
          >
            Post & Earn
          </Button>
        </div>
      </section>
    </MobileLayout>
  );
}
