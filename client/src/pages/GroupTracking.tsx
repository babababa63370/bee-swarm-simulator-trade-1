import { motion } from "framer-motion";
import { Shield, Bell, Users, CheckCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function GroupTracking() {
  const { toast } = useToast();
  const { data: user, isLoading: isLoadingUser } = useQuery<any>({ 
    queryKey: ["/api/auth/me"] 
  });

  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/user/tracking", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: data.trackingEnabled ? "Tracking Enabled" : "Tracking Disabled",
        description: data.trackingEnabled 
          ? "You will receive a Discord notification when someone is accepted into the group." 
          : "You will no longer receive notifications.",
      });
    },
  });

  const testPingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/test-ping");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ping Test",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ping Error",
        description: error.message || "Failed to send test.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Login to enable tracking</h2>
        <Button asChild>
          <a href="/api/auth/discord">Connect with Discord</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 shadow-lg shadow-primary/5">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold font-display text-white">Roblox Group Tracking</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Monitor new members accepted into the <span className="text-white font-bold">Roblox Testing Group</span> and receive instant Discord notifications.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Discord Notifications
            </CardTitle>
            <CardDescription>
              Enable this option to receive a private Discord message for each acceptance.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between p-6 bg-muted/20 rounded-b-xl border-t border-white/5">
            <div className="space-y-0.5">
              <Label htmlFor="tracking" className="text-base">Tracking Status</Label>
              <p className="text-sm text-muted-foreground italic">
                {user.trackingEnabled ? "Enabled - Waiting for new members" : "Disabled"}
              </p>
            </div>
            <Switch 
              id="tracking" 
              checked={user.trackingEnabled} 
              onCheckedChange={(checked) => mutation.mutate(checked)}
              disabled={mutation.isPending}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Group Info
            </CardTitle>
            <CardDescription>
              Details of the monitored group.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="text-white font-medium">Roblox Testing Group</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="text-white font-medium">5211428</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Frequency:</span>
              <span className="text-primary font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Real-time
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-center space-y-4">
        <p className="text-muted-foreground italic text-sm">
          Note: The system automatically checks if you are on the required server. If not, you will be invited to join during the next notification.
        </p>
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => testPingMutation.mutate()}
            disabled={testPingMutation.isPending}
            className="gap-2"
          >
            {testPingMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Test Notification Ping
          </Button>
        </div>
      </div>
    </div>
  );
}
