import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { sendAiTelemetry, updateEmployee } from '../lib/api';

const MODEL_URL = '/models';
const TELEMETRY_INTERVAL = 3000;

// Calculate burnout score from emotion
const calculateBurnoutScore = (emotion) => {
  const scoreMap = {
    happy: 10,
    neutral: 30,
    tired: 70,
    sad: 90,
    angry: 100,
    disgusted: 85,
    fearful: 80,
    surprised: 40
  };
  return scoreMap[emotion?.toLowerCase()] || 50;
};

const deriveBurnoutRisk = (burnoutScore) => {
    if (burnoutScore >= 70) return 'High';
    if (burnoutScore >= 50) return 'Medium';
    if (burnoutScore >= 30) return 'Normal';
    return 'Low';
};

const recommendationFor = (risk) => {
    switch (risk) {
        case 'High':
            return 'Immediate support needed — plan a debrief and offer time off.';
        case 'Medium':
            return 'Encourage breaks and mindfulness moments today.';
        default:
            return 'Keep up positive routines and celebrate progress!';
    }
};

function MonitorCam() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const lastSentRef = useRef(0);
    const [status, setStatus] = useState({
        detectedFaces: 0,
        faceData: [],
        error: '',
        streaming: false,
    });

    useEffect(() => {
        let isMounted = true;
        let stream;

        const loadModels = async () => {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
        };

        const startVideo = async () => {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setStatus((prev) => ({ ...prev, streaming: true, error: '' }));
        };

        const drawOverlay = (detections) => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video || !video.videoWidth || !video.videoHeight) return;

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const context = canvas.getContext('2d');

            context.clearRect(0, 0, canvas.width, canvas.height);
            
            resizedDetections.forEach((detection, index) => {
                faceapi.draw.drawDetections(canvas, detection);
                faceapi.draw.drawFaceLandmarks(canvas, detection);
                
                // Draw face number label
                const box = detection.detection.box;
                context.fillStyle = 'rgba(0, 255, 0, 0.8)';
                context.fillRect(box.x, box.y - 20, 80, 20);
                context.fillStyle = 'black';
                context.font = '14px Arial';
                context.fillText(`Face ${index + 1}`, box.x + 5, box.y - 5);
            });
        };

        const analyze = async () => {
            if (!isMounted || !videoRef.current) return;

            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
            const detections = await faceapi
                .detectAllFaces(videoRef.current, options)
                .withFaceLandmarks()
                .withFaceExpressions()
                .withFaceDescriptors();

            if (detections && detections.length > 0) {
                drawOverlay(detections);
                
                const faceData = detections.map((detection, index) => {
                    const expressions = detection.expressions;
                    const dominantExpression = Object.entries(expressions).reduce((max, current) =>
                        current[1] > max[1] ? current : max
                    )[0];
                    
                    const burnoutScore = calculateBurnoutScore(dominantExpression);
                    const burnoutRisk = deriveBurnoutRisk(burnoutScore);
                    
                    return {
                        faceIndex: index + 1,
                        dominantExpression,
                        burnoutScore,
                        burnoutRisk,
                        descriptor: Array.from(detection.descriptor),
                    };
                });

                setStatus({
                    detectedFaces: detections.length,
                    faceData,
                    error: '',
                    streaming: true,
                });

                const now = Date.now();
                if (now - lastSentRef.current > TELEMETRY_INTERVAL) {
                    lastSentRef.current = now;
                    
                    // Send update for each detected face
                    faceData.forEach(async (face, index) => {
                        try {
                            await updateEmployee({
                                name: `User ${index + 1}`,
                                email: `user${index + 1}@example.com`,
                                faceDescriptor: face.descriptor,
                                emotion: face.dominantExpression,
                                emotionScore: face.burnoutScore,
                                role: 'Employee'
                            });
                        } catch (err) {
                            console.error(`Error updating face ${index + 1}:`, err);
                        }
                    });
                    
                    // Also send telemetry (optional, for backwards compatibility)
                    sendAiTelemetry({
                        facesDetected: detections.length,
                        timestamp: new Date().toISOString(),
                    }).catch((err) => {
                        console.error('Error sending telemetry:', err);
                    });
                }
            } else {
                setStatus((prev) => ({ ...prev, detectedFaces: 0, faceData: [], error: 'No faces detected' }));
            }

            requestAnimationFrame(analyze);
        };

        (async () => {
            try {
                await loadModels();
                await startVideo();
                analyze();
            } catch (err) {
                console.error('Failed to initialise monitor cam', err);
                if (isMounted) {
                    setStatus((prev) => ({ ...prev, error: err.message, streaming: false }));
                }
            }
        })();

        return () => {
            isMounted = false;
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold text-gray-800">Live Wellness Monitor (Multi-Face)</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative bg-black rounded-lg overflow-hidden shadow">
                    <video ref={videoRef} className="w-full h-auto" autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                </div>
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700">Current Signal</h2>
                        <p className="text-sm text-gray-500">Models streaming: {status.streaming ? 'Yes' : 'No'}</p>
                        <p className="text-sm text-gray-500">Detected Faces: {status.detectedFaces}</p>
                    </div>
                    
                    {status.faceData.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {status.faceData.map((face) => (
                                <div key={face.faceIndex} className="border rounded-lg p-4 bg-gray-50">
                                    <h3 className="font-semibold text-gray-800 mb-2">Face {face.faceIndex}</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Expression</p>
                                            <p className="text-lg font-semibold text-gray-800 capitalize">{face.dominantExpression}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Burnout Score</p>
                                            <p className="text-lg font-semibold text-gray-800">{face.burnoutScore}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 uppercase">Burnout Risk</p>
                                            <span
                                                className={`inline-flex mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                                                    face.burnoutRisk === 'High'
                                                        ? 'bg-red-100 text-red-700'
                                                        : face.burnoutRisk === 'Medium'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : face.burnoutRisk === 'Normal'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}
                                            >
                                                {face.burnoutRisk}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 bg-white border rounded p-2">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Recommendation</p>
                                        <p className="text-sm text-gray-700">{recommendationFor(face.burnoutRisk)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            {status.error || 'Awaiting faces...'}
                        </div>
                    )}
                    
                    {status.error && (
                        <div className="text-sm text-red-600">{status.error}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MonitorCam;
