import React, { useRef } from 'react';
import './index.scss';

const Camera = ({ setWidth, setHeight, setAudioSource, webcamRunning, setWebcamRunning, videoElementRef }) => {
  const stream = useRef();

  const startCamera = async () => {
    const constraints = { video: true };
    stream.current = await navigator.mediaDevices.getUserMedia(constraints);
    const videoTrack = stream.current.getVideoTracks()[0];
    const { width, height } = videoTrack.getSettings();
    // setWidth(width);
    // setHeight(height);
    videoElementRef.current.srcObject = stream.current;
    // TODO: this flattens out the volume bar :(
    // videoElementRef.current.volume = 0.0;
    // videoElementRef.current.muted = true;
    // setAudioSource(stream.current);
    setWebcamRunning(true);
  };

  return (
    <div className="camera">
      <video
        ref={videoElementRef}
        className={`camera-video ${webcamRunning ? '' : 'hidden'}`}
        autoPlay
        playsInline
        muted
      />
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
