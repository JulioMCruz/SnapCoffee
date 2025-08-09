import MobileLayout from "@/layouts/MobileLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function Redeem() {
  const [scanned, setScanned] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  return (
    <MobileLayout title="Redeem Coupon">
      <section className="p-4 text-center">
        <h1 className="sr-only">Coffee Shop Redemption</h1>
        {!scanned ? (
          <>
            <div className="mx-auto rounded-2xl border bg-black/80 h-72 w-72 flex items-center justify-center text-white/80">
              QR Scanner
            </div>
            <Button className="rounded-full mt-4" onClick={() => setScanned(true)}>Simulate Scan</Button>
          </>
        ) : !redeemed ? (
          <>
            <div className="bg-card border rounded-2xl p-4 text-left">
              <p className="font-semibold">Coupon: Free Coffee</p>
              <p className="text-sm text-muted-foreground">User: 0x1234...ABCD</p>
            </div>
            <Button className="rounded-full mt-4" onClick={() => setRedeemed(true)}>Redeem</Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 animate-enter">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <p className="text-primary font-semibold">Redeemed!</p>
          </div>
        )}
      </section>
    </MobileLayout>
  );
}
