"use client";

import React, { useRef, useEffect, useState } from "react";

interface ScratchCardProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  onComplete?: () => void;
  coverColor?: string;
  brushSize?: number;
  finishPercent?: number;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  children,
  width = 300,
  height = 300,
  onComplete,
  coverColor = "#e64c19",
  brushSize = 30,
  finishPercent = 50,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize cover
    ctx.fillStyle = coverColor;
    ctx.fillRect(0, 0, width, height);

    // Add some "scratch here" text
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH TO REVEAL ✨", width / 2, height / 2);
  }, [coverColor, width, height]);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isFinished) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getPosition(e);

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();

    checkProgress();
  };

  const checkProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentCount = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentCount++;
    }

    const percent = (transparentCount / (width * height)) * 100;
    if (percent > finishPercent) {
      setIsFinished(true);
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="relative" style={{ width, height }}>
      <div className="absolute inset-0 flex items-center justify-center p-6 bg-white dark:bg-white/5 overflow-y-auto">
        {children}
      </div>
      {!isFinished && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseMove={draw}
          onTouchStart={() => setIsDrawing(true)}
          onTouchEnd={() => setIsDrawing(false)}
          onTouchMove={draw}
          className="absolute inset-0 cursor-crosshair touch-none"
        />
      )}
    </div>
  );
};
