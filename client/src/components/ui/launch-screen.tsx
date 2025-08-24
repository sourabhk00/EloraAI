import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, Rocket } from "lucide-react";

interface LaunchScreenProps {
  onComplete: () => void;
}

export function LaunchScreen({ onComplete }: LaunchScreenProps) {
  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center relative">
            <Brain className="w-12 h-12 text-white" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>

        <motion.h1 
          className="text-4xl md:text-6xl font-bold text-white mb-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Elora.AI
        </motion.h1>

        <motion.p 
          className="text-lg md:text-xl text-blue-200 mb-8 max-w-md mx-auto"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Advanced multimedia AI platform for creative professionals
        </motion.p>

        <motion.div 
          className="flex items-center justify-center gap-6 mb-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <div className="flex items-center gap-2 text-blue-200">
            <Sparkles className="w-5 h-5" />
            <span>Image & Video</span>
          </div>
          <div className="flex items-center gap-2 text-blue-200">
            <Zap className="w-5 h-5" />
            <span>Analytics</span>
          </div>
          <div className="flex items-center gap-2 text-blue-200">
            <Rocket className="w-5 h-5" />
            <span>Graph Gen</span>
          </div>
        </motion.div>

        <motion.button
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          onClick={onComplete}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Launch Application
        </motion.button>
      </div>
    </motion.div>
  );
}