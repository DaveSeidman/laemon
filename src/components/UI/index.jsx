import React from 'react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

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
      <button
        className={`ui-restart ${shuffled ? '' : 'hidden'}`}
        type="button"
        onClick={restartGame}
      >
        Restart
      </button>
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
