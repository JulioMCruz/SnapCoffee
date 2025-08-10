import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Trophy, Camera, User } from "lucide-react";
import UserProfile from "@/components/UserProfile";

interface MobileLayoutProps {
  title?: string;
  children: ReactNode;
}

export default function MobileLayout({ title = "Snap Coffee", children }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Snap Coffee" 
              className="h-7 w-7 rounded-lg object-contain"
              onError={(e) => {
                // Fallback if logo.png fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center hidden">
              <span className="text-primary text-sm font-bold">SC</span>
            </div>
            <span className="font-semibold">{title}</span>
          </div>
          <UserProfile />
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto pb-24">{children}</main>

      <nav aria-label="Bottom Navigation" className="fixed bottom-3 inset-x-0 z-40">
        <div className="max-w-md mx-auto px-4">
          <div className="relative bg-white dark:bg-secondary rounded-2xl shadow-lg border flex items-center justify-between px-6 py-3">
            <NavLink to="/" end aria-label="Home"
              className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <Home className={`h-6 w-6 ${isActive("/") ? "text-primary" : "text-primary"}`} />
              <span className="mt-1">Home</span>
            </NavLink>

            <NavLink to="/leaderboard" aria-label="Leaderboard"
              className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <Trophy className={`h-6 w-6 ${isActive("/leaderboard") ? "text-primary" : "text-primary"}`} />
              <span className="mt-1">Top</span>
            </NavLink>

            <button
              aria-label="Snap"
              onClick={() => navigate("/snap")}
              className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full h-14 w-14 shadow-lg ring-4 ring-primary/20 active:scale-95 transition-transform">
              <div className="relative flex items-center justify-center h-full w-full">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75 animate-[ping_1.5s_ease-out_infinite]"></span>
                <Camera className="relative h-7 w-7" />
              </div>
            </button>

            <NavLink to="/profile" aria-label="Profile"
              className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <User className={`h-6 w-6 ${isActive("/profile") ? "text-primary" : "text-primary"}`} />
              <span className="mt-1">Profile</span>
            </NavLink>
          </div>
        </div>
      </nav>
    </div>
  );
}
