import { Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeedCardProps {
  image: string;
  cafe: string;
  distance: string;
  coffeeType: string;
  rating: number; // 1-5
  pairing: string;
}

export function FeedCard({ image, cafe, distance, coffeeType, rating, pairing }: FeedCardProps) {
  return (
    <article className="bg-card rounded-2xl overflow-hidden border shadow-sm mb-4 animate-enter">
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img src={image} alt={`${coffeeType} at ${cafe}`} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold">{cafe}</h2>
          <div className="flex items-center text-muted-foreground text-xs">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            <span>{distance}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-coffee text-coffee-foreground rounded-full">{coffeeType}</Badge>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Pairs well with <span className="font-medium text-foreground">{pairing}</span></p>
      </div>
    </article>
  );
}
