import { useState, useEffect, useRef } from 'react';
import { useStudy } from '../context/StudyContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Download,
  Activity,
  FileAudio
} from 'lucide-react';

export const AudioLessons = () => {
  const { audioLessons, addToast } = useStudy();

  const [activeTrack, setActiveTrack] = useState(audioLessons[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [trackProgress, setTrackProgress] = useState(30); // out of 100
  const [audioVolume, setAudioVolume] = useState(80); // out of 100

  const audioRef = useRef(null);

  useEffect(() => {
    // Sync React player speed to HTMLAudioElement
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeTrack]);

  const handlePlayPause = () => {
    if (!activeTrack) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      addToast('Audio lesson paused', 'info');
    } else {
      audioRef.current?.play().catch(() => { });
      setIsPlaying(true);
      addToast(`Playing: ${activeTrack.title}`, 'success');
    }
  };

  const handleTrackSelect = (track) => {
    setActiveTrack(track);
    setIsPlaying(false);
    setTrackProgress(0);
    // Timeout to trigger simulated metadata updates
    setTimeout(() => {
      setIsPlaying(true);
      audioRef.current?.play().catch(() => { });
    }, 150);
  };

  const handleDownload = (track) => {
    addToast(`Downloading offline MP3 copy: ${track.title}!`, 'success');
  };

  // Generate fake SVG lines representing waves bars
  const renderWaveform = () => {
    const barsCount = 36;
    const bars = [];
    for (let i = 0; i < barsCount; i++) {
        // pseudo-random but stable height based on index
      const height = ((i * 17) % 26) + 6; 
      const active = i < (barsCount * trackProgress) / 100;
      bars.push(
        <div
          key={i}
          style={{ height: `${height}px` }}
          className={`w-1 rounded-full transition-all ${active
              ? 'bg-indigo-500 shadow-neon-indigo'
              : 'bg-slate-200 dark:bg-slate-800'
            }`}
        />
      );
    }
    return <div className="flex items-center gap-1 w-full justify-center h-16">{bars}</div>;
  };

  return (
    <div className="space-y-8 font-sans">
      {/* HTML Audio element */}
      {activeTrack && (
        <audio
          ref={audioRef}
          src={activeTrack.url}
          onTimeUpdate={(e) => {
            const current = e.currentTarget.currentTime;
            const duration = e.currentTarget.duration || 1;
            setTrackProgress(Math.round((current / duration) * 100));
          }}
          onEnded={() => {
            setIsPlaying(false);
            setTrackProgress(100);
          }}
          className="hidden"
        />
      )}

      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          AI Audio Lessons
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Synthesize textbook notes into high-fidelity AI podcast tracks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Podcast Player (Left Panel) */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm">
          {activeTrack ? (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <FileAudio className="w-16 h-16" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase">AI Generated Podcast</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1.5">{activeTrack.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Instructor: {activeTrack.author}</p>
              </div>

              {/* Dynamic Waveform Display */}
              <div className="w-full bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850 p-4">
                {renderWaveform()}
              </div>

              {/* Slider for Progress bar */}
              <div className="w-full space-y-2">
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer relative">
                  <div
                    style={{ width: `${trackProgress}%` }}
                    className="absolute top-0 bottom-0 left-0 bg-indigo-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{Math.floor((trackProgress / 100) * 12)}:00</span>
                  <span>{activeTrack.duration}</span>
                </div>
              </div>

              {/* Player control buttons */}
              <div className="flex items-center gap-6 pt-2">
                {/* Volume slider button */}
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioVolume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAudioVolume(v);
                      if (audioRef.current) audioRef.current.volume = v / 100;
                    }}
                    className="w-12 h-1 accent-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => addToast('Restarting track...', 'info')}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handlePlayPause}
                    className="w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform active:scale-[0.95]"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                  </button>
                  <button
                    onClick={() => addToast('Skipping to next track...', 'info')}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Speed adjustment controls */}
                <div className="flex gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                  {[1, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${playbackSpeed === speed
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                        }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-12">No podcast loaded.</p>
          )}
        </div>

        {/* Playlist column (Right Panel) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Lessons Catalog</h3>
            <div className="space-y-3">
              {audioLessons.map(track => (
                <div
                  key={track.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${activeTrack?.id === track.id
                      ? 'border-indigo-500 bg-indigo-500/5 text-slate-800 dark:text-white'
                      : 'border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-950/30'
                    }`}
                  onClick={() => handleTrackSelect(track)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTrack?.id === track.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                      <FileAudio className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold truncate">{track.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{track.author}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400">{track.duration}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(track);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
