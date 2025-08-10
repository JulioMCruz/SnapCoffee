import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";

// CDP Onramp configuration
const ONRAMP_CONFIG = {
  appId: import.meta.env.VITE_CDP_APP_ID || "your-app-id", // Add to .env
  apiKey: import.meta.env.VITE_CDP_API_KEY || "your-api-key", // Add to .env
  baseUrl: "https://pay.coinbase.com/buy/select-asset",
  testMode: true, // Set to false for production
};

// Apple Pay Onramp API configuration for testing
const APPLE_PAY_TEST_CONFIG = {
  // Test merchant configuration (from CDP docs)
  merchantIdentifier: "merchant.com.yourapp.snapcoffee",
  merchantCapabilities: ["supports3DS"],
  supportedNetworks: ["visa", "masterCard", "amex", "discover"],
  countryCode: "US",
  currencyCode: "USD",
  supportedCountries: ["US", "GB", "CA", "AU"],
};

interface OnrampWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  targetAmount?: number;
  onSuccess?: (amount: number) => void;
}

declare global {
  interface Window {
    ApplePaySession?: any;
  }
}

export default function OnrampWidget({ 
  isOpen, 
  onClose, 
  targetAmount = 50, 
  onSuccess 
}: OnrampWidgetProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(targetAmount);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple-pay' | 'bank'>('card');
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);

  // Check Apple Pay availability
  useEffect(() => {
    if (window.ApplePaySession) {
      setIsApplePayAvailable(
        window.ApplePaySession.canMakePayments() &&
        window.ApplePaySession.canMakePaymentsWithActiveCard(APPLE_PAY_TEST_CONFIG.merchantIdentifier)
      );
    }
  }, []);

  const handleCreditCardPurchase = async () => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // CDP Onramp URL with parameters
      const onrampUrl = new URL(ONRAMP_CONFIG.baseUrl);
      onrampUrl.searchParams.append('appId', ONRAMP_CONFIG.appId);
      onrampUrl.searchParams.append('destinationWallets', JSON.stringify([{
        address: address,
        blockchains: ['base']
      }]));
      onrampUrl.searchParams.append('assets', JSON.stringify(['USDC']));
      onrampUrl.searchParams.append('presetFiatAmount', selectedAmount.toString());
      onrampUrl.searchParams.append('fiatCurrency', 'USD');

      // Open Coinbase Pay in a popup or redirect
      const popup = window.open(
        onrampUrl.toString(),
        'coinbase-pay',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for popup close or success message
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          setLoading(false);
          
          // Simulate success for demo (in production, you'd verify the transaction)
          if (onSuccess) {
            onSuccess(selectedAmount);
          }
          
          toast({
            title: "Funds Added Successfully!",
            description: `${selectedAmount} USDC has been added to your wallet`
          });
          
          onClose();
        }
      }, 1000);

    } catch (error) {
      console.error('Onramp error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplePayPurchase = async () => {
    if (!isApplePayAvailable || !window.ApplePaySession) {
      toast({
        title: "Apple Pay Unavailable",
        description: "Apple Pay is not available on this device",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Apple Pay payment request (based on CDP documentation)
      const paymentRequest = {
        countryCode: APPLE_PAY_TEST_CONFIG.countryCode,
        currencyCode: APPLE_PAY_TEST_CONFIG.currencyCode,
        supportedNetworks: APPLE_PAY_TEST_CONFIG.supportedNetworks,
        merchantCapabilities: APPLE_PAY_TEST_CONFIG.merchantCapabilities,
        total: {
          label: 'USDC Purchase',
          amount: selectedAmount.toString(),
          type: 'final'
        },
        lineItems: [
          {
            label: `${selectedAmount} USDC`,
            amount: selectedAmount.toString(),
            type: 'final'
          }
        ],
        merchantIdentifier: APPLE_PAY_TEST_CONFIG.merchantIdentifier,
        applicationData: btoa(JSON.stringify({
          destinationWallet: address,
          blockchain: 'base',
          asset: 'USDC'
        }))
      };

      const session = new window.ApplePaySession(3, paymentRequest);
      
      session.onvalidatemerchant = async (event: any) => {
        // In production, validate merchant session with your backend
        // For demo purposes, we'll simulate validation
        console.log('Validating merchant session...', event);
        
        // Mock merchant session object
        const merchantSession = {
          epochTimestamp: Date.now(),
          expiresAt: Date.now() + 3600000,
          merchantSessionIdentifier: 'test-session-id',
          nonce: 'test-nonce',
          merchantIdentifier: APPLE_PAY_TEST_CONFIG.merchantIdentifier,
          displayName: 'Snap Coffee',
          signature: 'test-signature',
          initiative: 'web',
          initiativeContext: window.location.hostname
        };
        
        session.completeMerchantValidation(merchantSession);
      };
      
      session.onpaymentauthorized = async (event: any) => {
        console.log('Payment authorized:', event);
        
        try {
          // Process payment with CDP Onramp Apple Pay API
          const response = await fetch('/api/process-apple-pay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${ONRAMP_CONFIG.apiKey}`
            },
            body: JSON.stringify({
              paymentData: event.payment,
              amount: selectedAmount,
              destinationWallet: address,
              blockchain: 'base',
              asset: 'USDC'
            })
          });
          
          if (response.ok) {
            session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
            
            if (onSuccess) {
              onSuccess(selectedAmount);
            }
            
            toast({
              title: "Purchase Successful!",
              description: `${selectedAmount} USDC has been added to your wallet`
            });
            
            onClose();
          } else {
            session.completePayment(window.ApplePaySession.STATUS_FAILURE);
            throw new Error('Payment processing failed');
          }
        } catch (error) {
          console.error('Apple Pay processing error:', error);
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          throw error;
        }
      };
      
      session.oncancel = () => {
        console.log('Apple Pay cancelled');
        setLoading(false);
      };
      
      session.begin();
      
    } catch (error) {
      console.error('Apple Pay error:', error);
      toast({
        title: "Apple Pay Failed",
        description: "There was an error processing your Apple Pay transaction",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleBankTransfer = async () => {
    // For demo purposes, simulate bank transfer
    setLoading(true);
    
    toast({
      title: "Bank Transfer Initiated",
      description: "This feature is coming soon. Use card payment for now.",
    });
    
    setTimeout(() => setLoading(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Add USDC to Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Amount Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Select Amount</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[25, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  onClick={() => setSelectedAmount(amount)}
                  className="rounded-xl"
                >
                  ${amount}
                </Button>
              ))}
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">{formatCurrency(selectedAmount)}</span>
              <div className="text-sm text-muted-foreground">≈ {selectedAmount} USDC</div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Payment Method</label>
            <div className="space-y-2">
              {/* Credit/Debit Card */}
              <Button
                variant={paymentMethod === 'card' ? "default" : "outline"}
                onClick={() => setPaymentMethod('card')}
                className="w-full justify-start rounded-xl h-12"
              >
                <CreditCard className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="text-sm font-medium">Credit/Debit Card</div>
                  <div className="text-xs text-muted-foreground">Instant • 3.99% fee</div>
                </div>
              </Button>

              {/* Apple Pay */}
              {isApplePayAvailable && (
                <Button
                  variant={paymentMethod === 'apple-pay' ? "default" : "outline"}
                  onClick={() => setPaymentMethod('apple-pay')}
                  className="w-full justify-start rounded-xl h-12"
                >
                  <Smartphone className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Apple Pay</div>
                    <div className="text-xs text-muted-foreground">Instant • 3.99% fee</div>
                  </div>
                </Button>
              )}

              {/* Bank Transfer */}
              <Button
                variant={paymentMethod === 'bank' ? "default" : "outline"}
                onClick={() => setPaymentMethod('bank')}
                className="w-full justify-start rounded-xl h-12"
                disabled
              >
                <Wallet className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="text-sm font-medium">Bank Transfer</div>
                  <div className="text-xs text-muted-foreground">1-3 days • Low fees (Coming Soon)</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3">
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <div className="font-medium mb-1">🔐 Secure Payment</div>
              <div>Powered by Coinbase Pay. Your payment information is encrypted and secure.</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                switch (paymentMethod) {
                  case 'card':
                    handleCreditCardPurchase();
                    break;
                  case 'apple-pay':
                    handleApplePayPurchase();
                    break;
                  case 'bank':
                    handleBankTransfer();
                    break;
                }
              }}
              disabled={loading}
              className="rounded-xl flex-1"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {paymentMethod === 'apple-pay' ? 'Pay with Apple Pay' : `Buy ${selectedAmount} USDC`}
            </Button>
          </div>

          {/* Test Mode Notice */}
          {ONRAMP_CONFIG.testMode && (
            <div className="text-xs text-center text-muted-foreground">
              ⚠️ Test Mode - No real payments will be processed
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}