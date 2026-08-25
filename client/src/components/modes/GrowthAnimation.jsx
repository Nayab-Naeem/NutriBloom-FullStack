import { motion } from 'framer-motion';

function GrowthAnimation({ progress = 0, mode = 'forest' }) {
  const p = Math.min(Math.max(progress, 0), 1);

  // ==================== FOREST ====================
  if (mode === 'forest') {
    return (
      <div className="relative w-72 h-80 flex items-end justify-center overflow-hidden">
        {/* Soft ground glow */}
        <div className="absolute bottom-0 w-56 h-10 bg-green-500/20 blur-2xl rounded-full" />

        {/* Trunk */}
        <motion.div
          className="absolute bottom-6 w-5 rounded-t-md origin-bottom"
          style={{ background: 'linear-gradient(to top, #5c3a1e, #8b5a2b)' }}
          animate={{ height: 28 + p * 120 }}
          transition={{ type: 'spring', stiffness: 55, damping: 14 }}
        />

        {/* Foliage layers */}
        <motion.div
          className="absolute origin-bottom"
          style={{ bottom: 40 + p * 90 }}
          animate={{ scale: 0.35 + p * 0.9 }}
          transition={{ type: 'spring', stiffness: 45, damping: 12 }}
        >
          <div className="relative">
            <div className="w-44 h-44 rounded-full bg-green-800/90" />
            <div className="absolute top-3 left-4 w-32 h-32 rounded-full bg-green-600" />
            <div className="absolute top-6 right-3 w-28 h-28 rounded-full bg-green-500" />
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-green-400/90" />
          </div>
        </motion.div>

        {/* Floating particles */}
        {p > 0.25 && (
          <>
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-green-300"
              animate={{ y: [0, -30, 0], opacity: [0.8, 0.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{ left: '30%', bottom: '45%' }}
            />
            <motion.div
              className="absolute w-1.5 h-1.5 rounded-full bg-lime-300"
              animate={{ y: [0, -40, 0], opacity: [0.7, 0.1, 0.7] }}
              transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }}
              style={{ right: '28%', bottom: '50%' }}
            />
          </>
        )}
      </div>
    );
  }

  // ==================== OCEAN ====================
  if (mode === 'ocean') {
    return (
      <div className="relative w-72 h-80 flex items-center justify-center">
        {/* Outer pulse */}
        <motion.div
          className="absolute rounded-full border border-cyan-400/40"
          animate={{
            width: 90 + p * 170,
            height: 90 + p * 170,
            opacity: 0.3 + p * 0.4,
          }}
          transition={{ type: 'spring', stiffness: 40 }}
        />

        {/* Main body */}
        <motion.div
          className="absolute rounded-full"
          style={{
            background: 'linear-gradient(135deg, #22d3ee, #0ea5e9, #0369a1)',
          }}
          animate={{
            width: 55 + p * 130,
            height: 55 + p * 130,
            boxShadow: `0 0 ${20 + p * 40}px rgba(34, 211, 238, ${0.3 + p * 0.4})`,
          }}
          transition={{ type: 'spring', stiffness: 50 }}
        />

        {/* Core */}
        <motion.div
          className="absolute rounded-full bg-white/90"
          animate={{
            width: 14 + p * 26,
            height: 14 + p * 26,
          }}
        />

        {/* Soft rings */}
        <motion.div
          className="absolute rounded-full border border-cyan-300/30"
          animate={{
            width: 70 + p * 150,
            height: 70 + p * 150,
            opacity: 0.4,
          }}
        />
      </div>
    );
  }

  // ==================== COSMIC ====================
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