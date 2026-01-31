import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Shield, UserPlus, Settings } from "lucide-react";

export default function AdminPanel() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });

  if (!user?.isAdmin) {
    return <div className="p-8">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Shield className="w-8 h-8 text-primary" /> Admin Panel
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center gap-2">
            <UserPlus className="w-5 h-5" />
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage user roles and permissions.</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>Site Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configure global application settings.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
