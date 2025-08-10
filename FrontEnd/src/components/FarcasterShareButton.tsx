import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface FarcasterShareButtonProps {
  shareUrl: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export function FarcasterShareButton({ 
  shareUrl, 
  className = "", 
  variant = "outline" 
}: FarcasterShareButtonProps) {
  const handleShare = () => {
    // Open Warpcast compose window (ZodiacCard approach)
    window.open(shareUrl, "_blank", "width=600,height=400,scrollbars=yes,resizable=yes");
  };

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      className={`${className}`}
    >
      <Share2 className="mr-2 h-4 w-4" />
      Share on Farcaster
    </Button>
  );
}