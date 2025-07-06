import React, { useState, useEffect, useRef } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import './index.scss';

export default function App() {
  const slices = 8;
  const [shuffling, setShuffling] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [twistIndex, setTwistIndex] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [reset, setReset] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startFlare, setStartFlare] = useState(false);
  const videoElementRef = useRef();
  const finishTwist = useRef(() => { });

  const startTwists = 1;

  const startGame = async () => {
    setShuffling(true);
    setCompleted(false);
    const twist = (index) => new Promise((resolve) => {
      finishTwist.current = resolve;
      setTwistIndex(index);
    });

    let last = twistIndex;
    for (let i = 0; i < startTwists; i += 1) {
      let next = Math.floor(Math.random() * slices);
      while (next === last) {
        next = Math.floor(Math.random() * slices);
      }
      console.log('twisting to', next);
      await twist(next);
      last = next;
    }

    setShuffled(true);
    setShuffling(false);
    setPlaying(true);
  };

  const restartGame = () => {
    console.log('restart');
    setReset(true);
    setShuffled(false);
    setCompleted(false);
  };

  useEffect(() => {
    if (completed) {
      setPlaying(false);
    }
  }, [completed]);

  return (
    <div className="app">
      <div className="app-background" />
      <Scene
        slices={slices}
        twistIndex={twistIndex}
        onTwistComplete={() => finishTwist.current()}
        reset={reset}
        setReset={setReset}
        setCompleted={setCompleted}
        shuffling={shuffling}
        startFlare={startFlare}
        setStartFlare={setStartFlare}
      />
      <UI
        completed={completed}
        shuffling={shuffling}
        shuffled={shuffled}
        startGame={startGame}
        restartGame={restartGame}
        playing={playing}
        webcamRunning={webcamRunning}
        setWebcamRunning={setWebcamRunning}
      />
      <button
        style={{ position: 'absolute', bottom: 0, left: 0, padding: '.5rem', zIndex: 2 }}
        type="button"
        onClick={() => setStartFlare(true)}
      >
        Flare Animation
      </button>
    </div>
  );
}
