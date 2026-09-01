import { motion } from 'framer-motion';

function GrowthAnimation({ progress = 0, mode = 'light' }) {
  const p = Math.min(Math.max(progress, 0), 1);

  // ==================== COSMIC (BOTH LIGHT AND DARK) ====================
  return (
    <div className="relative w-72 h-80 flex items-center justify-center">
      {/* Aura */}
      <motion.div
        className="absolute rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)',
        }}
        animate={{
          width: 130 + p * 160,
          height: 130 + p * 160,
        }}
      />

      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full border-2 border-orange-400/50"
        animate={{
          width: 95 + p * 140,
          height: 95 + p * 140,
          rotate: p * 100,
        }}
        transition={{ type: 'spring', stiffness: 40 }}
      />

      {/* Planet */}
      <motion.div
        className="absolute rounded-full"
        style={{
          background: 'linear-gradient(135deg, #f97316, #ef4444, #7c3aed)',
        }}
        animate={{
          width: 50 + p * 115,
          height: 50 + p * 115,
          boxShadow: `0 0 ${18 + p * 35}px rgba(249, 115, 22, 0.5)`,
        }}
        transition={{ type: 'spring', stiffness: 50 }}
      />

      {/* Core */}
      <div className="absolute w-4 h-4 rounded-full bg-yellow-200" />
    </div>
  );
}

export default GrowthAnimation;