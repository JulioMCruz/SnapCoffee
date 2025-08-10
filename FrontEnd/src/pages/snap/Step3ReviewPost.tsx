import { useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "@/layouts/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Loader2 } from "lucide-react";
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
  const [coffeeName, setCoffeeName] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [stateInput, setStateInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!img || !selected || !coffeeName.trim() || !city.trim() || !stateInput.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert blob URL to File for upload
      const response = await fetch(img);
      const blob = await response.blob();
      const file = new File([blob], 'coffee-snap.jpg', { type: 'image/jpeg' });

      // Create form data
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', 'user_123'); // TODO: Get from auth context
      formData.append('fid', '123456'); // TODO: Get from Farcaster auth
      formData.append('coffeeType', selected);
      formData.append('coffeeName', coffeeName);
      formData.append('venueName', cafe);
      formData.append('city', city);
      formData.append('state', stateInput);
      formData.append('rating', rating.toString());
      if (pair.trim()) {
        formData.append('description', `Paired with: ${pair}`);
      }

      // Submit to backend
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const uploadResponse = await fetch(`${apiUrl}/coffee/validate-snap`, {
        method: 'POST',
        body: formData,
      });

      const result = await uploadResponse.json();
      
      if (result.success) {
        // Check if we have a Warpcast share URL (ZodiacCard approach)
        const { farcasterCast, warpcastShareUrl } = result.data || {};
        
        if (farcasterCast) {
          // Automatic posting worked
          toast({ 
            title: "Posted to Farcaster! 🎉", 
            description: `You earned ${result.data?.snap?.rewardAmount || '10'} $BEAN tokens!` 
          });
        } else if (warpcastShareUrl) {
          // Show share option if automatic posting failed
          toast({ 
            title: "Upload Complete! ✅", 
            description: `You earned ${result.data?.snap?.rewardAmount || '10'} $BEAN tokens! Share on Farcaster for bonus rewards.` 
          });
          
          // Store share URL to show share button
          navigate("/", { 
            state: { 
              posted: true, 
              snap: result.data?.snap,
              shareUrl: warpcastShareUrl 
            } 
          });
          return;
        } else {
          // No Farcaster integration
          toast({ 
            title: "Success! 🎉", 
            description: `You earned ${result.data?.snap?.rewardAmount || '10'} $BEAN tokens!` 
          });
        }
        
        navigate("/", { state: { posted: true, snap: result.data?.snap } });
      } else {
        toast({ 
          title: "Upload Failed", 
          description: result.message || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: "Network Error", 
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="mb-3">
          <p className="text-sm mb-1">Coffee name <span className="text-red-500">*</span></p>
          <Input
            value={coffeeName}
            onChange={(e) => setCoffeeName(e.target.value)}
            placeholder="e.g., House Blend"
            className="rounded-2xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-sm mb-1">City <span className="text-red-500">*</span></p>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., San Francisco"
              className="rounded-2xl"
            />
          </div>
          <div>
            <p className="text-sm mb-1">State <span className="text-red-500">*</span></p>
            <Input
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              placeholder="e.g., CA"
              className="rounded-2xl"
            />
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
            onClick={handleSubmit}
            disabled={isSubmitting || !selected || !coffeeName.trim() || !city.trim() || !stateInput.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post & Earn'
            )}
          </Button>
        </div>
      </section>
    </MobileLayout>
  );
}
