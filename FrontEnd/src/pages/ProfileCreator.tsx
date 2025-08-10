import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileLayout from "@/layouts/MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import OnrampWidget from "@/components/OnrampWidget";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { 
  Heart, 
  Coffee, 
  MapPin, 
  Star, 
  DollarSign, 
  Users, 
  Calendar,
  Wallet,
  AlertCircle,
  ChevronLeft
} from "lucide-react";

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export default function ProfileCreator() {
  const { fid } = useParams<{ fid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance: userBalance, sendTip, refreshBalance } = useUSDCBalance();
  
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tipAmount, setTipAmount] = useState("");
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [showOnrampDialog, setShowOnrampDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");

  // Fetch creator data from backend
  const fetchCreator = async () => {
    if (!fid) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/users/${fid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCreator(data.data);
        document.title = `${data.data.displayName} — Snap Coffee`;
      } else {
        throw new Error(data.message || 'User not found');
      }
      
    } catch (error) {
      console.error('Error fetching creator:', error);
      toast({
        title: "Error Loading Profile",
        description: "Could not load creator profile. Please try again.",
        variant: "destructive"
      });
      
      // Navigate back if user not found
      setTimeout(() => navigate(-1), 2000);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreator();
  }, [fid]);

  const formatCurrency = (amount: number) => {
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

  const handleTip = async () => {
    const amount = parseFloat(tipAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount",
        variant: "destructive"
      });
      return;
    }

    if (amount > userBalance) {
      setShowTipDialog(false);
      setShowOnrampDialog(true);
      return;
    }

    try {
      // Use the USDC balance hook to send the tip
      const success = await sendTip(creator.fid, amount);
      
      if (success) {
        // Update creator's tip totals locally
        setCreator((prev: any) => ({
          ...prev,
          totalTips: prev.totalTips + amount,
          recentTips: prev.recentTips + amount
        }));
        
        setShowTipDialog(false);
        setTipAmount("");
        
        toast({
          title: "Tip Sent Successfully! 🎉",
          description: `You tipped ${formatCurrency(amount)} to ${creator.displayName}`
        });
      }
    } catch (error) {
      console.error('Tip failed:', error);
      toast({
        title: "Transaction Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleOnrampSuccess = (amount: number) => {
    // Refresh balance from backend after successful onramp
    refreshBalance();
    
    toast({
      title: "Funds Added Successfully! 🎉",
      description: `${formatCurrency(amount)} USDC added to your wallet`
    });
    
    // Auto-open tip dialog if user was trying to tip
    if (tipAmount) {
      setShowTipDialog(true);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Loading Profile">
        <div className="flex items-center justify-center h-64">
          <p>Loading creator profile...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!creator) {
    return (
      <MobileLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <p>Creator not found</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={creator.displayName}>
      <div className="relative">
        {/* Header with back button and balance */}
        <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-full p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-green-500" />
            <span className="font-medium">{formatCurrency(userBalance)} USDC</span>
          </div>
        </div>

        {/* Profile Header */}
        <div className="p-4 border-b">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={creator.pfpUrl} alt={creator.displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {creator.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-1">{creator.displayName}</h1>
              <p className="text-muted-foreground text-sm mb-2">@{creator.username}</p>
              <p className="text-sm mb-3">{creator.bio}</p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {new Date(creator.joinedDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className="rounded-full flex-1"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                
                <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full flex-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Tip
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-primary">{formatNumber(creator.followerCount)}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="font-semibold text-orange-500">{creator.coffeeCount}</div>
              <div className="text-xs text-muted-foreground">Coffees</div>
            </div>
            <div>
              <div className="font-semibold text-green-500">{formatCurrency(creator.totalTips)}</div>
              <div className="text-xs text-muted-foreground">Total Tips</div>
            </div>
            <div>
              <div className="font-semibold text-blue-500">{formatNumber(creator.followingCount)}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {creator.badges?.map((badge: string) => (
              <Badge key={badge} variant="outline" className="text-xs px-2 py-1">
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "posts" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Recent Posts
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "about" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "posts" && (
          <div className="p-4 space-y-4">
            {creator?.recentPosts?.length > 0 ? (
              creator.recentPosts.map((post: any) => (
              <div key={post.id} className="bg-card border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{post.cafe}</span>
                    <span className="text-xs text-muted-foreground">• {post.location}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(post.timestamp)}</span>
                </div>
                
                <div className="rounded-xl overflow-hidden mb-3">
                  <img src={post.image} alt={post.coffeeType} className="w-full h-48 object-cover" />
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.coffeeType}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < post.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {post.pairing && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Pairs well with {post.pairing}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span>{formatCurrency(post.tips)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="text-center py-8">
                <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No coffee snaps yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="p-4 space-y-6">
            {/* Top Cafés */}
            <div>
              <h3 className="font-semibold mb-3">Favorite Cafés</h3>
              <div className="flex flex-wrap gap-2">
                {creator?.topCafes?.map((cafe: string) => (
                  <Badge key={cafe} variant="outline" className="px-3 py-1">
                    <Coffee className="h-3 w-3 mr-1" />
                    {cafe}
                  </Badge>
                )) || <p className="text-sm text-muted-foreground">No favorite cafés yet</p>}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="font-semibold mb-3">Achievements</h3>
              <div className="space-y-3">
                {creator?.achievements?.map((achievement: any) => (
                  <div key={achievement.name} className="flex items-center gap-3 p-3 bg-card border rounded-xl">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{achievement.name}</div>
                      <div className="text-xs text-muted-foreground">{achievement.description}</div>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No achievements yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tip Dialog */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tip {creator.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount (USDC)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="rounded-xl"
              />
              <div className="flex gap-2 mt-2">
                {[5, 10, 25].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTipAmount(amount.toString())}
                    className="rounded-full flex-1"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Your balance:</span>
              <span className="font-medium">{formatCurrency(userBalance)} USDC</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTipDialog(false)}
                className="rounded-full flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTip}
                disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                className="rounded-full flex-1"
              >
                Send Tip
              </Button>
            </div>
          </div>
        </DialogContent>

        {/* Onramp Widget */}
        <OnrampWidget
          isOpen={showOnrampDialog}
          onClose={() => setShowOnrampDialog(false)}
          targetAmount={parseFloat(tipAmount) || 50}
          onSuccess={handleOnrampSuccess}
        />
      </div>
    </MobileLayout>
  );
}