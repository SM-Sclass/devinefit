import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Button } from './ui/button';
import { Card } from '@/components/ui/card'

const SOCKET_SERVER_URL = 'http://localhost:5000'; // adjust as needed

const VideoStreamer = ({ icon, name, setSelectedExercise }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [feedback, setFeedback] = useState(null)
  const [repCount, setRepCount] = useState(0)

  // Initialize WebSocket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      cors: {
        origin: "*"
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Python backend via WebSocket');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  // Capture and send frames
  const captureFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg'); // base64 image
    socketRef.current.emit('video_frame', dataUrl);
  };

  // Start streaming
  const startStreaming = () => {
    setIsStreaming(true);
    startWebcam();

    const id = setInterval(() => {
      captureFrame();
    }, 100); // every 100ms ≈ 10 FPS
    setIntervalId(id);
  };

  // Stop streaming
  const stopStreaming = () => {
    setIsStreaming(false);
    clearInterval(intervalId);

    const tracks = videoRef.current?.srcObject?.getTracks();
    tracks?.forEach(track => track.stop());
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video relative">
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">{icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{name}</h3>
                  <p className="mb-4 text-gray-600">Ready to analyze your form</p>
                  <Button
                    onClick={startStreaming}
                    className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    Start
                  </Button>
                </div>
              </div>
            )}
            <video ref={videoRef} width={320} height={240} className={`w-full h-full object-cover ${!isStreaming ? 'opacity-30' : ''}`} />
            <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
            
            {/* Video attachment label in bottom right */}
            <div className="absolute bottom-4 right-4">
              <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>Attach Video</span>
              </div>
            </div>
          </div>
          {isStreaming && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={stopStreaming}
                className="bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Stop Streaming
              </Button>
            </div>
          )}
        </div>

        <div className="lg:w-1/2">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Real-time Analysis</h3>

            {isStreaming ? (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-medium">Rep Count</h4>
                  <div className="text-5xl font-bold text-green-600 mt-2">{repCount}</div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-2">Feedback</h4>
                  {feedback ? (
                    <p className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      {feedback}
                    </p>
                  ) : (
                    <p className="text-gray-500">Waiting for analysis...</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                <p>Start the analysis to see real-time feedback on your form and count your reps.</p>
                <p className="mt-4">Make sure you position yourself properly in the frame!</p>
              </div>
            )}
          </Card>

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                stopStreaming()
                setSelectedExercise()
              }}
            >
              Choose Different Exercise
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoStreamer;
