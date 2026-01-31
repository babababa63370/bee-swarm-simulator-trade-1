import { Sticker } from "@shared/schema";
import { ArrowUp, ArrowDown, Minus, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StickerCardProps {
  sticker: Sticker;
  layout?: "grid" | "row";
}

export function StickerCard({ sticker, layout = "grid" }: StickerCardProps) {
  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "rising": return <ArrowUp className="w-4 h-4 text-green-500" />;
      case "falling": return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendText = (trend: string | null) => {
    switch (trend) {
      case "rising": return "Rising";
      case "falling": return "Falling";
      default: return "Stable";
    }
  };

  const getTrendColor = (trend: string | null) => {
    switch (trend) {
      case "rising": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "falling": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-white/5 text-muted-foreground border-white/10";
    }
  };

  if (layout === "row") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 5 }}
        transition={{ duration: 0.2 }}
        className="group relative bg-card border border-border rounded-xl p-3 flex items-center gap-4 shadow-sm hover:shadow-primary/5 hover:border-primary/30 transition-all"
      >
        <div className="w-12 h-12 rounded-lg bg-black/20 overflow-hidden flex items-center justify-center border border-white/5 shrink-0">
          {sticker.image ? (
            <img src={sticker.image} alt={sticker.name} className="w-10 h-10 object-contain drop-shadow-md" />
          ) : (
            <div className="text-2xl">🐝</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white font-display truncate">{sticker.name}</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{sticker.category}</p>
        </div>

        <div className="hidden sm:flex flex-1 items-center gap-4 px-2">
          <div className="flex-1 max-w-[120px]">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-tighter">
              <span>Demand</span>
              <span className="font-bold text-white">{sticker.demand}/10</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(sticker.demand ?? 5) * 10}%` }}
                className={cn(
                  "h-full rounded-full",
                  (sticker.demand ?? 5) > 7 ? "bg-green-500" : (sticker.demand ?? 5) > 4 ? "bg-yellow-500" : "bg-red-500"
                )}
              />
            </div>
          </div>
          
          <div className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
            sticker.status === "overpay" ? "bg-green-500/10 text-green-500 border-green-500/20" :
            sticker.status === "underpay" ? "bg-red-500/10 text-red-500 border-red-500/20" :
            "bg-blue-500/10 text-blue-500 border-blue-500/20"
          )}>
            {sticker.status ?? "stable"}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className={cn(
            "text-[10px] uppercase font-bold px-2 py-1 rounded-full border flex items-center gap-1",
            getTrendColor(sticker.trend)
          )}>
            {getTrendIcon(sticker.trend)}
            <span className="hidden xs:inline">{getTrendText(sticker.trend)}</span>
          </div>

          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-bold text-primary tabular-nums">{sticker.price?.toLocaleString() ?? 0}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-card border border-border rounded-2xl p-4 flex flex-col gap-4 shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300"
    >
      <div className="relative aspect-square rounded-xl bg-black/20 overflow-hidden flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
        {sticker.image ? (
          <img 
            src={sticker.image} 
            alt={sticker.name} 
            className="w-3/4 h-3/4 object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110" 
          />
        ) : (
          <div className="text-4xl">🐝</div>
        )}
        
        <div className="absolute top-2 right-2">
          <span className={cn(
            "text-[10px] uppercase font-bold px-2 py-1 rounded-full border flex items-center gap-1",
            getTrendColor(sticker.trend)
          )}>
            {getTrendIcon(sticker.trend)}
            {getTrendText(sticker.trend)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <h3 className="font-bold text-lg text-white font-display leading-tight">{sticker.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{sticker.category} Sticker</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Value</p>
              <p className="font-bold text-primary">{sticker.price?.toLocaleString() ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
