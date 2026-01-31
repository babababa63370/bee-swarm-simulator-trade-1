import { motion } from "framer-motion";
import snowflakeImg from "@/assets/images/snowflake.png";

export function GlobalSnowfall() {
  // Static positions to avoid re-renders and use CSS animations for performance
  const bannerPositions = [
    { left: "10%", delay: 0, duration: 8 },
    { left: "30%", delay: 2, duration: 10 },
    { left: "50%", delay: 1, duration: 7 },
    { left: "70%", delay: 3, duration: 9 },
    { left: "90%", delay: 0.5, duration: 8 },
  ];

  const globalPositions = [
    { left: "5%", delay: 0, duration: 25 },
    { left: "20%", delay: 5, duration: 30 },
    { left: "35%", delay: 10, duration: 22 },
    { left: "50%", delay: 2, duration: 28 },
    { left: "65%", delay: 8, duration: 24 },
    { left: "80%", delay: 12, duration: 32 },
    { left: "95%", delay: 4, duration: 26 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background large snowflakes - CSS Animated */}
      {bannerPositions.map((pos, i) => (
        <img
          key={`banner-${i}`}
          src={snowflakeImg}
          className="absolute opacity-30 w-6 h-6 md:w-8 md:h-8 animate-snow"
          style={{
            left: pos.left,
            animationDelay: `${pos.delay}s`,
            animationDuration: `${pos.duration}s`,
            top: '-40px',
            opacity: 0.3
          }}
        />
      ))}

      {/* Persistent global snowflakes - CSS Animated */}
      {globalPositions.map((pos, i) => (
        <img
          key={`global-${i}`}
          src={snowflakeImg}
          className="absolute opacity-10 w-3 h-3 md:w-4 md:h-4 animate-snow-global"
          style={{
            left: pos.left,
            animationDelay: `${pos.delay}s`,
            animationDuration: `${pos.duration}s`,
            top: '-20px'
          }}
        />
      ))}
    </div>
  );
}
