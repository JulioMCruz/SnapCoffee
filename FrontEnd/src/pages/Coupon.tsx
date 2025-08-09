import MobileLayout from "@/layouts/MobileLayout";
import nftImg from "@/assets/nft-coupon.jpg";
import { Button } from "@/components/ui/button";

function QRPlaceholder() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
      <rect width="200" height="200" fill="currentColor" className="text-secondary" />
      <rect x="20" y="20" width="60" height="60" fill="hsl(var(--foreground))" />
      <rect x="120" y="20" width="60" height="60" fill="hsl(var(--foreground))" />
      <rect x="20" y="120" width="60" height="60" fill="hsl(var(--foreground))" />
      <rect x="120" y="120" width="60" height="60" fill="hsl(var(--foreground))" />
    </svg>
  );
}

export default function Coupon() {
  return (
    <MobileLayout title="NFT Coupon">
      <section className="p-4 text-center">
        <h1 className="text-xl font-bold mb-4">Your 11th coffee is free!</h1>
        <div className="rounded-2xl overflow-hidden border shadow-sm max-w-xs mx-auto">
          <img src={nftImg} alt="Snap Coffee NFT coupon" className="w-full h-auto" />
        </div>
        <div className="mt-4">
          <QRPlaceholder />
        </div>
        <p className="text-sm text-muted-foreground mt-2">Participating café: Blue Bean Cafe</p>
        <div className="mt-4">
          <Button className="rounded-full">Redeem</Button>
        </div>
      </section>
    </MobileLayout>
  );
}
