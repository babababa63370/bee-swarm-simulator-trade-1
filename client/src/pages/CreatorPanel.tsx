import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Star, ShieldAlert, Users, Shield, UserCheck, UserX, Loader2, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CreatorPanel() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/me"] });
  const { data: userList, isLoading } = useQuery<User[]>({ 
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser?.isCreator
  });

  const mutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/role`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User permissions updated." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update permissions." });
    }
  });

  const filteredUsers = useMemo(() => {
    if (!userList) return [];
    return userList.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userList, searchTerm]);

  if (!currentUser?.isCreator) {
    return <div className="p-8">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Star className="w-8 h-8 text-yellow-500" /> Creator Panel
      </h1>

      <Card className="hover-elevate border-yellow-500/50">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-500" />
            <CardTitle>Manage Admins & Staff</CardTitle>
          </div>
          <Users className="w-5 h-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users by username..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Quick Add
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">Assign or revoke permissions for the platform.</p>
            
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-center">Staff</th>
                      <th className="p-3 text-center">Admin</th>
                      <th className="p-3 text-center">Creator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-3 flex items-center gap-2">
                            <img src={user.avatar || ""} className="h-8 w-8 rounded-full border border-primary/20" />
                            <span className="font-medium">{user.username}</span>
                            {user.isCreator && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant={user.isStaff ? "default" : "outline"}
                              className="h-8 gap-1"
                              disabled={(user.isCreator && user.username !== ".meonix") || mutation.isPending}
                              onClick={() => mutation.mutate({ id: user.id, updates: { isStaff: !user.isStaff } })}
                            >
                              {user.isStaff ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                              {user.isStaff ? "Staff" : "None"}
                            </Button>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant={user.isAdmin ? "secondary" : "outline"}
                              className="h-8 gap-1"
                              disabled={(user.isCreator && user.username !== ".meonix") || mutation.isPending}
                              onClick={() => mutation.mutate({ id: user.id, updates: { isAdmin: !user.isAdmin } })}
                            >
                              <Shield className="h-3 w-3" />
                              {user.isAdmin ? "Admin" : "None"}
                            </Button>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant={user.isCreator ? "default" : "outline"}
                              className={`h-8 gap-1 ${user.isCreator ? "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600" : ""}`}
                              disabled={currentUser?.username !== ".meonix" || user.username === ".meonix" || mutation.isPending}
                              onClick={() => mutation.mutate({ id: user.id, updates: { isCreator: !user.isCreator } })}
                            >
                              <Star className="h-3 w-3" />
                              {user.isCreator ? "Creator" : "None"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No users found matching "{searchTerm}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
