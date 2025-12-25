import { useState, useEffect, useRef } from 'react';
import { 
  getBlockchainStats, 
  getRecentBlocks, 
  getRecommendedFees, 
  getMempoolInfo,
  searchBlockchain 
} from '../services/mempool';

const BlockExplorer = () => {
  const [stats, setStats] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [fees, setFees] = useState(null);
  const [mempoolInfo, setMempoolInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('blockSoundEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [previousBlockHeight, setPreviousBlockHeight] = useState(null);
  const [selectedSound, setSelectedSound] = useState(() => {
    return localStorage.getItem('blockSoundType') || 'bell';
  });
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const timelineRef = useRef(null);
  
  // Use refs to access current values in interval callback
  const soundEnabledRef = useRef(soundEnabled);
  const selectedSoundRef = useRef(selectedSound);
  const audioContextRef = useRef(audioContext);
  const previousBlockHeightRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    selectedSoundRef.current = selectedSound;
  }, [selectedSound]);

  useEffect(() => {
    audioContextRef.current = audioContext;
  }, [audioContext]);

  // Auto-scroll timeline to show middle 4 blocks on mobile (2 mined + 2 upcoming)
  useEffect(() => {
    if (timelineRef.current && blocks.length > 0) {
      // Scroll to show blocks 4-7 (last 2 mined + first 2 upcoming)
      // Each block is 25% width, so scroll to position 3 (show blocks 3,4,5,6)
      const container = timelineRef.current;
      const blockWidth = container.scrollWidth / 10; // 10 total blocks
      const scrollPosition = blockWidth * 3; // Start at block 3 to center view
      container.scrollLeft = scrollPosition;
    }
  }, [blocks]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close sound menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSoundMenu && !event.target.closest('.sound-menu-container')) {
        setShowSoundMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSoundMenu]);

  const fetchData = async () => {
    try {
      const [statsData, blocksData, feesData, mempoolData] = await Promise.all([
        getBlockchainStats(),
        getRecentBlocks(8),
        getRecommendedFees(),
        getMempoolInfo()
      ]);
      
      // Check for new block and play sound (use ref to get current soundEnabled value)
      if (blocksData.length > 0) {
        const latestBlockHeight = blocksData[0].height;
        if (soundEnabledRef.current && previousBlockHeightRef.current !== null && latestBlockHeight > previousBlockHeightRef.current) {
          // New block mined! Play sound
          playBlockSound();
          console.log('🔔 New block detected! Playing sound for block:', latestBlockHeight);
        }
        previousBlockHeightRef.current = latestBlockHeight;
        setPreviousBlockHeight(latestBlockHeight);
      }
      
      setStats(statsData);
      setBlocks(blocksData);
      setFees(feesData);
      setMempoolInfo(mempoolData);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const result = await searchBlockchain(searchQuery.trim());
      setSearchResult(result);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({ type: 'error', data: null });
    } finally {
      setSearching(false);
    }
  };

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('blockSoundEnabled', JSON.stringify(newValue));
    
    // Initialize and resume AudioContext when enabling
    if (newValue) {
      try {
        // Create AudioContext if it doesn't exist
        if (!audioContext) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          setAudioContext(ctx);
          
          // Resume AudioContext (required for Chrome's autoplay policy)
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
        } else if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        setAudioBlocked(false);
        // Play a test sound when enabling
        playBlockSound();
      } catch (error) {
        console.error('Audio initialization failed:', error);
        setAudioBlocked(true);
      }
    }
  };

  const playBlockSound = async () => {
    try {
      // Use existing AudioContext or create new one (use ref for interval callback)
      let ctx = audioContextRef.current || audioContext;
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(ctx);
        audioContextRef.current = ctx;
      }
      
      // Resume AudioContext if suspended (Chrome autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Check if audio is allowed
      if (ctx.state !== 'running') {
        setAudioBlocked(true);
        return;
      }
      
      setAudioBlocked(false);
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
    
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
    
    // Different sound types (use ref to get current value in interval callback)
    const currentSound = selectedSoundRef.current || selectedSound;
    switch (currentSound) {
      case 'bell':
        // Pleasant bell sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
        
      case 'chime':
        // Higher pitched chime
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;
        
      case 'ping':
        // Short ping sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1500, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        break;
        
      case 'coin':
        // Coin drop sound (two tones)
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(988, ctx.currentTime);
        oscillator.frequency.setValueAtTime(1319, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
        
      case 'beep':
        // Simple beep
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;
        
      case 'success':
        // Success sound (ascending)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;
        
      default:
        // Fallback to bell
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    }
    } catch (error) {
      console.error('Error playing sound:', error);
      setAudioBlocked(true);
    }
  };

    const handleSoundSelect = async (soundType) => {
    setSelectedSound(soundType);
    localStorage.setItem('blockSoundType', soundType);
    setShowSoundMenu(false);
    // Play preview of selected sound (this also activates AudioContext)
    await playBlockSound();
  };

  const soundOptions = [
    { id: 'bell', name: '🔔 Bell', description: 'Pleasant bell tone' },
    { id: 'chime', name: '🎵 Chime', description: 'High pitched chime' },
    { id: 'ping', name: '📡 Ping', description: 'Quick ping sound' },
    { id: 'coin', name: '🪙 Coin', description: 'Coin drop sound' },
    { id: 'beep', name: '📢 Beep', description: 'Simple beep' },
    { id: 'success', name: '✨ Success', description: 'Ascending tone' },
  ];

  const formatHashrate = (hashrate) => {
    if (!hashrate?.currentHashrate) return 'N/A';
    const eh = hashrate.currentHashrate / 1e18;
    return `${eh.toFixed(2)} EH/s`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBytes = (bytes) => {
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const getBlockColor = (index) => {
    // Color blocks based on their recency (newer = brighter) - extended for 5 blocks
    const colors = [
      'from-orange-500 to-orange-600',
      'from-orange-400 to-orange-500',
      'from-orange-500/90 to-orange-600/90',
      'from-orange-500/80 to-orange-600/80',
      'from-orange-500/70 to-orange-600/70',
      'from-orange-500/60 to-orange-600/60',
      'from-orange-500/50 to-orange-600/50',
      'from-orange-500/40 to-orange-600/40',
    ];
    return colors[index] || colors[colors.length - 1];
  };

  const getFeeColor = (fee) => {
    if (fee > 50) return 'bg-red-500';
    if (fee > 20) return 'bg-orange-500';
    if (fee > 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getFeeWidth = (fee, maxFee) => {
    return Math.min((fee / maxFee) * 100, 100);
  };

  const getExpectedBlocks = () => {
    // Generate 5 expected blocks with estimated times (increased from 3)
    const currentHeight = stats?.blockHeight || 0;
    const avgBlockTime = 10; // 10 minutes average
    return [
      { height: currentHeight + 1, estimatedMinutes: avgBlockTime, status: 'next' },
      { height: currentHeight + 2, estimatedMinutes: avgBlockTime * 2, status: 'upcoming' },
      { height: currentHeight + 3, estimatedMinutes: avgBlockTime * 3, status: 'upcoming' },
      { height: currentHeight + 4, estimatedMinutes: avgBlockTime * 4, status: 'upcoming' },
      { height: currentHeight + 5, estimatedMinutes: avgBlockTime * 5, status: 'upcoming' },
    ];
  };

  const formatEstimatedTime = (minutes) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `~${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `~${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400 dark:text-slate-400 light:text-slate-600">
          Loading blockchain data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-slate-900 to-dark-bg dark:from-dark-bg dark:via-slate-900 dark:to-dark-bg light:from-slate-50 light:via-white light:to-slate-50 high-contrast:from-white high-contrast:to-white">
      <div className="container mx-auto px-4 py-8 max-w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Bitcoin Block Explorer
              </h1>
              <p className="text-slate-400 dark:text-slate-400 light:text-slate-600">
                Real-time Bitcoin blockchain data powered by mempool.space
              </p>
            </div>
            
            {/* Sound Toggle Button */}
            <div className="flex items-center gap-2">
              {/* Sound Type Dropdown */}
              {soundEnabled && (
                <div className="relative sound-menu-container">
                  <button
                    onClick={() => setShowSoundMenu(!showSoundMenu)}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-all"
                    title="Choose sound type"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="hidden md:inline text-sm">
                      {soundOptions.find(s => s.id === selectedSound)?.name.split(' ')[1] || 'Sound'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showSoundMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-black border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-white shadow-2xl overflow-hidden z-50 animate-fadeIn">
                      <div className="py-1">
                        {soundOptions.map((sound) => (
                          <button
                            key={sound.id}
                            onClick={() => handleSoundSelect(sound.id)}
                            className={`w-full text-left px-4 py-3 transition-colors ${
                              selectedSound === sound.id
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'text-white dark:text-white light:text-slate-800 high-contrast:text-black hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold">{sound.name}</div>
                                <div className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600">
                                  {sound.description}
                                </div>
                              </div>
                              {selectedSound === sound.id && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  soundEnabled
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600'
                }`}
                title={soundEnabled ? 'Sound notifications enabled' : 'Sound notifications disabled'}
              >
                {soundEnabled ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="hidden sm:inline">Sound ON</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="hidden sm:inline">Sound OFF</span>
                  </>
                )}
              </button>
              
              {/* Audio Blocked Warning */}
              {soundEnabled && audioBlocked && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-sm text-yellow-200 backdrop-blur-sm z-10">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-semibold mb-1">⚠️ Audio Blocked by Browser</p>
                      <p className="text-xs text-yellow-300">
                        Chrome requires user interaction first. Click the sound dropdown menu below to test and activate audio.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Block Timeline - Moved to top */}
        <div className="mb-8 bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-black black-white:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-white black-white:border-black">
          <h2 className="text-xl font-bold mb-6 text-white dark:text-white light:text-slate-800 high-contrast:text-white black-white:text-black flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500 dark:text-orange-500 light:text-orange-600 high-contrast:text-high-contrast-accent black-white:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Block Timeline
          </h2>
          
          <div className="relative">
            {/* Timeline line - hidden on mobile scroll view */}
            <div className="hidden sm:block absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-orange-500/30 via-slate-600 to-slate-700 -translate-y-1/2"></div>
            
            {/* Blocks container - horizontal scroll on mobile, grid on larger screens */}
            <div 
              ref={timelineRef}
              className="relative flex sm:grid overflow-x-auto sm:overflow-visible gap-2 sm:gap-4 pb-4 sm:pb-0 sm:grid-cols-5 lg:grid-cols-10 scrollbar-hide px-1 -mx-1 snap-x snap-mandatory" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Mobile: All mined blocks (5) - scrollable */}
              {blocks.slice(0, 5).reverse().map((block, index) => (
                <div key={`mobile-${block.id}`} className="relative flex-shrink-0 w-[calc(25%-6px)] sm:hidden snap-start">
                  <div 
                    onClick={() => setSelectedBlock(block)}
                    className="relative bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/50 dark:border-green-500/50 light:border-green-600 light:bg-green-50 high-contrast:border-high-contrast-success high-contrast:bg-black black-white:border-black black-white:bg-white rounded-xl p-2 transition-transform active:scale-95 cursor-pointer h-full"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 dark:bg-green-400 light:bg-green-600 high-contrast:bg-high-contrast-success black-white:bg-black rounded-full animate-pulse"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 dark:text-green-400 light:text-green-600 high-contrast:text-high-contrast-success black-white:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-[10px] sm:text-xs text-green-400/70 dark:text-green-400/70 light:text-green-700 high-contrast:text-high-contrast-success black-white:text-black mb-0.5 uppercase font-semibold">Mined</div>
                    <div className="text-xs sm:text-lg font-bold text-white dark:text-white light:text-slate-900 high-contrast:text-white black-white:text-black font-mono mb-0.5">
                      {block.height?.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 light:text-slate-700 high-contrast:text-white black-white:text-black">
                      {block.tx_count} txs
                    </div>
                  </div>
                </div>
              ))}
              {/* Desktop: show all 5 mined blocks */}
              {blocks.slice(0, 5).reverse().map((block, index) => (
                <div key={`desktop-${block.id}`} className="relative hidden sm:block">
                  <div 
                    onClick={() => setSelectedBlock(block)}
                    className="relative z-10 bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/50 dark:border-green-500/50 light:border-green-600 light:bg-green-50 high-contrast:border-high-contrast-success high-contrast:bg-black rounded-xl p-4 hover:scale-105 transition-all cursor-pointer h-full"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-3 h-3 bg-green-400 dark:bg-green-400 light:bg-green-600 high-contrast:bg-high-contrast-success rounded-full animate-pulse"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400 dark:text-green-400 light:text-green-600 high-contrast:text-high-contrast-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-xs text-green-400/70 dark:text-green-400/70 light:text-green-700 high-contrast:text-high-contrast-success mb-1 uppercase font-semibold">Mined</div>
                    <div className="text-lg font-bold text-white dark:text-white light:text-slate-900 high-contrast:text-white font-mono mb-1">
                      {block.height?.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-700 high-contrast:text-white">
                      {block.tx_count} txs
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-white mt-1">
                      {formatDate(block.timestamp).split(',')[1]}
                    </div>
                  </div>
                  {/* Connection line to timeline */}
                  <div className="absolute left-1/2 bottom-0 w-0.5 h-4 bg-green-500/50 -translate-x-1/2 translate-y-full"></div>
                </div>
              ))}
              
              {/* Mobile: All expected blocks (5) - scrollable */}
              {getExpectedBlocks().map((expectedBlock, index) => (
                <div key={`mobile-expected-${expectedBlock.height}`} className="relative flex-shrink-0 w-[calc(25%-6px)] sm:hidden snap-start">
                  <div className={`relative rounded-xl p-2 transition-transform active:scale-95 cursor-pointer h-full ${
                    expectedBlock.status === 'next'
                      ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/50 dark:border-orange-500/50 light:border-orange-600 light:bg-orange-50 high-contrast:border-high-contrast-accent high-contrast:bg-black animate-pulse'
                      : 'bg-gradient-to-br from-slate-700/20 to-slate-800/10 border-2 border-slate-600/30 dark:border-slate-600/30 light:border-slate-400 light:bg-slate-100 high-contrast:border-white high-contrast:bg-black'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        expectedBlock.status === 'next' 
                          ? 'bg-orange-400 dark:bg-orange-400 light:bg-orange-600 high-contrast:bg-high-contrast-accent animate-pulse' 
                          : 'bg-slate-500 dark:bg-slate-500 light:bg-slate-600 high-contrast:bg-white'
                      }`}></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${
                        expectedBlock.status === 'next' 
                          ? 'text-orange-400 dark:text-orange-400 light:text-orange-600 high-contrast:text-high-contrast-accent' 
                          : 'text-slate-500 dark:text-slate-500 light:text-slate-700 high-contrast:text-white'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className={`text-[10px] mb-0.5 uppercase font-semibold ${
                      expectedBlock.status === 'next' 
                        ? 'text-orange-400/70 dark:text-orange-400/70 light:text-orange-700 high-contrast:text-high-contrast-accent' 
                        : 'text-slate-500 dark:text-slate-500 light:text-slate-700 high-contrast:text-white'
                    }`}>
                      {expectedBlock.status === 'next' ? 'Next' : 'Upcoming'}
                    </div>
                    <div className={`text-xs font-bold font-mono mb-0.5 ${
                      expectedBlock.status === 'next' 
                        ? 'text-orange-400 dark:text-orange-400 light:text-orange-700 high-contrast:text-white' 
                        : 'text-slate-400 dark:text-slate-400 light:text-slate-700 high-contrast:text-white'
                    }`}>
                      {expectedBlock.height?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-white">
                      {formatEstimatedTime(expectedBlock.estimatedMinutes)}
                    </div>
                  </div>
                </div>
              ))}
              {/* Desktop: show all expected blocks */}
              {getExpectedBlocks().map((expectedBlock, index) => (
                <div key={`expected-${expectedBlock.height}`} className="relative hidden sm:block">
                  <div className={`relative z-10 rounded-xl p-4 hover:scale-105 transition-all cursor-pointer h-full ${
                    expectedBlock.status === 'next'
                      ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/50 dark:border-orange-500/50 light:border-orange-600 light:bg-orange-50 high-contrast:border-high-contrast-accent high-contrast:bg-black animate-pulse'
                      : 'bg-gradient-to-br from-slate-700/20 to-slate-800/10 border-2 border-slate-600/30 dark:border-slate-600/30 light:border-slate-400 light:bg-slate-100 high-contrast:border-white high-contrast:bg-black'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        expectedBlock.status === 'next' 
                          ? 'bg-orange-400 dark:bg-orange-400 light:bg-orange-600 high-contrast:bg-high-contrast-accent animate-pulse' 
                          : 'bg-slate-500 dark:bg-slate-500 light:bg-slate-600 high-contrast:bg-white'
                      }`}></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                        expectedBlock.status === 'next' 
                          ? 'text-orange-400 dark:text-orange-400 light:text-orange-600 high-contrast:text-high-contrast-accent' 
                          : 'text-slate-500 dark:text-slate-500 light:text-slate-700 high-contrast:text-white'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className={`text-xs mb-1 uppercase font-semibold ${
                      expectedBlock.status === 'next' 
                        ? 'text-orange-400/70 dark:text-orange-400/70 light:text-orange-700 high-contrast:text-high-contrast-accent' 
                        : 'text-slate-500 dark:text-slate-500 light:text-slate-700 high-contrast:text-white'
                    }`}>
                      {expectedBlock.status === 'next' ? 'Next' : 'Upcoming'}
                    </div>
                    <div className={`text-lg font-bold font-mono mb-1 ${
                      expectedBlock.status === 'next' 
                        ? 'text-orange-400 dark:text-orange-400 light:text-orange-700 high-contrast:text-white' 
                        : 'text-slate-400 dark:text-slate-400 light:text-slate-700 high-contrast:text-white'
                    }`}>
                      {expectedBlock.height?.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-white">
                      {mempoolInfo?.count ? `${Math.floor(mempoolInfo.count / 3000)} txs` : '~2500 txs'}
                    </div>
                    <div className={`text-xs mt-1 ${
                      expectedBlock.status === 'next' 
                        ? 'text-orange-400/80 dark:text-orange-400/80 light:text-orange-700 high-contrast:text-high-contrast-accent' 
                        : 'text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-white'
                    }`}>
                      {formatEstimatedTime(expectedBlock.estimatedMinutes)}
                    </div>
                  </div>
                  {/* Connection line to timeline */}
                  <div className={`absolute left-1/2 bottom-0 w-0.5 h-4 -translate-x-1/2 translate-y-full ${
                    expectedBlock.status === 'next' ? 'bg-orange-500/50' : 'bg-slate-600/30'
                  }`}></div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-slate-700 dark:border-slate-700 light:border-slate-300 flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">Mined Blocks (Click for details)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">Next Block (~10 min)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">Upcoming Blocks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, transaction or block..."
              className="flex-1 px-4 py-3 bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-black black-white:bg-white rounded-lg border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-white black-white:border-black text-white dark:text-white light:text-slate-800 high-contrast:text-white black-white:text-black placeholder-slate-500 black-white:placeholder-black focus:outline-none focus:border-orange-500 high-contrast:focus:border-high-contrast-accent black-white:focus:border-black"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
          
          {searchResult && (
            <div className="mt-4 p-4 bg-dark-card dark:bg-dark-card light:bg-white rounded-lg border border-slate-700 dark:border-slate-700 light:border-slate-300">
              {searchResult.type === 'not_found' && (
                <p className="text-red-400">No results found for "{searchQuery}"</p>
              )}
              {searchResult.type === 'error' && (
                <p className="text-red-400">Error searching. Please try again.</p>
              )}
              {searchResult.type === 'transaction' && (
                <p className="text-green-400">Transaction found! Opening mempool.space...</p>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-6 border border-orange-500/30 hover:scale-105 transition-all">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Block Height
              </div>
              <div className="text-4xl font-bold text-orange-500 font-mono">
                {stats?.blockHeight?.toLocaleString()}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-6 border border-purple-500/30 hover:scale-105 transition-all">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Network Hashrate
              </div>
              <div className="text-4xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                {formatHashrate(stats?.hashrate)}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border border-blue-500/30 hover:scale-105 transition-all">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Mempool Size
              </div>
              <div className="text-4xl font-bold text-blue-400">
                {mempoolInfo?.count?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                {formatBytes(mempoolInfo?.vsize || 0)}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-6 border border-cyan-500/30 hover:scale-105 transition-all">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Next Difficulty
              </div>
              <div className="text-4xl font-bold text-cyan-400">
                {stats?.difficulty?.remainingBlocks || 'N/A'}
              </div>
              <div className="text-xs text-slate-500 mt-2">blocks remaining</div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Fees */}
        {fees && (
          <div className="mb-8 bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-black rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-white">
            <h2 className="text-xl font-bold mb-6 text-white dark:text-white light:text-slate-800 high-contrast:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recommended Fees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-green-400 font-semibold">Low Priority</div>
                  <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                </div>
                <div className="text-4xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black mb-2">
                  {fees.hourFee}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mb-4">sat/vB</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ~1 hour
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-yellow-400 font-semibold">Medium Priority</div>
                  <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
                </div>
                <div className="text-4xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black mb-2">
                  {fees.halfHourFee}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mb-4">sat/vB</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ~30 minutes
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-red-400 font-semibold">High Priority</div>
                  <span className="inline-block w-3 h-3 bg-red-400 rounded-full animate-pulse"></span>
                </div>
                <div className="text-4xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black mb-2">
                  {fees.fastestFee}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mb-4">sat/vB</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Next block
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl"></div>
              </div>
            </div>
            
            {/* Fee comparison bar */}
            <div className="mt-6 pt-6 border-t border-slate-700 dark:border-slate-700 light:border-slate-300">
              <div className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mb-3">Fee Rate Comparison</div>
              <div className="flex items-center gap-2 h-8">
                <div className="relative flex-1 h-full bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full transition-all"
                    style={{ width: `${getFeeWidth(fees.hourFee, fees.fastestFee)}%` }}
                  ></div>
                </div>
                <div className="relative flex-1 h-full bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                    style={{ width: `${getFeeWidth(fees.halfHourFee, fees.fastestFee)}%` }}
                  ></div>
                </div>
                <div className="relative flex-1 h-full bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Blocks */}
        <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-black rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-white overflow-hidden">
          <div className="p-6 border-b border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-white">
            <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Recent Blocks
            </h2>
          </div>
          
          {/* Visual Block Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {blocks.slice(0, 8).map((block, index) => (
                <div
                  key={block.id}
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getBlockColor(index)} p-4 hover:scale-105 transition-all cursor-pointer group`}
                  style={{
                    animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s both`
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-white/60 font-semibold uppercase tracking-wider">Block</div>
                      {index === 0 && (
                        <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-white mb-1 font-mono">
                      {block.height?.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/70 mb-3">
                      {formatDate(block.timestamp)}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                      <span>Transactions:</span>
                      <span className="font-semibold">{block.tx_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                      <span>Size:</span>
                      <span className="font-semibold">{formatBytes(block.size)}</span>
                    </div>
                    <div className="text-xs text-white/60 mt-2 truncate">
                      {block.extras?.pool?.name || 'Unknown Pool'}
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
                </div>
              ))}
            </div>
            
            {/* Detailed table view */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Height</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Transactions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Miner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 dark:divide-slate-700 light:divide-slate-300 high-contrast:divide-black">
                  {blocks.map((block, index) => (
                    <tr key={block.id} className="hover:bg-slate-800/30 dark:hover:bg-slate-800/30 light:hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-orange-500">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                          )}
                          {block.height}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 dark:text-slate-300 light:text-slate-700">
                        {formatDate(block.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white dark:text-white light:text-slate-800">
                        {block.tx_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
                        {formatBytes(block.size)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
                        {block.extras?.pool?.name || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Data provided by{' '}
            <a 
              href="https://mempool.space" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600"
            >
              mempool.space
            </a>
          </p>
        </div>
      </div>

      {/* Block Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedBlock(null)}>
          <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-2xl border-2 border-orange-500/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-b border-orange-500/30 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Block #{selectedBlock.height?.toLocaleString()}
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                  {formatDate(selectedBlock.timestamp)}
                </p>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Transactions
                  </div>
                  <div className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                    {selectedBlock.tx_count?.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    Size
                  </div>
                  <div className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                    {formatBytes(selectedBlock.size)}
                  </div>
                </div>

                <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    Weight
                  </div>
                  <div className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                    {selectedBlock.weight?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Total Fees
                  </div>
                  <div className="text-2xl font-bold text-orange-500">
                    {(selectedBlock.extras?.totalFees / 100000000)?.toFixed(4) || 'N/A'} BTC
                  </div>
                </div>
              </div>

              {/* Block Info */}
              <div className="space-y-3">
                <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-2">Block Hash</div>
                  <div className="text-sm font-mono text-orange-500 break-all">
                    {selectedBlock.id}
                  </div>
                </div>

                {selectedBlock.previousblockhash && (
                  <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-2">Previous Block Hash</div>
                    <div className="text-sm font-mono text-slate-400 dark:text-slate-400 light:text-slate-600 break-all">
                      {selectedBlock.previousblockhash}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-2">Mined By</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                      {selectedBlock.extras?.pool?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                        {selectedBlock.extras?.pool?.name || 'Unknown Pool'}
                      </div>
                      {selectedBlock.extras?.pool?.url && (
                        <a 
                          href={selectedBlock.extras.pool.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-orange-500 hover:text-orange-400"
                        >
                          Visit Pool Website →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Block Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-3">
                    <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-1">Difficulty</div>
                    <div className="text-sm font-semibold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                      {selectedBlock.difficulty?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-3">
                    <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-1">Nonce</div>
                    <div className="text-sm font-mono font-semibold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                      {selectedBlock.nonce?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-3">
                    <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-1">Version</div>
                    <div className="text-sm font-semibold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                      0x{selectedBlock.version?.toString(16) || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-3">
                    <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase mb-1">Median Time</div>
                    <div className="text-sm font-semibold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                      {selectedBlock.mediantime ? new Date(selectedBlock.mediantime * 1000).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* View on Mempool Button */}
              <a
                href={`https://mempool.space/block/${selectedBlock.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all text-center"
              >
                View Full Details on Mempool.space →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockExplorer;
