import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { sendAiTelemetry } from '../lib/api';

const MODEL_URL = '/models';
const TELEMETRY_INTERVAL = 3000;

const deriveBurnoutRisk = (stressScore, dominantExpression) => {
    if (stressScore >= 0.7 || ['angry', 'fearful', 'disgusted'].includes(dominantExpression)) {
        return 'High';
    }

    if (stressScore >= 0.4 || ['sad', 'surprised'].includes(dominantExpression)) {
        return 'Medium';
    }

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
        dominantExpression: 'unknown',
        stressScore: 0,
        burnoutRisk: 'Low',
        recommendation: '',
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

        const computeStressScore = (expressions) => {
            const stressWeights = {
                angry: 0.95,
                disgusted: 0.85,
                fearful: 0.9,
                sad: 0.7,
                surprised: 0.55,
                neutral: 0.4,
                happy: 0.2,
            };

            return Object.entries(expressions).reduce((score, [key, value]) => {
                const weight = stressWeights[key] ?? 0.5;
                return score + weight * value;
            }, 0);
        };

        const drawOverlay = (detection) => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video || !video.videoWidth || !video.videoHeight) return;

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            const context = canvas.getContext('2d');

            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetection);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
        };

        const analyze = async () => {
            if (!isMounted || !videoRef.current) return;

            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
            const detection = await faceapi
                .detectSingleFace(videoRef.current, options)
                .withFaceLandmarks()
                .withFaceExpressions();

            if (detection) {
                drawOverlay(detection);
                const expressions = detection.expressions;
                const dominantExpression = Object.entries(expressions).reduce((max, current) =>
                    current[1] > max[1] ? current : max
                )[0];
                const stressScore = Number(computeStressScore(expressions).toFixed(2));
                const burnoutRisk = deriveBurnoutRisk(stressScore, dominantExpression);
                const recommendation = recommendationFor(burnoutRisk);

                setStatus({
                    dominantExpression,
                    stressScore,
                    burnoutRisk,
                    recommendation,
                    error: '',
                    streaming: true,
                });

                const now = Date.now();
                if (now - lastSentRef.current > TELEMETRY_INTERVAL) {
                    lastSentRef.current = now;
                    sendAiTelemetry({
                        expression: dominantExpression,
                        stressScore,
                        timestamp: new Date().toISOString(),
                    }).catch((err) => {
                        setStatus((prev) => ({ ...prev, error: err.message }));
                    });
                }
            } else {
                setStatus((prev) => ({ ...prev, error: 'Face not detected', dominantExpression: 'none' }));
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
            <h1 className="text-2xl font-semibold text-gray-800">Live Wellness Monitor</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative bg-black rounded-lg overflow-hidden shadow">
                    <video ref={videoRef} className="w-full h-auto" autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                </div>
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700">Current Signal</h2>
                        <p className="text-sm text-gray-500">Models streaming: {status.streaming ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">Expression</p>
                            <p className="text-xl font-semibold text-gray-800 capitalize">{status.dominantExpression}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">Stress Score</p>
                            <p className="text-xl font-semibold text-gray-800">{status.stressScore}</p>
                        </div>
                        <div className="p-4 border rounded-lg col-span-2">
                            <p className="text-xs text-gray-500 uppercase">Burnout Risk</p>
                            <span
                                className={`inline-flex mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                                    status.burnoutRisk === 'High'
                                        ? 'bg-red-100 text-red-700'
                                        : status.burnoutRisk === 'Medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                }`}
                            >
                                {status.burnoutRisk}
                            </span>
                        </div>
                    </div>
                    <div className="bg-gray-50 border rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase mb-2">Recommendation</p>
                        <p className="text-sm text-gray-700">{status.recommendation || 'Awaiting signal...'}</p>
                    </div>
                    {status.error && (
                        <div className="text-sm text-red-600">{status.error}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MonitorCam;

