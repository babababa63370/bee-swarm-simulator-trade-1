import { Link, useLocation } from "wouter";
import { Home, Tag, Users, Wifi, MessageSquare, Newspaper, LayoutGrid, Ticket, Shield, Star, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const [location] = useLocation();
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/values", label: "Value List", icon: Tag },
    { href: "/news", label: "BSS Leaks", icon: Newspaper },
    { href: "/contents", label: "Contents", icon: Youtube },
    { href: "/codes", label: "Codes", icon: Ticket },
    { href: "/staff", label: "Staff", icon: Users },
    { href: "/tracking", label: "Group Tracking", icon: Wifi },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
            <div className="bg-primary p-2 rounded-lg rotate-3 group-hover:rotate-6 transition-transform">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-primary tracking-tight">BSS HUB</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="gap-2 relative h-9 px-4 py-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {location === item.href && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full" />
                  )}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    <span className="hidden sm:inline-block text-sm font-medium text-white">
                      {user.username}
                    </span>
                    <img
                      src={user.avatar || ""}
                      alt={user.username}
                      className="h-7 w-7 rounded-full border border-primary object-cover"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.isAdmin && (
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  {user.isCreator && (
                    <Link href="/creator">
                      <DropdownMenuItem className="cursor-pointer gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Creator Panel</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => {
                      fetch("/api/auth/logout", { method: "POST" }).then(() => {
                        window.location.href = "/login";
                      });
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
