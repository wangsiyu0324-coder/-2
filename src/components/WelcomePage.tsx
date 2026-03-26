import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, ArrowRight, Music, Volume2, VolumeX } from 'lucide-react';
import { SONGS_DATA } from '../data';

interface WelcomePageProps {
  onEnter: () => void;
}

const Stars = () => {
  const stars = Array.from({ length: 50 });
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: Math.random() * 0.5 + 0.2,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * i * 0.1
          }}
          className="absolute h-0.5 w-0.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]"
        />
      ))}
    </div>
  );
};

export const WelcomePage = ({ onEnter }: WelcomePageProps) => {
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [showPlayHint, setShowPlayHint] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted to allow autoplay
  
  // Encode the # in the URL to ensure it's treated as part of the path, not a fragment
  const AUDIO_URL = "https://audio.fukit.cn/autoupload/fr/HRuLZ9p5VAI5yUBd9SAYDx_rO3iXCywS8TWF6EDn2ziyl5f0KlZfm6UsKj-HyTuv/20260326/3y0t/Photograph-Ed_Sheeran%231G3i9.mp3".replace('#', '%23');

  const LYRICS_WITH_TIME = [
    { time: 0, text: "..." },
    { time: 16.5, text: "Loving can hurt, loving can hurt sometimes" },
    { time: 24.5, text: "But it's the only thing that I know" },
    { time: 32.5, text: "When it gets hard, you know it can get hard sometimes" },
    { time: 40.5, text: "It is the only thing that makes us feel alive" },
    { time: 48.5, text: "We keep this love in a photograph" },
    { time: 56.5, text: "We made these memories for ourselves" },
    { time: 64.5, text: "Where our eyes are never closing" },
    { time: 68.5, text: "Hearts are never broken" },
    { time: 72.5, text: "And time's forever frozen, still" }
  ];

  // Sync lyrics with audio time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const index = LYRICS_WITH_TIME.findIndex((l, i) => {
        const next = LYRICS_WITH_TIME[i + 1];
        return currentTime >= l.time && (!next || currentTime < next.time);
      });
      
      if (index !== -1 && index !== currentLyricIndex) {
        setCurrentLyricIndex(index);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [currentLyricIndex]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error("Playback failed:", err));
      setShowPlayHint(false);
    }
  };

  // Initial load and autoplay attempt with global unlock
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.5;

    const attemptPlay = () => {
      if (!audio) return;
      
      // Try to play
      audio.play()
        .then(() => {
          setIsAudioReady(true);
          // Only set time if metadata is loaded, otherwise it might fail
          if (audio.readyState >= 1) {
            audio.currentTime = 14.5;
          } else {
            audio.addEventListener('loadedmetadata', () => {
              audio.currentTime = 14.5;
            }, { once: true });
          }

          // Fade in volume
          audio.volume = 0;
          let vol = 0;
          const fadeInterval = setInterval(() => {
            vol += 0.05;
            if (vol >= 0.5) {
              audio.volume = 0.5;
              clearInterval(fadeInterval);
            } else {
              audio.volume = vol;
            }
          }, 100);

          if (audio.muted) {
            setShowPlayHint(true);
          } else {
            setShowPlayHint(false);
          }
        })
        .catch((err) => {
          console.warn("Autoplay blocked or failed:", err);
          setShowPlayHint(true);
        });
    };

    // Try playing when enough data is loaded
    audio.addEventListener('canplaythrough', attemptPlay, { once: true });

    // Global interaction listener to "unlock" audio context and UNMUTE
    const unlock = () => {
      setIsMuted(false);
      if (audio) {
        audio.muted = false;
        if (audio.currentTime < 14.5) {
          if (audio.readyState >= 1) {
            audio.currentTime = 14.5;
          } else {
            audio.addEventListener('loadedmetadata', () => {
              audio.currentTime = 14.5;
            }, { once: true });
          }
        }
        audio.play().catch(() => {});
      }
      setShowPlayHint(false);
      
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      audio.removeEventListener('canplaythrough', attemptPlay);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-sans text-white">
      {/* Stars Background */}
      <Stars />

      {/* Background Video with Fallback */}
      <div className="absolute inset-0 z-0 h-full w-full bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-60"
          onError={(e) => {
            console.warn("Video failed to load, falling back to static background");
            const target = e.target as HTMLVideoElement;
            target.style.display = 'none';
          }}
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4" type="video/mp4" />
        </video>
        {/* Static Cosmic Background Fallback */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0a0a1a_0%,_#000000_100%)] opacity-40" />
      </div>

      {/* Background Audio - Ed Sheeran Photograph */}
      <audio 
        ref={audioRef} 
        src={AUDIO_URL} 
        preload="auto"
        autoPlay
        muted={isMuted}
        loop
        onPlay={() => setShowPlayHint(false)}
        onError={(e) => console.error("Audio Load Error:", e)}
      />

      {/* Mute Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={toggleMute}
        className="absolute top-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-colors hover:bg-white/20"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </motion.button>

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
        <div className="flex max-w-4xl flex-col items-center text-center">
          
          {/* Hero Center */}
          <div className="flex flex-col items-center">
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl font-medium tracking-[-0.05em] text-white md:text-7xl lg:text-8xl"
            >
              Capturing the <br />
              <span className="font-serif italic text-white/80">memories</span>
            </motion.h1>

            {/* Lyric Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <div className="h-12 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={currentLyricIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-2xl font-light italic text-white/80 tracking-tight"
                  >
                    "{LYRICS_WITH_TIME[currentLyricIndex]?.text}"
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 mt-2">
                Now Playing: Ed Sheeran — Photograph
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              {["Artistic Gallery", "AI Generation", "3D Structures"].map((pill) => (
                <span key={pill} className="liquid-glass rounded-full px-6 py-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
                  {pill}
                </span>
              ))}
            </motion.div>

            <motion.button
              onClick={() => {
                handlePlay();
                onEnter();
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="liquid-glass-strong mt-16 flex flex-col items-center gap-2 rounded-full py-5 px-10 text-xl font-semibold tracking-tight text-white group relative"
            >
              {/* Progressive glow effect */}
              <motion.div 
                className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <div className="relative flex items-center gap-6">
                <span>Enter Stellar Radio</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 group-hover:bg-white/25 transition-colors">
                  <ArrowRight className="h-6 w-6" />
                </div>
              </div>
              {showPlayHint && (
                <span className="relative text-[10px] font-mono uppercase tracking-widest text-white/60 animate-bounce bg-white/10 px-4 py-1 rounded-full backdrop-blur-sm">
                  Tap anywhere to enable sound 🎵
                </span>
              )}
            </motion.button>
          </div>

          {/* Bottom Quote */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-20 max-w-lg"
          >
            <div className="mb-6 flex items-center gap-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/30">Visionary Design</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <p className="text-xl font-light tracking-tight text-white/60">
              "We imagined a realm <span className="font-serif italic text-white/80">with no ending.</span>"
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] font-bold tracking-[0.3em] text-white/20">
              <div className="h-px w-10 bg-white/10" />
              MARCUS AURELIO
              <div className="h-px w-10 bg-white/10" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
