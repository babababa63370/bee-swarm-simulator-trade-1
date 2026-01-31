import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Database, 
  Users, 
  LogIn, 
  Hexagon,
  LogOut,
  User
} from "lucide-react";

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Value List", href: "/values", icon: Database },
    { label: "Staff Team", href: "/staff", icon: Users },
  ];

  return (
    <aside className={cn("w-64 flex-shrink-0 bg-card border-r border-border/50 flex flex-col h-screen sticky top-0", className)}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
          <Hexagon className="w-8 h-8 fill-current" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-white">BSS Hub</h1>
          <p className="text-xs text-muted-foreground">Community Platform</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            )}>
              <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        {user ? (
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white overflow-hidden border-2 border-primary/20">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate text-white">{user.username}</p>
                <p className="text-xs text-primary truncate">Member</p>
              </div>
            </div>
            {/* Note: Logout implementation would depend on auth method (likely just hitting a logout endpoint) */}
            <button className="w-full flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-white transition-colors py-2">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        ) : (
          <Link href="/login" className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-all border border-white/10 hover:border-primary/50">
            <LogIn className="w-4 h-4" />
            Login
          </Link>
        )}
      </div>
    </aside>
  );
}
