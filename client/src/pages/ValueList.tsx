import { motion } from "framer-motion";
import { Tag, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ValueList() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 shadow-lg shadow-primary/5">
          <Tag className="w-8 h-8" />
        </div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold font-display text-white"
        >
          Value List
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Check the latest sticker and item values for Bee Swarm Simulator via our trusted partner.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/10 overflow-hidden">
          <CardHeader className="text-center bg-primary/5 border-b border-primary/10 py-8">
            <CardTitle className="text-3xl font-display text-primary">BSSM Values</CardTitle>
            <CardDescription className="text-base">
              Access the reference database for the game's economy.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8 p-10">
            <div className="text-center space-y-4 max-w-md">
              <p className="text-muted-foreground">
                To ensure you have the most accurate and up-to-date information, we redirect you to the official **BSSM Values** website.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm font-medium text-primary/80">
                <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Sticker Values</span>
                <span className="w-1 h-1 rounded-full bg-primary/30" />
                <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Item Trends</span>
              </div>
            </div>
            
            <Button asChild size="lg" className="h-14 px-10 gap-3 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <a href="https://www.bssmvalues.com/valuelist" target="_blank" rel="noopener noreferrer">
                Open Value List
                <ExternalLink className="h-5 w-5" />
              </a>
            </Button>
            
            <p className="text-xs text-muted-foreground/50">
              Note: You will be redirected to an external site.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
