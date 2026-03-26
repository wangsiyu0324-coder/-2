import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WelcomePage } from './components/WelcomePage';
import { Starfield } from './components/Starfield';
import Globe from 'react-globe.gl';
import { SONGS_DATA } from './data';
import { Radio, ChevronUp, ChevronDown, Info, Volume2, VolumeX, Play, Pause, ArrowRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as THREE from 'three';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const celestialData = [
  { type: 'sun', lat: 10, lng: 45, alt: 15, size: 2.5 },
  { type: 'moon', lat: 20, lng: -90, alt: 3, size: 0.3 },
  { type: 'saturn', lat: -20, lng: 180, alt: 10, size: 0.8 },
  ...Array.from({ length: 80 }).map(() => ({
    type: 'asteroid',
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    alt: 1.5 + Math.random() * 10,
    size: 0.02 + Math.random() * 0.06,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
  }))
];

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStatic, setIsStatic] = useState(false);
  const [speed, setSpeed] = useState(1);
  const currentSong = SONGS_DATA[currentIndex];
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const staticAudioRef = useRef<HTMLAudioElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef(0);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle song change and static effect
  useEffect(() => {
    if (isPlaying && hasEntered) {
      setIsStatic(true);
      if (staticAudioRef.current) {
        staticAudioRef.current.play().catch(() => {});
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const timer = setTimeout(() => {
        setIsStatic(false);
        if (staticAudioRef.current) {
          staticAudioRef.current.pause();
          staticAudioRef.current.currentTime = 0;
        }
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, hasEntered]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && !isStatic && hasEntered) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isStatic, hasEntered]);

  // Handle mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
    if (staticAudioRef.current) staticAudioRef.current.muted = isMuted;
  }, [isMuted]);

  // Handle Globe controls and zoom
  useEffect(() => {
    if (globeRef.current && hasEntered) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.0;
      controls.enableZoom = false; // Disable native zoom to use discrete scrolling
      controls.enablePan = false;
      
      // Limit zoom distance (globe radius is 100)
      controls.minDistance = 350; // altitude ~2.5
      controls.maxDistance = 1300; // altitude ~12
      
      // Calculate zoom based on current index
      const maxAlt = 12;
      const minAlt = 2.5;
      const progress = currentIndex / Math.max(1, SONGS_DATA.length - 1);
      const targetAltitude = minAlt + progress * (maxAlt - minAlt);
      
      globeRef.current.pointOfView({ altitude: targetAltitude }, 1000);
    }
  }, [currentIndex, hasEntered]);

  const handleYearChange = (index: number) => {
    if (index === currentIndex) return;
    setSpeed(20);
    setCurrentIndex(index);
    setTimeout(() => {
      setSpeed(1);
    }, 1000);
  };

  const nextSong = () => {
    if (currentIndex < SONGS_DATA.length - 1) {
      handleYearChange(currentIndex + 1);
    }
  };

  const prevSong = () => {
    if (currentIndex > 0) {
      handleYearChange(currentIndex - 1);
    }
  };

  // Handle discrete scrolling
  useEffect(() => {
    if (!hasEntered) return;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      // 1000ms cooldown to match animation duration
      if (now - lastScrollTime.current < 1000) return;

      let changed = false;

      if (e.deltaY > 0) {
        // Scroll down -> next song (older)
        if (currentIndex < SONGS_DATA.length - 1) {
          handleYearChange(currentIndex + 1);
          lastScrollTime.current = now;
          changed = true;
        }
      } else if (e.deltaY < 0) {
        // Scroll up -> previous song (newer)
        if (currentIndex > 0) {
          handleYearChange(currentIndex - 1);
          lastScrollTime.current = now;
          changed = true;
        }
      }

      if (changed) {
        // Trigger static noise
        setIsStatic(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => setIsStatic(false), 300);
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentIndex, hasEntered]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleEnter = () => {
    setHasEntered(true);
    setIsPlaying(true);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden text-white font-sans selection:bg-white/20 bg-black">
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-[100]"
          >
            <WelcomePage onEnter={handleEnter} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full"
          >
            {/* Deep space background with galaxy texture */}
            <div 
              className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            
            {/* Flying stars effect */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Starfield speed={speed} />
            </div>

            <div className="absolute inset-0 z-0 cursor-move">
              <Globe
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                showAtmosphere={true}
                atmosphereColor="#3a228a"
                atmosphereAltitude={0.25}
                customLayerData={celestialData}
                customThreeObject={(d: any) => {
                  if (d.type === 'sun') {
                    const group = new THREE.Group();
                    const sun = new THREE.Mesh(
                      new THREE.SphereGeometry(d.size, 32, 32),
                      new THREE.MeshBasicMaterial({ color: 0xffffee })
                    );
                    const glow = new THREE.Mesh(
                      new THREE.SphereGeometry(d.size * 1.5, 32, 32),
                      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending })
                    );
                    const light = new THREE.PointLight(0xffffee, 3, 300);
                    group.add(sun);
                    group.add(glow);
                    group.add(light);
                    return group;
                  } else if (d.type === 'moon') {
                    return new THREE.Mesh(
                      new THREE.SphereGeometry(d.size, 32, 32),
                      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 })
                    );
                  } else if (d.type === 'saturn') {
                    const group = new THREE.Group();
                    const planet = new THREE.Mesh(
                      new THREE.SphereGeometry(d.size, 32, 32),
                      new THREE.MeshStandardMaterial({ color: 0xe3d599 })
                    );
                    const ring = new THREE.Mesh(
                      new THREE.RingGeometry(d.size * 1.2, d.size * 2.2, 32),
                      new THREE.MeshStandardMaterial({ color: 0xc1b68a, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
                    );
                    ring.rotation.x = Math.PI / 2 - 0.2;
                    group.add(planet);
                    group.add(ring);
                    return group;
                  } else {
                    const mesh = new THREE.Mesh(
                      new THREE.DodecahedronGeometry(d.size),
                      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 })
                    );
                    mesh.rotation.set(d.rotation[0], d.rotation[1], d.rotation[2]);
                    return mesh;
                  }
                }}
                customThreeObjectUpdate={(obj: any, d: any) => {
                  if (globeRef.current) {
                    Object.assign(obj.position, globeRef.current.getCoords(d.lat, d.lng, d.alt));
                  }
                }}
              />
            </div>

            
            <audio ref={audioRef} src={currentSong.audioUrl} loop />
            <audio ref={staticAudioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-radio-static-noise-1669.mp3" loop />

            <header className="absolute top-0 left-0 w-full py-6 px-8 flex justify-between items-start z-50 pointer-events-none">
              <div className="flex items-start gap-4 pointer-events-auto">
                <button 
                  onClick={() => setHasEntered(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors group flex items-center gap-2"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                  <span className="text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Exit</span>
                </button>
                <div className="pl-4 border-l border-white/10">
                  <h1 className="text-base font-bold tracking-tighter flex items-center gap-1.5">
                    <Radio className="w-4 h-4" />
                    STELLAR RADIO
                  </h1>
                  <p className="text-[9px] opacity-40 uppercase tracking-[0.2em] mt-0.5">Broadcasts from Earth</p>
                </div>
              </div>
              
              <div className="flex gap-4 pointer-events-auto">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </header>

            <main ref={mainRef} className="h-full w-full flex items-center justify-center relative overflow-hidden pointer-events-none">
              <nav className="absolute left-0 top-0 h-full w-32 md:w-40 flex flex-col items-center justify-center z-40 pointer-events-none">
                <div className="flex flex-col gap-2 items-center overflow-y-auto py-20 no-scrollbar max-h-full pointer-events-auto relative">
                  {SONGS_DATA.map((song, idx) => {
                    const distance = Math.abs(currentIndex - idx);
                    const opacity = Math.max(0.2, 1 - distance * 0.2);
                    const isActive = currentIndex === idx;
                    return (
                      <button
                        key={song.year}
                        onClick={() => handleYearChange(idx)}
                        className={cn(
                          "group relative flex items-center justify-center h-10 w-24 transition-all duration-300",
                          "hover:scale-110 active:scale-95"
                        )}
                        style={{ opacity }}
                      >
                        {/* Active indicator line */}
                        <div 
                          className={cn(
                            "absolute left-0 w-1 bg-white transition-all duration-300 rounded-r-full",
                            isActive ? "h-full opacity-100" : "h-0 opacity-0 group-hover:h-1/2 group-hover:opacity-50 group-hover:bg-white/50"
                          )}
                        />
                        
                        {/* Background glow for active state */}
                        <div 
                          className={cn(
                            "absolute inset-0 bg-white/10 rounded-lg blur-md transition-opacity duration-300",
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                          )}
                        />

                        <span className={cn(
                          "text-xs font-mono tracking-[0.2em] transition-all duration-300 relative z-10",
                          isActive 
                            ? "text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                            : "text-white/40 group-hover:text-white/80"
                        )}>
                          {song.year}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="relative w-full h-full flex items-center justify-center z-10 pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.div key="cosmic-view" className="relative flex items-center justify-center">
                    <div className="relative w-64 h-64 md:w-96 md:h-96" />
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-48 md:translate-y-64 flex flex-col items-center"
                    >
                      <div className="text-[10px] uppercase tracking-[0.5em] text-white/40 mb-2">Current Distance</div>
                      <div className="text-4xl md:text-6xl font-bold tracking-tighter font-mono">
                        {currentSong.distance}
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute right-8 bottom-24 md:bottom-8 flex items-end gap-6 z-50 pointer-events-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSong.year}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl"
                  >
                    <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                      <img 
                        src={currentSong.cover} 
                        alt={currentSong.title}
                        className={cn(
                          "w-full h-full object-cover rounded-lg transition-all duration-1000",
                          isStatic && "filter blur-sm grayscale brightness-50"
                        )}
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
                      </button>
                    </div>
                    <div className="pr-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Now Broadcasting</div>
                      <h2 className="text-lg md:text-xl font-bold tracking-tight leading-tight">
                        {isStatic ? "TUNING..." : currentSong.title}
                      </h2>
                      <p className="text-sm opacity-60">
                        {isStatic ? "Searching for signal" : currentSong.artist}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={togglePlay}
                    className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={prevSong}
                      disabled={currentIndex === 0}
                      className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 disabled:opacity-20"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={nextSong}
                      disabled={currentIndex === SONGS_DATA.length - 1}
                      className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 disabled:opacity-20"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute right-0 top-0 h-full w-16 md:w-24 flex flex-col items-center justify-center z-40 pointer-events-none">
                <div className="writing-vertical-rl text-[10px] uppercase tracking-[0.5em] opacity-20 font-mono">
                  Traveling through the cosmic radio sphere
                </div>
                <div className="text-xs font-mono opacity-40 mt-8">
                  {currentSong.distance.split(' ')[0]} LY
                </div>
              </div>
            </main>

            <footer className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-50 pointer-events-none">
              <div className="pointer-events-auto">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    isPlaying ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span>{isPlaying ? "SIGNAL ACTIVE" : "SIGNAL STANDBY"} | STRENGTH: {isStatic ? "0" : Math.max(10, 100 - currentIndex * 8)}%</span>
                </div>
              </div>
              <div className="text-[10px] opacity-30 font-mono pointer-events-auto">
                COORDINATES: 0.0000° N, 0.0000° E (ORIGIN)
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .writing-vertical-rl { writing-mode: vertical-rl; }
      `}</style>
    </div>
  );
}

