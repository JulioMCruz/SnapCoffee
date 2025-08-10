import { useState, useEffect } from 'react';
import { 
  OnrampProvider, 
  OnrampWidget, 
  type OnrampSuccessResponse,
  type OnrampErrorResponse 
} from '@coinbase/onchainkit/onramp';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMiniKit } from '@/hooks/useMiniKit';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  DollarSign, 
  Coffee,
  TrendingUp,
  Gift,
  Zap,
  Users,
  Star
} from 'lucide-react';

interface EnhancedOnrampWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  targetAmount?: number;
  purpose?: 'tipping' | 'rewards' | 'general';
  creatorName?: string;
  onSuccess?: (amount: number) => void;
}

const EnhancedOnrampWidget: React.FC<EnhancedOnrampWidgetProps> = ({
  isOpen,
  onClose,
  targetAmount = 50,
  purpose = 'general',
  creatorName,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'onramp' | 'benefits' | 'creators'>('onramp');
  const [purchaseAmount, setPurchaseAmount] = useState(targetAmount);
  const { walletAddress, isConnected, connectWallet, getBalances } = useMiniKit();
  const { toast } = useToast();
  const [balances, setBalances] = useState({ bean: '0', usdc: '0', eth: '0' });

  // Load balances when widget opens
  useEffect(() => {
    if (isOpen && isConnected) {
      getBalances().then(setBalances);
    }
  }, [isOpen, isConnected, getBalances]);

  // Handle successful onramp purchase
  const handleOnrampSuccess = (response: OnrampSuccessResponse) => {
    const amount = response.onrampData?.amount || purchaseAmount;
    
    toast({
      title: "💰 Funds Added Successfully!",
      description: `$${amount} USDC added to your wallet`,
    });

    // Update backend with new balance
    updateBalanceAfterOnramp(amount);
    
    // Trigger success callback
    onSuccess?.(amount);
    
    // Auto-close after success
    setTimeout(() => onClose(), 2000);
  };

  // Handle onramp errors
  const handleOnrampError = (error: OnrampErrorResponse) => {
    console.error('Onramp error:', error);
    toast({
      title: "Purchase Failed",
      description: error.message || "Failed to complete purchase",
      variant: "destructive"
    });
  };

  // Update backend balance tracking
  const updateBalanceAfterOnramp = async (amount: number) => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/balance/onramp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          amount: amount,
          transactionId: `onramp_${Date.now()}`
        })
      });

      if (response.ok) {
        // Refresh balances
        const newBalances = await getBalances();
        setBalances(newBalances);
      }
    } catch (error) {
      console.error('Balance update error:', error);
    }
  };

  // Connect wallet if not connected
  const handleConnect = async () => {
    if (!isConnected) {
      await connectWallet();
    }
  };

  // Preset amount options based on purpose
  const getPresetAmounts = () => {
    switch (purpose) {
      case 'tipping':
        return [10, 25, 50, 100];
      case 'rewards':
        return [20, 50, 100, 200];
      default:
        return [25, 50, 100, 250];
    }
  };

  // Purpose-specific messaging
  const getPurposeMessage = () => {
    switch (purpose) {
      case 'tipping':
        return creatorName 
          ? `Support ${creatorName} with USDC tips` 
          : 'Support coffee creators with USDC tips';
      case 'rewards':
        return 'Add funds to participate in coffee rewards';
      default:
        return 'Add USDC to your wallet for coffee experiences';
    }
  };

  // Mock trending creators data
  const trendingCreators = [
    { name: 'Coffee King ☕', fid: 12345, tips: '$1,250', followers: '12.5K' },
    { name: 'Emma the Latte Lover', fid: 23456, tips: '$892', followers: '8.9K' },
    { name: 'Marco ☕ Espresso', fid: 34567, tips: '$2,100', followers: '15.2K' },
    { name: 'Sofia | Cold Brew Queen', fid: 45678, tips: '$445', followers: '6.7K' }
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            Add Funds to Wallet
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="onramp" className="text-xs">Buy USDC</TabsTrigger>
            <TabsTrigger value="benefits" className="text-xs">Benefits</TabsTrigger>
            <TabsTrigger value="creators" className="text-xs">Creators</TabsTrigger>
          </TabsList>

          {/* Onramp Tab */}
          <TabsContent value="onramp" className="space-y-4">
            {/* Current Balances */}
            {isConnected && (
              <div className="bg-muted/50 rounded-xl p-4">
                <h4 className="font-medium text-sm mb-2">Current Balance</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">${balances.usdc}</div>
                    <div className="text-muted-foreground">USDC</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-orange-600">{balances.bean}</div>
                    <div className="text-muted-foreground">BEAN</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{balances.eth}</div>
                    <div className="text-muted-foreground">ETH</div>
                  </div>
                </div>
              </div>
            )}

            {/* Purpose Message */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {getPurposeMessage()}
              </p>
              
              {purpose === 'tipping' && (
                <Badge variant="secondary" className="mb-3">
                  <Gift className="h-3 w-3 mr-1" />
                  Tip with USDC on Base Network
                </Badge>
              )}
            </div>

            {/* Quick Amount Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Purchase Amount</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {getPresetAmounts().map((amount) => (
                  <Button
                    key={amount}
                    variant={purchaseAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPurchaseAmount(amount)}
                    className="rounded-xl"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Connect Wallet */}
            {!isConnected ? (
              <Button onClick={handleConnect} className="w-full rounded-xl">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet to Continue
              </Button>
            ) : (
              /* Onramp Widget */
              <OnrampProvider>
                <OnrampWidget
                  config={{
                    appId: import.meta.env.VITE_ONRAMP_APP_ID!,
                    destinationWallet: walletAddress,
                    partnerUserId: walletAddress,
                    defaultAmount: purchaseAmount.toString(),
                    defaultCurrency: 'USDC',
                    defaultNetwork: 'base',
                    defaultPaymentMethod: 'card',
                    fiatCurrency: 'USD'
                  }}
                  onSuccess={handleOnrampSuccess}
                  onError={handleOnrampError}
                />
              </OnrampProvider>
            )}

            {/* Network Info */}
            <div className="text-xs text-center text-muted-foreground">
              <div className="flex items-center justify-center gap-1">
                <Zap className="h-3 w-3" />
                Powered by Base Network - Low fees, fast transactions
              </div>
            </div>
          </TabsContent>

          {/* Benefits Tab */}
          <TabsContent value="benefits" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold mb-2">Why Add USDC?</h3>
              <p className="text-sm text-muted-foreground">
                Unlock the full Snap Coffee experience
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <Coffee className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Tip Coffee Creators</div>
                  <div className="text-xs text-muted-foreground">
                    Support your favorite coffee influencers directly
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Earn More Rewards</div>
                  <div className="text-xs text-muted-foreground">
                    Higher engagement = bonus BEAN tokens
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <Gift className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Exclusive Perks</div>
                  <div className="text-xs text-muted-foreground">
                    Access to premium coffee shop deals
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Fast & Cheap</div>
                  <div className="text-xs text-muted-foreground">
                    Base network ensures low fees and fast transactions
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center pt-2">
              <Button 
                onClick={() => setActiveTab('onramp')} 
                className="w-full rounded-xl"
                size="sm"
              >
                Get Started with ${targetAmount}
              </Button>
            </div>
          </TabsContent>

          {/* Trending Creators Tab */}
          <TabsContent value="creators" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold mb-2">Top Coffee Creators</h3>
              <p className="text-sm text-muted-foreground">
                Support the community's favorite influencers
              </p>
            </div>

            <div className="space-y-3">
              {trendingCreators.map((creator, index) => (
                <div key={creator.fid} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full text-xs font-semibold">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">{creator.name}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {creator.tips} earned
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {creator.followers}
                      </span>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Top
                  </Badge>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <Button 
                onClick={() => setActiveTab('onramp')} 
                className="w-full rounded-xl"
                size="sm"
              >
                Add Funds to Start Tipping
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedOnrampWidget;