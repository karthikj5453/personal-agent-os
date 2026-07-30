'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, Sparkles, RefreshCw, X, Eye } from 'lucide-react';

interface VisionResult {
  detected_mood: string;
  confidence: number;
  recommendation: string;
}

interface WebcamFeedProps {
  apiUrl: string;
  onClose?: () => void;
}

export default function WebcamFeed({ apiUrl, onClose }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraOn(true);
      }
    } catch (err) {
      setError('Camera access denied or unavailable.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Capture Frame & Analyze
  const handleAnalyzeMood = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageB64 = canvas.toDataURL('image/jpeg');

    try {
      const res = await fetch(`${apiUrl}/api/v1/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: imageB64 })
      });

      if (!res.ok) throw new Error('Vision API error');
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Vision analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md max-w-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            Vision & Mood AI (Webcam HUD)
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Video Viewport */}
      <div className="relative h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {!isCameraOn && (
          <div className="flex flex-col items-center text-slate-600 text-xs font-mono gap-2">
            <CameraOff className="w-8 h-8" />
            <span>{error || 'Camera offline'}</span>
            <button onClick={startCamera} className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">
              Start Camera
            </button>
          </div>
        )}

        {/* Live HUD Overlay */}
        {isCameraOn && result && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 border border-pink-500/30 p-2.5 rounded-lg font-mono text-xs shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between text-pink-400 font-semibold text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> MOOD: {result.detected_mood.toUpperCase()}
              </span>
              <span>{(result.confidence * 100).toFixed(0)}% CONFIDENCE</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {result.recommendation}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={isCameraOn ? stopCamera : startCamera}
          className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5"
        >
          {isCameraOn ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          {isCameraOn ? 'Stop Stream' : 'Start Stream'}
        </button>

        <button
          onClick={handleAnalyzeMood}
          disabled={!isCameraOn || isAnalyzing}
          className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-pink-600/20 active:scale-95 disabled:opacity-50"
        >
          {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Mood'}
        </button>
      </div>
    </div>
  );
}
