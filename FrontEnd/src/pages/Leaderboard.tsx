import MobileLayout from "@/layouts/MobileLayout";

const mockLeaders = [
  { name: "Ava", coffees: 42 },
  { name: "Liam", coffees: 37 },
  { name: "Noah", coffees: 33 },
];

export default function Leaderboard() {
  return (
    <MobileLayout title="Leaderboard">
      <section className="p-4">
        <h1 className="sr-only">Snap Coffee Leaderboard</h1>
        <ul className="space-y-3">
          {mockLeaders.map((u, i) => (
            <li key={u.name} className="flex items-center justify-between bg-card border rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.coffees} coffees</p>
                </div>
              </div>
              <div className="text-primary font-semibold">{Math.max(10 - i * 2, 2)} $BEAN</div>
            </li>
          ))}
        </ul>
      </section>
    </MobileLayout>
  );
}
