import React, { useRef } from 'react';
import './index.scss';

const Camera = ({ setWidth, setHeight, setAudioSource, webcamRunning, setWebcamRunning }) => {
  const stream = useRef();
  const videoElementRef = useRef();

  const startCamera = async () => {
    const constraints = { video: { facingMode: 'user' } };
    stream.current = await navigator.mediaDevices.getUserMedia(constraints);
    const videoTrack = stream.current.getVideoTracks()[0];
    const { width, height } = videoTrack.getSettings();
    console.log('here');
    videoElementRef.current.srcObject = stream.current;
    setWebcamRunning(true);
  };

  return (
    <div className="camera">
      <div className={`camera-frame ${webcamRunning ? '' : 'hidden'}`}>
        <video
          ref={videoElementRef}
          className={`camera-frame-video ${webcamRunning ? '' : 'hidden'}`}
          autoPlay
          playsInline
          muted
        />
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
