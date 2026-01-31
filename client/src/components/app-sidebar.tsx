import { 
  Home, 
  Search, 
  Newspaper, 
  Users, 
  MapPin, 
  Youtube, 
  Ticket, 
  ShieldCheck,
  UserCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Values", href: "/values" },
  { icon: Newspaper, label: "News", href: "/news" },
  { icon: Users, label: "Staff", href: "/staff" },
  { icon: MapPin, label: "Tracking", href: "/tracking" },
  { icon: Youtube, label: "Contents", href: "/contents" },
  { icon: Ticket, label: "Codes", href: "/codes" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });

  const hasSpecialAccess = user?.isAdmin || user?.isCreator || user?.isStaff;

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
            B
          </div>
          BSS HUB
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                    tooltip={item.label}
                  >
                    <a href={item.href} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasSpecialAccess && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {user?.isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin"}>
                      <a href="/admin" className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.isCreator && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/creator"}>
                      <a href="/creator" className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        <span>Creator</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
