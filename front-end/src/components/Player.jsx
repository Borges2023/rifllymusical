import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlay,
  faCirclePause,
  faBackwardStep,
  faForwardStep,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Ad from "./Ad";
import { useAdvertising } from "../advertising/AdvertisingContext";

const FALLBACK_AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

const isPlayableAudioUrl = (value) => {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;

  // Accept signed URLs and normal MP3 URLs.  A signed URL may use query
  // parameters other than `token`, so checking for that exact parameter made
  // otherwise valid tracks unavailable.
  return /\.mp3(?:[?#]|$)/i.test(trimmed);
};

const resolveAudioUrl = (value) =>
  isPlayableAudioUrl(value) ? value : FALLBACK_AUDIO_URL;

const getSongId = (song) => song?._id ?? song?.id;

const formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(timeInSeconds - minutes * 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const timeInSeconds = (timeString) => {
  const splitArray = timeString.split(":");
  const minutes = Number(splitArray[0]);
  const seconds = Number(splitArray[1]);

  return seconds + minutes * 60;
};
// Duração de cada música é armazenada como string no formato "mm:ss" no banco de dados.
const Player = ({
  duration,
  playlist = [],
  currentId,
  audio,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const fromGlobalList = Boolean(location.state?.fromGlobalList);
  const navigationState = useMemo(
    () => (fromGlobalList ? { fromGlobalList } : undefined),
    [fromGlobalList]
  );
  const audioPlayer = useRef(null);
  const progressBar = useRef(null);
  const volumeBar = useRef(null);
  const previousIdRef = useRef(null);
  const shouldResumeAfterAdRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(formatTime(0));
  const [volume, setVolume] = useState(0.7);
  const [durationInSeconds, setDurationInSeconds] = useState(
    timeInSeconds(duration)
  );
  const [isSeeking, setIsSeeking] = useState(false);
  const [isAdjustingVolume, setIsAdjustingVolume] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [songChangeCount, setSongChangeCount] = useState(0);
  const { getAd, loadPlacement, recordImpression, recordClick } = useAdvertising();
  const currentIndex = useMemo(
    () =>
      playlist.findIndex(
        (item) => String(getSongId(item)) === String(currentId)
      ),
    [playlist, currentId]
  );

  // Função para obter anúncio rotativo baseado na posição da música
  const currentAd = useMemo(() => getAd("song"), [getAd]);

  useEffect(() => { loadPlacement("song"); }, [loadPlacement]);

  const playAudioWithFallback = useCallback(async (audioEl = audioPlayer.current) => {
    if (!audioEl) return false;

    const resolvedAudio = resolveAudioUrl(audio);
    if (audioEl.src !== resolvedAudio) {
      audioEl.src = resolvedAudio;
      audioEl.load();
    }

    try {
      await audioEl.play();
      setIsPlaying(true);
      return true;
    } catch (error) {
      // A URL can fail because it expired, returned a network error, or has an
      // unsupported MIME type. In all of those cases, keep the player usable.
      if (audioEl.src !== FALLBACK_AUDIO_URL) {
        audioEl.src = FALLBACK_AUDIO_URL;
        audioEl.load();
        try {
          await audioEl.play();
          setIsPlaying(true);
          return true;
        } catch (fallbackError) {
          console.warn("Falha ao reproduzir áudio com fallback:", fallbackError);
        }
      }

      setIsPlaying(false);
      console.warn("Falha ao reproduzir áudio:", error);
      return false;
    }
  }, [audio]);

  useEffect(() => {
    if (!audioPlayer.current) return;

    const nextSrc = resolveAudioUrl(audio);
    audioPlayer.current.src = nextSrc;
    audioPlayer.current.load();
  }, [audio, currentId]);

  useEffect(() => {
    const audioEl = audioPlayer.current;
    if (!audioEl) return;

    const handleError = async () => {
      if (audioEl.src !== FALLBACK_AUDIO_URL) {
        audioEl.src = FALLBACK_AUDIO_URL;
        audioEl.load();
        try {
          await audioEl.play();
          setIsPlaying(true);
        } catch (error) {
          setIsPlaying(false);
          console.warn("Falha ao reproduzir o áudio de reserva:", error);
        }
      }
    };

    audioEl.addEventListener("error", handleError);
    return () => audioEl.removeEventListener("error", handleError);
  }, [audio, currentId]);

  const prevSongId = useMemo(() => {
    if (playlist.length === 0 || currentIndex <= 0) return null;
    return getSongId(playlist[currentIndex - 1]);
  }, [playlist, currentIndex]);

  const nextSongId = useMemo(() => {
    if (playlist.length === 0 || currentIndex < 0 || currentIndex >= playlist.length - 1) return null;
    return getSongId(playlist[currentIndex + 1]);
  }, [playlist, currentIndex]);

  const updateProgress = useCallback((time) => {
    if (!audioPlayer.current || !progressBar.current) return;

    const safeTime = Math.max(0, Math.min(time, durationInSeconds));
    audioPlayer.current.currentTime = safeTime;
    setCurrentTime(formatTime(safeTime));
    const percent = durationInSeconds > 0 ? (safeTime / durationInSeconds) * 100 : 0;
    progressBar.current.style.setProperty("--_progress", percent + "%");
  }, [durationInSeconds]);

  const updateVolume = (percentage) => {
    const safeVolume = Math.max(0, Math.min(1, percentage));

    if (audioPlayer.current) {
      audioPlayer.current.volume = safeVolume;
    }

    setVolume(safeVolume);

    if (volumeBar.current) {
      volumeBar.current.style.setProperty("--_volume", `${safeVolume * 100}%`);
    }
  };

  const showAdOverlay = useCallback(() => {
    shouldResumeAfterAdRef.current = true;

    if (audioPlayer.current) {
      audioPlayer.current.pause();
      setIsPlaying(false);
    }

    setShowAd(true);
    recordImpression(currentAd.id);
  }, [currentAd.id, recordImpression]);

  useEffect(() => {
    const audioEl = audioPlayer.current;
    if (!audioEl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(formatTime(audioEl.currentTime));
      if (durationInSeconds > 0) {
        progressBar.current?.style.setProperty(
          "--_progress",
          (audioEl.currentTime / durationInSeconds) * 100 + "%"
        );
      }
    };

    const handleLoadedMetadata = () => {
      const actualDuration = audioEl.duration;
      if (!Number.isNaN(actualDuration) && actualDuration > 0) {
        setDurationInSeconds(actualDuration);
      }
      if (isPlaying && audioEl.paused) {
        playAudioWithFallback(audioEl).catch(() => {
          // Autoplay might be blocked
        });
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);

      if (nextSongId) {
        navigate(`/song/${nextSongId}`, { state: navigationState });
        return;
      }

      setSongChangeCount((prev) => {
        const newCount = prev + 1;
        if (newCount % 2 === 0) {
          showAdOverlay();
        }
        return newCount;
      });
    };

    audioEl.addEventListener("timeupdate", handleTimeUpdate);
    audioEl.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioEl.addEventListener("ended", handleEnded);

    return () => {
      audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      audioEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioEl.removeEventListener("ended", handleEnded);
    };
  }, [durationInSeconds, isPlaying, nextSongId, navigationState, navigate, playAudioWithFallback, showAdOverlay]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isSeeking) return;

      const bar = progressBar.current?.parentElement;
      if (!bar) return;

      const rect = bar.getBoundingClientRect();
      const relativeX = Math.min(
        Math.max(event.clientX - rect.left, 0),
        rect.width
      );
      const percentage = relativeX / rect.width;
      updateProgress(durationInSeconds * percentage);
    };

    const handlePointerUp = () => {
      setIsSeeking(false);
    };

    if (isSeeking) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isSeeking, durationInSeconds, updateProgress]);

  const handleBarPointerDown = (event) => {
    const bar = event.currentTarget;
    const rect = bar.getBoundingClientRect();
    const relativeX = Math.min(
      Math.max(event.clientX - rect.left, 0),
      rect.width
    );
    const percentage = relativeX / rect.width;
    updateProgress(durationInSeconds * percentage);
    setIsSeeking(true);
  };

  const playPause = () => {
    if (!audioPlayer.current) return;
    if (isPlaying) {
      audioPlayer.current.pause();
      setIsPlaying(false);
      return;
    }
    playAudioWithFallback();
  };

  const handleCloseAd = () => {
    setShowAd(false);

    if (!shouldResumeAfterAdRef.current || !audioPlayer.current) {
      shouldResumeAfterAdRef.current = false;
      return;
    }

    shouldResumeAfterAdRef.current = false;

    const resumePlayback = () => {
      playAudioWithFallback().catch(() => {
        // Autoplay might be blocked by browser, that's fine
      });
    };

    const resumeTimeout = setTimeout(resumePlayback, 150);
    return () => clearTimeout(resumeTimeout);
  };

  useEffect(() => {
    if (previousIdRef.current !== currentId && audioPlayer.current) {
      previousIdRef.current = currentId;
      audioPlayer.current.currentTime = 0;
      setCurrentTime(formatTime(0));

      const nextSongChangeCount = songChangeCount + 1;
      setSongChangeCount(nextSongChangeCount);

      if (nextSongChangeCount % 2 === 0) {
        showAdOverlay();
        return;
      }

      const playTimeout = setTimeout(() => {
        playAudioWithFallback().catch(() => {
          // Autoplay might be blocked by browser, that's fine
        });
      }, 100);

      return () => clearTimeout(playTimeout);
    }
  }, [currentId, songChangeCount, playAudioWithFallback, showAdOverlay]);

  const handleVolumePointerDown = (event) => {
    const bar = event.currentTarget;
    const rect = bar.getBoundingClientRect();
    const relativeX = Math.min(
      Math.max(event.clientX - rect.left, 0),
      rect.width
    );
    const percentage = relativeX / rect.width;
    updateVolume(percentage);
    setIsAdjustingVolume(true);
  };

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isAdjustingVolume) return;

      const bar = volumeBar.current?.parentElement;
      if (!bar) return;

      const rect = bar.getBoundingClientRect();
      const relativeX = Math.min(
        Math.max(event.clientX - rect.left, 0),
        rect.width
      );
      const percentage = relativeX / rect.width;
      updateVolume(percentage);
    };

    const handlePointerUp = () => {
      setIsAdjustingVolume(false);
    };

    if (isAdjustingVolume) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isAdjustingVolume]);

  return (
    <div className="player">
      <div className="player__controllers">
        {prevSongId ? (
          <Link
            to={`/song/${prevSongId}`}
            state={navigationState}
            className="player__icon player__icon--nav"
          >
            <FontAwesomeIcon icon={faBackwardStep} />
          </Link>
        ) : (
          <span className="player__icon player__icon--nav player__icon--disabled">
            <FontAwesomeIcon icon={faBackwardStep} />
          </span>
        )}

        <button
          type="button"
          className="player__icon player__icon--play"
          onClick={playPause}
        >
          <FontAwesomeIcon icon={isPlaying ? faCirclePause : faCirclePlay} />
        </button>

        {nextSongId ? (
          <Link
            to={`/song/${nextSongId}`}
            state={navigationState}
            className="player__icon player__icon--nav"
          >
            <FontAwesomeIcon icon={faForwardStep} />
          </Link>
        ) : (
          <span className="player__icon player__icon--nav player__icon--disabled">
            <FontAwesomeIcon icon={faForwardStep} />
          </span>
        )}
      </div>

      <div className="player__progress">
        <p className="player__time">{currentTime}</p>

        <div
          className="player__bar"
          onPointerDown={handleBarPointerDown}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={durationInSeconds}
          aria-valuenow={audioPlayer.current?.currentTime || 0}
        >
          <div ref={progressBar} className="player__bar-progress"></div>
        </div>

        <p className="player__time">{formatTime(durationInSeconds)}</p>
      </div>

      <div className="player__volume">
        <div
          className="player__volume-bar"
          onPointerDown={handleVolumePointerDown}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(volume * 100)}
        >
          <div ref={volumeBar} className="player__volume-bar-progress"></div>
        </div>
      </div>

      <audio ref={audioPlayer} src={resolveAudioUrl(audio)}></audio>

      {showAd && (
        <Ad
          title={currentAd.title}
          description={currentAd.description}
          logo={currentAd.imageUrl || currentAd.logo}
          link={currentAd.link}
          onClick={() => recordClick(currentAd.id)}
          onClose={handleCloseAd}
          countdownSeconds={10}
        />
      )}
    </div>
  );
};

export default Player;
