import { useEffect, useState, useRef } from "react";
import "./Ad.css";

const Ad = ({ title, description, logo, link, onClose, onClick, countdownSeconds = 10 }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(countdownSeconds);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingSeconds((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (remainingSeconds === 0) {
      onCloseRef.current?.();
    }
  }, [remainingSeconds]);

  return (
    <div className="ad-overlay">
      <div className="ad-container">
        <button className="ad-close" onClick={onClose}>
          ✕
        </button>

        <div className="ad-content">
          <div className="ad-header">
            <img src={logo} alt="Logo do anúncio" className="ad-logo" />
          </div>

          <div className="ad-body">
            <h3 className="ad-title">{title}</h3>
            <p className="ad-description">{description}</p>
          </div>

          <div className="ad-footer">
            <a href={link} target="_blank" rel="noopener noreferrer" className="ad-button" onClick={onClick}>
              Saiba Mais
            </a>
          </div>

          <div className="ad-countdown" aria-live="polite">
            Fechando em {remainingSeconds}s
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ad;
