import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Ticket, Gift, Clock, Plus, Trash2, X, Edit2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Codes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [usedCodes, setUsedCodes] = useState<Record<number, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCode, setNewCode] = useState({
    code: "",
    reward: "",
    description: "",
    status: "active" as "active" | "expired"
  });

  const { data: codes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/codes"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/codes", {
        ...data,
        reward: typeof data.reward === 'string' ? data.reward.split(",").map((s: string) => s.trim()) : data.reward
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
      setIsAdding(false);
      setNewCode({ code: "", reward: "", description: "", status: "active" });
      toast({ title: "Code added!" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/codes/${id}`, {
        ...data,
        reward: typeof data.reward === 'string' ? data.reward.split(",").map((s: string) => s.trim()) : data.reward
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
      setEditingId(null);
      toast({ title: "Code updated!" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
      toast({ title: "Code deleted!" });
    }
  });

  const startEditing = (code: any) => {
    setEditingId(code.id);
    setNewCode({
      code: code.code,
      reward: code.reward.join(", "),
      description: code.description,
      status: code.status
    });
    setIsAdding(true);
  };

  const cancelAction = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewCode({ code: "", reward: "", description: "", status: "active" });
  };

  const toggleUsed = (id: number) => {
    setUsedCodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast({
        title: "Code copied!",
        description: `Code ${code} has been copied to your clipboard.`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy code.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 shadow-lg shadow-primary/5">
          <Ticket className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold font-display text-white">Promotional Codes</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Redeem these codes in Bee Swarm Simulator to get exclusive rewards.
        </p>
        
        {user?.isAdmin && (
          <Button 
            onClick={() => isAdding ? cancelAction() : setIsAdding(true)}
            className="mt-4 gap-2"
            variant={isAdding ? "outline" : "default"}
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Cancel" : "Add a code"}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-xl mx-auto"
          >
            <Card className="border-primary/20 bg-primary/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  {editingId ? "Edit code" : "Add a new code"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Code</label>
                    <Input 
                      placeholder="Ex: BEESMAS2025" 
                      value={newCode.code}
                      onChange={e => setNewCode({...newCode, code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                    <select 
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newCode.status}
                      onChange={e => setNewCode({...newCode, status: e.target.value as any})}
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                  <Input 
                    placeholder="Ex: Special code for..." 
                    value={newCode.description}
                    onChange={e => setNewCode({...newCode, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rewards (comma separated)</label>
                  <Textarea 
                    placeholder="Ex: 5 Gingerbread Bears, 1 Smooth Wax" 
                    value={newCode.reward}
                    onChange={e => setNewCode({...newCode, reward: e.target.value})}
                  />
                </div>
                <Button 
                  className="w-full" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  onClick={() => editingId ? updateMutation.mutate({ id: editingId, data: newCode }) : createMutation.mutate(newCode)}
                >
                  {editingId ? "Update" : "Confirm addition"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-64 border-white/5 bg-white/5 animate-pulse" />
          ))
        ) : (
          codes.map((code: any) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="flex relative group"
            >
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors overflow-hidden w-full flex flex-col">
                <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between space-y-0">
                  <Badge 
                    variant={code.status === "active" ? "default" : "secondary"}
                    className={code.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                  >
                    {code.status === "active" ? "Active" : "Expired"}
                  </Badge>
                  <div className="flex gap-2">
                    {user?.isAdmin && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => startEditing(code)}
                        >
                          <Edit2 className="h-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => deleteMutation.mutate(code.id)}
                        >
                          <Trash2 className="h-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="mt-auto pb-4">
                    <div className="relative group/code">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary opacity-20 group-hover/code:opacity-100 transition duration-1000 group-hover/code:duration-200 blur rounded-lg"></div>
                      <div className="relative flex items-center gap-2 p-1 bg-background rounded-lg border border-white/10">
                        <code className="flex-1 px-3 py-2 font-mono text-lg font-bold text-primary text-center tracking-wider">
                          {code.code}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(code.code, code.id)}
                          className="h-10 w-10 shrink-0 hover:bg-primary/20 hover:text-primary transition-colors"
                        >
                          {copiedId === code.id ? (
                            <Check className="h-5 w-5 text-green-400" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      className={`w-full font-bold mt-4 transition-all duration-300 ${
                        usedCodes[code.id] 
                          ? "bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20" 
                          : "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg shadow-green-500/20"
                      }`}
                      onClick={() => toggleUsed(code.id)}
                    >
                      {usedCodes[code.id] ? "USED" : "NOT USED"}
                    </Button>
                  </div>

                  <div className="space-y-3 flex-1">
                    <p className="text-sm font-bold text-white leading-tight">
                      {code.description}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Rewards:</p>
                      <ul className="space-y-1">
                        {code.reward.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-foreground/90 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
