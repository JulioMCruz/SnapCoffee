import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/layouts/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Coffee, DollarSign, TrendingUp } from "lucide-react";

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export default function Discover() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [filteredInfluencers, setFilteredInfluencers] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"tips" | "coffees" | "followers">("tips");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Discover Coffee Creators — Snap Coffee";
  }, []);

  // Fetch influencers from backend
  const fetchInfluencers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('sortBy', sortBy);
      params.append('limit', '50');
      
      const response = await fetch(`${API_BASE}/users/creators?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch creators: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setInfluencers(data.data);
        setFilteredInfluencers(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch creators');
      }
      
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast({
        title: "Error Loading Creators",
        description: "Using demo data. Check your connection and try again.",
        variant: "destructive"
      });
      
      // Fall back to mock data for demo
      const mockInfluencers = [
        {
          fid: 12345,
          username: "coffeeking",
          displayName: "Coffee King ☕",
          pfpUrl: "/placeholder.svg",
          bio: "NYC's premier coffee curator. 500+ cafés reviewed.",
          followerCount: 12500,
          coffeeCount: 342,
          totalTips: 1250.50,
          recentTips: 45.25,
          topCafes: ["Blue Bean", "Roast & Co.", "Urban Grind"],
          badges: ["Top Reviewer", "NYC Expert", "Morning Enthusiast"]
        }
      ];
      setInfluencers(mockInfluencers);
      setFilteredInfluencers(mockInfluencers);
      
    } finally {
      setLoading(false);
    }
  };

  // Fetch influencers when component mounts or when search/sort changes
  useEffect(() => {
    fetchInfluencers();
  }, [searchQuery, sortBy]);

  const formatTips = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <MobileLayout title="Discover Creators">
      <section className="px-4 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Coffee Creators</h1>
          <p className="text-sm text-muted-foreground">
            Discover and support amazing coffee content creators
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search creators, cafés, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={sortBy === "tips" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("tips")}
            className="rounded-full"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Tips
          </Button>
          <Button
            variant={sortBy === "coffees" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("coffees")}
            className="rounded-full"
          >
            <Coffee className="h-4 w-4 mr-1" />
            Posts
          </Button>
          <Button
            variant={sortBy === "followers" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("followers")}
            className="rounded-full"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Popular
          </Button>
        </div>

        {/* Influencers List */}
        <div className="space-y-4">
          {filteredInfluencers.map((influencer) => (
            <div
              key={influencer.fid}
              onClick={() => navigate(`/profile/${influencer.fid}`)}
              className="bg-card border rounded-2xl p-4 hover:bg-accent transition-colors cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={influencer.pfpUrl} alt={influencer.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {influencer.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{influencer.displayName}</h3>
                    {influencer.recentTips > 20 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        🔥 Hot
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{influencer.username}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {influencer.bio}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {influencer.badges.map((badge) => (
                  <Badge key={badge} variant="outline" className="text-xs px-2 py-0.5">
                    {badge}
                  </Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 text-center text-xs">
                <div>
                  <div className="font-semibold text-primary">{formatNumber(influencer.followerCount)}</div>
                  <div className="text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="font-semibold text-orange-500">{influencer.coffeeCount}</div>
                  <div className="text-muted-foreground">Coffees</div>
                </div>
                <div>
                  <div className="font-semibold text-green-500">{formatTips(influencer.totalTips)}</div>
                  <div className="text-muted-foreground">Total Tips</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-500">{formatTips(influencer.recentTips)}</div>
                  <div className="text-muted-foreground">Recent</div>
                </div>
              </div>

              {/* Top Cafés */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">Favorite Cafés:</div>
                <div className="flex flex-wrap gap-1">
                  {influencer.topCafes.slice(0, 3).map((cafe) => (
                    <Badge key={cafe} variant="outline" className="text-xs px-2 py-0.5">
                      {cafe}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredInfluencers.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No creators found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or browse all creators
            </p>
          </div>
        )}
      </section>
    </MobileLayout>
  );
}