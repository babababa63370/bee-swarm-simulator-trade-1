import { StaffMember } from "@shared/schema";
import { User, Shield, MessageCircle, Youtube, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";

interface StaffCardProps {
  staff: StaffMember;
}

export function StaffCard({ staff }: StaffCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 shadow-md hover:shadow-xl"
    >
      <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 rounded-2xl bg-card p-1 border border-border">
            <div className="w-full h-full rounded-xl bg-black/40 flex items-center justify-center overflow-hidden">
              {staff.avatar ? (
                <img src={staff.avatar} alt={staff.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-12 px-6 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold font-display text-white">{staff.username}</h3>
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5">
            <Shield className="w-3 h-3 fill-primary" />
            {staff.profile?.roleLabel || "Staff"}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
          {staff.bio || "No bio provided."}
        </p>
        
        <div className="flex gap-3">
          {staff.profile?.socialLinks?.discord && (
            <a 
              href={staff.profile.socialLinks.discord} 
              target="_blank" 
              rel="noreferrer"
              className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          )}
          {staff.profile?.socialLinks?.roblox && (
            <a 
              href={staff.profile.socialLinks.roblox} 
              target="_blank" 
              rel="noreferrer"
              className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
            >
              <Gamepad2 className="w-5 h-5" />
            </a>
          )}
          {staff.profile?.socialLinks?.youtube && (
            <a 
              href={staff.profile.socialLinks.youtube} 
              target="_blank" 
              rel="noreferrer"
              className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-600/20"
            >
              <Youtube className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
