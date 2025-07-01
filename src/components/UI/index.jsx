import React from 'react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import logo from '../../assets/images/logo.svg';

import './index.scss';

const UI = ({ shuffled, completed, startGame, restartGame }) => {
  const { width, height } = useWindowSize();

  return (
    <div className="ui">
      <div className={`ui-start ${!shuffled ? '' : 'hidden'}`}>
        <button
          className="ui-start-button"
          type="button"
          onClick={startGame}
        >
          Start
        </button>
      </div>
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
        <img className="ui-bottom-logo" src={logo} />
      </div>
      {/* <button
        className={`ui-restart ${shuffled ? '' : 'hidden'}`}
        type="button"
        onClick={restartGame}
      >
        Restart
      </button> */}
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
