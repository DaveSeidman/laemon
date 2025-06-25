import React from 'react';
import './index.scss';

const UI = ({ shuffled, completed, startGame, restartGame }) => (
  <div className="ui">
    <div className={`ui-start ${!shuffled ? '' : 'hidden'}`}>
      <button
        className="ui-start-button"
        type="button"
        onClick={startGame}
      >
        Let's Go!
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
      <h1>Congratulations</h1>
    </div>
  </div>
);

export default UI;
