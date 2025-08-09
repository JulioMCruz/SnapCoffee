import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SupportModalProps {
  onConfirm?: (amount: number) => void;
}

export default function SupportModal({ onConfirm }: SupportModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(5);
  const presets = [5, 10];

  const handleConfirm = () => {
    onConfirm?.(amount);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full" size="lg">Support</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Send a tip</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          {presets.map((p) => (
            <Button key={p} variant={amount === p ? "default" : "secondary"} className="rounded-full" onClick={() => setAmount(p)}>
              ${p}
            </Button>
          ))}
          <div className="flex items-center gap-1 ml-1">
            <span className="text-sm text-muted-foreground">Custom:</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-10 w-20 rounded-full border bg-background px-3 text-sm"
            />
          </div>
        </div>
        <Button onClick={handleConfirm} className="rounded-full">Confirm Tip</Button>
      </DialogContent>
    </Dialog>
  );
}
