import React, { useEffect } from 'react';
import { formatDate } from '../../../utils';
import './index.scss';

const Timer = ({ start, stop }) => {
  const date = new Date();

  useEffect(() => {
    if (start) {

    }
  }, [start]);

  return (
    <div className="timer">
      <div className="timer-date">{formatDate(date)}</div>
      <div className="timer-recording">REC</div>
      <div className="timer-time" />
    </div>
  );
};

export default Timer;
