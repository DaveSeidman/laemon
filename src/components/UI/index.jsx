import React from 'react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import Timer from './Timer';
import logo from '../../assets/images/logo.svg';

import './index.scss';

const UI = ({ shuffled, shuffling, completed, startGame, restartGame, playing }) => {
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
      <div className="ui-bottom">
        <p className="ui-bottom-level">Level 1</p>
        <a href="https://jogg.com/shop" target="_blank" rel="noreferrer">
          <button
            className="ui-bottom-buy"
            type="button"
          >
            Buy Now!
          </button>
        </a>
        <a href="https://jogg.com" target="_blank" rel="noreferrer"><img className="ui-bottom-logo" src={logo} /></a>
      </div>
      {/* <button
        className={`ui-restart ${shuffled ? '' : 'hidden'}`}
        type="button"
        onClick={restartGame}
      >
        Restart
      </button> */}
      <Timer
        active={playing}
      />
      <div className={`ui-result ${completed ? '' : 'hidden'}`}>
        <Confetti
          width={width}
          height={height}
        />
        <h1 className="ui-result-title">Congratulations!</h1>
      </div>
    </div>
  );
};
export default UI;
