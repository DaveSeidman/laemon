import React from 'react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import Timer from './Timer';
import logo from '../../assets/images/logo.svg';

import './index.scss';
import Camera from './Camera';

const UI = ({ shuffled, shuffling, completed, startGame, restartGame, playing, webcamRunning, setWebcamRunning }) => {
  const { width, height } = useWindowSize();

  return (
    <div className="ui">
      <button
        className={`ui-start ${shuffling || playing ? 'hidden' : ''}`}
        type="button"
        onClick={startGame}
      >
        Start
      </button>
      <p className="ui-level">Level 1</p>
      <a href="https://jogg.com/shop" target="_blank" rel="noreferrer">
        <button
          className="ui-buy"
          type="button"
        >
          Buy Now!
        </button>
      </a>
      <a className="ui-logo" href="https://jogg.com" target="_blank" rel="noreferrer">
        <img src={logo} />
      </a>
      <Timer
        playing={playing}
        completed={completed}
      />
      <Camera
        webcamRunning={webcamRunning}
        setWebcamRunning={setWebcamRunning}
      />
      <div className={`ui-result ${completed ? '' : 'hidden'}`}>
        <Confetti
          width={width}
          height={height}
        />
        <h1
          className="ui-result-title"
          style={{ zIndex: 2 }}
        >
          Congratulations!
        </h1>
      </div>
    </div>
  );
};
export default UI;
