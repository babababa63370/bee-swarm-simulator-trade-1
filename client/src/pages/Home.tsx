import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Users, ArrowRight, Server, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { BeesmasBanner } from "@/components/BeesmasBanner";
import { SiDiscord } from "react-icons/si";

export default function Home() {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useQuery<{ stickerCount: number, playerCount: string, serverMembers: string }>({
    queryKey: ["/api/stats"]
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-64 rounded-3xl bg-primary/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <h2 className="text-xl font-bold text-white">Oops! Une erreur est survenue</h2>
        <p className="text-muted-foreground">Impossible de charger les statistiques pour le moment.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const statItems = [
    { label: "Players Online", value: stats?.playerCount || "Loading...", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Indexed Stickers", value: stats?.stickerCount?.toString() || "Loading...", icon: Sparkles, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Server Members", value: stats?.serverMembers || "TBD", icon: Server, color: "text-green-400", bg: "bg-green-400/10" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <BeesmasBanner />
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-primary/10 p-8 md:p-12"
      >
        <div className="relative z-10 max-w-2xl">
            <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20"
          >
            <SiDiscord className="w-4 h-4" />
            <span>Official Discord Community Site</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-display text-white mb-6 leading-tight">
            Welcome to the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">BSS HUB</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            The official hub for our Discord community. Track sticker values, connect with top players, and master your hive.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/values" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5">
              <TrendingUp className="w-5 h-5" />
              View Values
            </Link>
            <a href="https://discord.gg/GAvUvfVHxx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5865F2] text-white font-bold hover:bg-[#4752C4] transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5">
              <SiDiscord className="w-5 h-5" />
              Join Discord
            </a>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-secondary/20 blur-[80px] rounded-full translate-y-1/3" />
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {statItems.map((stat, i) => (
          <motion.div 
            key={i}
            variants={item}
            className="bg-card border border-border/50 p-6 rounded-2xl flex items-center gap-4 hover:border-border transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-white">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Latest Updates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display text-white">Latest Updates</h2>
          <button className="text-sm text-primary font-medium hover:underline">View All</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-bold px-2 py-1 rounded bg-secondary/20 text-orange-400 border border-orange-500/20">ANNOUNCEMENT</span>
              <span className="text-xs text-muted-foreground">2 days ago</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">Beesmas Event Guide 2025</h3>
            <p className="text-muted-foreground text-sm">Everything you need to know about the upcoming Beesmas event, including quest requirements and rewards...</p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-bold px-2 py-1 rounded bg-primary/20 text-primary border border-primary/20">MARKET</span>
              <span className="text-xs text-muted-foreground">5 hours ago</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">Sticker Values Updated</h3>
            <p className="text-muted-foreground text-sm">Major adjustments to Riley Bee and Bucko Bee sticker values following the latest patch notes...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
