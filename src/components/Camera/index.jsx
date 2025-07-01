import React, { useRef } from 'react';
import Timer from './Timer';
import './index.scss';

const Camera = ({ setWidth, setHeight, setAudioSource, webcamRunning, setWebcamRunning, videoElementRef }) => {
  const stream = useRef();

  const startCamera = async () => {
    const constraints = { video: { facingMode: 'user' } };
    stream.current = await navigator.mediaDevices.getUserMedia(constraints);
    const videoTrack = stream.current.getVideoTracks()[0];
    const { width, height } = videoTrack.getSettings();
    videoElementRef.current.srcObject = stream.current;
    setWebcamRunning(true);
  };

  return (
    <div className="camera">
      <div className="camera-frame">
        <video
          ref={videoElementRef}
          className={`camera-frame-video ${webcamRunning ? '' : 'hidden'}`}
          autoPlay
          playsInline
          muted
        />

        <Timer />
      </div>
      <button
        className={`camera-start ${!webcamRunning ? '' : 'hidden'}`}
        type="button"
        onClick={startCamera}
      >
        Start Camera
      </button>
    </div>
  );
};

export default Camera;
