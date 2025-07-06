import React, { useEffect, useRef, useState } from 'react';
import { formatDate, formatGameTime } from '../../../utils';
import './index.scss';

const Timer = ({ playing, completed }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [gameTime, setGameTime] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Update current clock every second
  useEffect(() => {
    const currentInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(currentInterval);
  }, []);

  // Start/stop/reset game timer when `active` changes
  useEffect(() => {
    if (playing) {
      startTimeRef.current = performance.now();
      intervalRef.current = setInterval(() => {
        setGameTime(performance.now() - startTimeRef.current);
      }, 10); // update every 10ms for millisecond accuracy
    } else {
      clearInterval(intervalRef.current);
      // setGameTime(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  return (
    <div className={`timer ${playing || completed ? '' : 'hidden'}`}>
      <h2 className="timer-time">{formatDate(currentTime)}</h2>
      <h1 className="timer-game">{formatGameTime(gameTime)}</h1>
    </div>
  );
};

export default Timer;
