import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gingerbreadImg from "@/assets/images/gingerbread-bear.png";
import snowflakeImg from "@/assets/images/snowflake.png";

export function BeesmasBanner() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Target date: April 1, 2026 at 07:00:00
    const targetDate = new Date("2026-04-01T07:00:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Predefined snowflake positions to reduce calculation overhead
  const snowflakePositions = [
    { left: "5%", delay: 0, duration: 12 },
    { left: "15%", delay: 2, duration: 15 },
    { left: "25%", delay: 4, duration: 11 },
    { left: "35%", delay: 1, duration: 14 },
    { left: "45%", delay: 3, duration: 13 },
    { left: "55%", delay: 5, duration: 16 },
    { left: "65%", delay: 0.5, duration: 12 },
    { left: "75%", delay: 2.5, duration: 15 },
    { left: "85%", delay: 4.5, duration: 11 },
    { left: "95%", delay: 1.5, duration: 14 },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl mb-8">
      {/* Background Snowfall - Static CSS Animation for performance */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {snowflakePositions.map((pos, i) => (
          <img
            key={i}
            src={snowflakeImg}
            className="absolute opacity-50 w-8 h-8 md:w-10 md:h-10 animate-snow"
            style={{
              left: pos.left,
              animationDelay: `${pos.delay}s`,
              animationDuration: `${pos.duration}s`,
              top: '-40px'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 bg-gradient-to-r from-blue-900/40 via-blue-500/40 to-blue-900/40 backdrop-blur-md border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        {/* Left Bear */}
        <motion.img
          src={gingerbreadImg}
          alt="Gingerbread Bear"
          className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg"
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="flex-1 text-center space-y-4">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-widest drop-shadow-md">
              BEESMAS 2025
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full shadow-lg shadow-primary/20" />
          </div>

          <div className="flex items-center justify-center gap-4 text-white font-mono">
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-tighter opacity-70">Jours</span>
            </div>
            <span className="text-2xl font-bold opacity-50">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-tighter opacity-70">Heures</span>
            </div>
            <span className="text-2xl font-bold opacity-50">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-tighter opacity-70">Min</span>
            </div>
            <span className="text-2xl font-bold opacity-50">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-tighter opacity-70">Sec</span>
            </div>
          </div>
        </div>

        {/* Right Bear */}
        <motion.img
          src={gingerbreadImg}
          alt="Gingerbread Bear"
          className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg scale-x-[-1]"
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
