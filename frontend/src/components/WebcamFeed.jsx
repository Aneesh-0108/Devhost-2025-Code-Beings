import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import { logEmotion } from '../services/api'

function WebcamFeed({ employeeId, employeeName }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetecting, setIsDetecting] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState(null)
  const [error, setError] = useState(null)
  const modelsLoadedRef = useRef(false)
  const isActiveRef = useRef(false) // Track if detection is active to prevent logging after stop

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'
        console.log('Loading face-api models from:', MODEL_URL)
        
        // Load models sequentially to avoid potential race conditions
        console.log('Loading tinyFaceDetector...')
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        console.log('✓ tinyFaceDetector loaded')
        
        console.log('Loading faceLandmark68Net...')
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        console.log('✓ faceLandmark68Net loaded')
        
        console.log('Loading faceRecognitionNet...')
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        console.log('✓ faceRecognitionNet loaded')
        
        console.log('Loading faceExpressionNet...')
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        console.log('✓ faceExpressionNet loaded')
        
        modelsLoadedRef.current = true
        setIsLoading(false)
        console.log('All face-api models loaded successfully')
      } catch (err) {
        console.error('Error loading models:', err)
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
        })
        setError(
          `Failed to load face detection models: ${err.message}. Please ensure all model files are correctly downloaded and placed in /public/models`
        )
        setIsLoading(false)
      }
    }

    loadModels()
  }, [])

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },  // Higher resolution for better detection
            height: { ideal: 720 },
            facingMode: 'user'
          },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Error accessing webcam:', err)
        setError('Failed to access webcam. Please grant camera permissions.')
      }
    }

    if (!isLoading && modelsLoadedRef.current) {
      startWebcam()
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isLoading])

  // Detect emotions
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || isLoading || !modelsLoadedRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    let animationFrameId
    let lastLogTime = 0
    const LOG_INTERVAL = 5000 // Log every 5 seconds
    
    // Emotion smoothing - keep track of recent emotions
    const emotionHistory = []
    const HISTORY_SIZE = 5 // Average over last 5 frames

    const detectFaces = async () => {
      // Check if detection is still active
      if (!isDetecting || !isActiveRef.current) {
        return
      }

      try {
        // Use better face detector options for more accurate detection
        const detectionOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 512, // Higher resolution for better accuracy
          scoreThreshold: 0.5, // Lower threshold to catch more faces
        })

        // Detect faces using video's actual internal dimensions
        const detections = await faceapi
          .detectAllFaces(video, detectionOptions)
          .withFaceLandmarks()
          .withFaceExpressions()

        // Get the displayed size of the video (what user sees)
        const displaySize = {
          width: video.clientWidth || video.videoWidth,
          height: video.clientHeight || video.videoHeight,
        }
        
        // Set canvas internal size to match displayed size
        if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
          canvas.width = displaySize.width
          canvas.height = displaySize.height
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw detections
        if (detections.length > 0) {
          // Resize detections from video's internal size to displayed size
          const resizedDetections = faceapi.resizeResults(detections, displaySize)

          faceapi.draw.drawDetections(canvas, resizedDetections)
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

          // Get the dominant emotion with improved logic
          const expressions = detections[0].expressions
          const sortedExpressions = Object.entries(expressions).sort((a, b) => b[1] - a[1])
          
          // More aggressive neutral filtering
          let dominantEmotion = sortedExpressions[0][0]
          let confidence = sortedExpressions[0][1]
          
          // If neutral is dominant, check if any other emotion is significant
          if (dominantEmotion === 'neutral') {
            // Look for the highest non-neutral emotion
            const nonNeutralEmotions = sortedExpressions.filter(([emotion]) => emotion !== 'neutral')
            
            if (nonNeutralEmotions.length > 0) {
              const highestNonNeutral = nonNeutralEmotions[0]
              const neutralConfidence = expressions.neutral
              
              // If a non-neutral emotion is within 30% of neutral and above 0.25, prefer it
              const confidenceDiff = neutralConfidence - highestNonNeutral[1]
              if (confidenceDiff < 0.3 && highestNonNeutral[1] > 0.25) {
                dominantEmotion = highestNonNeutral[0]
                confidence = highestNonNeutral[1]
              }
              // If neutral confidence is low (< 0.6) and another emotion is reasonable (> 0.2), use that
              else if (neutralConfidence < 0.6 && highestNonNeutral[1] > 0.2) {
                dominantEmotion = highestNonNeutral[0]
                confidence = highestNonNeutral[1]
              }
            }
          }
          
          // Lower threshold for non-neutral emotions to catch more variations
          const MIN_CONFIDENCE = dominantEmotion === 'neutral' ? 0.5 : 0.3
          if (confidence < MIN_CONFIDENCE) {
            // Only default to neutral if nothing else is significant
            const hasSignificantEmotion = sortedExpressions.some(
              ([emotion, conf]) => emotion !== 'neutral' && conf > 0.25
            )
            if (!hasSignificantEmotion) {
              dominantEmotion = 'neutral'
              confidence = expressions.neutral
            } else {
              // Use the most significant non-neutral emotion
              const significant = sortedExpressions.find(
                ([emotion, conf]) => emotion !== 'neutral' && conf > 0.25
              )
              if (significant) {
                dominantEmotion = significant[0]
                confidence = significant[1]
              }
            }
          }

          // Add to emotion history for smoothing
          emotionHistory.push({
            emotion: dominantEmotion,
            confidence: confidence,
            expressions: expressions,
          })
          
          // Keep only recent history
          if (emotionHistory.length > HISTORY_SIZE) {
            emotionHistory.shift()
          }
          
          // Calculate smoothed emotion (average over recent frames)
          const smoothedEmotion = calculateSmoothedEmotion(emotionHistory)

          setCurrentEmotion({
            emotion: smoothedEmotion.emotion,
            confidence: Math.round(smoothedEmotion.confidence * 100),
            expressions: smoothedEmotion.expressions,
            timestamp: new Date(),
          })

          // Log to backend every LOG_INTERVAL (use smoothed emotion)
          // Only log if detection is still active
          if (isActiveRef.current && isDetecting) {
            const now = Date.now()
            if (now - lastLogTime >= LOG_INTERVAL) {
              try {
                // Double-check before logging (in case detection was stopped during async operation)
                if (isActiveRef.current && isDetecting) {
                  await logEmotion({
                    employeeId,
                    employeeName,
                    emotion: smoothedEmotion.emotion,
                    confidence: smoothedEmotion.confidence,
                    expressions: smoothedEmotion.expressions,
                    timestamp: new Date().toISOString(),
                  })
                  lastLogTime = now
                }
              } catch (err) {
                console.error('Error logging emotion:', err)
              }
            }
          }
        } else {
          setCurrentEmotion(null)
          // Clear history when no face detected
          emotionHistory.length = 0
        }
      } catch (err) {
        console.error('Error detecting faces:', err)
      }

      if (isDetecting) {
        animationFrameId = requestAnimationFrame(detectFaces)
      }
    }

    // Helper function to calculate smoothed emotion
    const calculateSmoothedEmotion = (history) => {
      if (history.length === 0) {
        return { emotion: 'neutral', confidence: 0, expressions: {} }
      }

      // Count occurrences of each emotion (weighted by confidence)
      const emotionWeights = {}
      const allExpressions = {
        happy: 0,
        sad: 0,
        angry: 0,
        fearful: 0,
        disgusted: 0,
        surprised: 0,
        neutral: 0,
      }

      history.forEach((entry) => {
        // Weight by confidence to favor stronger emotions
        const weight = entry.confidence
        emotionWeights[entry.emotion] = (emotionWeights[entry.emotion] || 0) + weight
        
        // Average all expression values
        Object.keys(allExpressions).forEach((emotion) => {
          allExpressions[emotion] += entry.expressions[emotion] || 0
        })
      })

      // Find emotion with highest weighted score (not just count)
      let mostWeightedEmotion = 'neutral'
      let maxWeight = 0
      Object.entries(emotionWeights).forEach(([emotion, weight]) => {
        // Penalize neutral slightly to favor other emotions
        const adjustedWeight = emotion === 'neutral' ? weight * 0.8 : weight
        if (adjustedWeight > maxWeight) {
          maxWeight = adjustedWeight
          mostWeightedEmotion = emotion
        }
      })

      // Average confidence for the most weighted emotion
      const emotionEntries = history.filter(e => e.emotion === mostWeightedEmotion)
      const avgConfidence = emotionEntries.length > 0
        ? emotionEntries.reduce((sum, e) => sum + e.confidence, 0) / emotionEntries.length
        : 0

      // Average all expressions
      Object.keys(allExpressions).forEach((emotion) => {
        allExpressions[emotion] /= history.length
      })

      return {
        emotion: mostWeightedEmotion,
        confidence: avgConfidence,
        expressions: allExpressions,
      }
    }

    // Update active ref when isDetecting changes
    isActiveRef.current = isDetecting
    
    // Clear history and reset when stopping
    if (!isDetecting) {
      emotionHistory.length = 0
      lastLogTime = 0
      setCurrentEmotion(null)
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    if (isDetecting) {
      detectFaces()
    }

    return () => {
      // Mark as inactive when component unmounts or detection stops
      isActiveRef.current = false
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isDetecting, isLoading])

  // Set canvas size to match video display size
  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      const updateCanvasSize = () => {
        // Use the displayed size of the video, not its internal dimensions
        const displayWidth = video.clientWidth || video.videoWidth || 640
        const displayHeight = video.clientHeight || video.videoHeight || 480
        
        canvas.width = displayWidth
        canvas.height = displayHeight
      }
      
      // Update on load and resize
      video.addEventListener('loadedmetadata', updateCanvasSize)
      window.addEventListener('resize', updateCanvasSize)
      
      // Initial size update
      updateCanvasSize()
      
      return () => {
        video.removeEventListener('loadedmetadata', updateCanvasSize)
        window.removeEventListener('resize', updateCanvasSize)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading face detection models...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      <div className="flex gap-4 items-center">
        <button
          onClick={() => setIsDetecting(!isDetecting)}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isDetecting
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </button>

        {currentEmotion && (
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Emotion</p>
                <p className="text-xl font-semibold text-gray-800 capitalize">
                  {currentEmotion.emotion}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="text-xl font-semibold text-gray-800">
                  {currentEmotion.confidence}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebcamFeed

