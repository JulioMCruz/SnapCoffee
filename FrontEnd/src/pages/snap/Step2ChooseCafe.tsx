import { useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "@/layouts/MobileLayout";
import { Input } from "@/components/ui/input";

const cafes = [
  { name: "Blue Bean Cafe", address: "123 Market St", distance: "0.2 mi" },
  { name: "Roast & Co.", address: "55 Pine Ave", distance: "0.4 mi" },
  { name: "Cuppa Corner", address: "89 Grove Rd", distance: "0.7 mi" },
];

export default function Step2ChooseCafe() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { image?: string } };
  const img = state?.image;

  return (
    <MobileLayout title="Choose Café">
      <section className="p-4">
        <h1 className="sr-only">Choose Café</h1>
        <Input placeholder="Search café" className="rounded-full" />
        <ul className="mt-3 space-y-2">
          {cafes.map((c) => (
            <li key={c.name}>
              <button
                onClick={() => navigate("/snap/review", { state: { image: img, cafe: c } })}
                className="w-full text-left bg-card border rounded-2xl p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.address}</p>
                  </div>
                  <span className="text-xs text-primary font-medium">{c.distance}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </MobileLayout>
  );
}
