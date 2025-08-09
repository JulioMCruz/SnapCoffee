import MobileLayout from "@/layouts/MobileLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SupportModal from "@/components/SupportModal";
import { useToast } from "@/hooks/use-toast";
import coffee1 from "@/assets/coffee1.jpg";
import coffee2 from "@/assets/coffee2.jpg";
import coffee3 from "@/assets/coffee3.jpg";

export default function Profile() {
  const { toast } = useToast();

  return (
    <MobileLayout title="Profile">
      <section className="p-4">
        <h1 className="sr-only">Your Profile</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-primary">U</AvatarFallback></Avatar>
            <div>
              <p className="font-semibold">User Name</p>
              <p className="text-xs text-muted-foreground">San Francisco, CA</p>
            </div>
          </div>
          <SupportModal onConfirm={(amt) => toast({ title: `Thanks for the $${amt} tip!` })} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="bg-card border rounded-2xl p-2">
            <p className="text-base font-semibold">12</p>
            <p className="text-[10px] text-muted-foreground">Snaps</p>
          </div>
          <div className="bg-card border rounded-2xl p-2">
            <p className="text-base font-semibold">240</p>
            <p className="text-[10px] text-muted-foreground">$BEAN</p>
          </div>
          <div className="bg-card border rounded-2xl p-2">
            <p className="text-base font-semibold">1</p>
            <p className="text-[10px] text-muted-foreground">Coupons</p>
          </div>
          <div className="bg-card border rounded-2xl p-2">
            <p className="text-base font-semibold">$35</p>
            <p className="text-[10px] text-muted-foreground">Tips</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[coffee1, coffee2, coffee3, coffee2, coffee1, coffee3].map((img, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden border">
              <img src={img} alt={`Coffee snap ${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </section>
    </MobileLayout>
  );
}
