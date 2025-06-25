import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [gridSize, setGridSize] = useState<number>(20);
  const [frameWidth, setFrameWidth] = useState<number>(0);
  const [frameHeight, setFrameHeight] = useState<number>(0);
  const [rows, setRows] = useState<number>(0);
  const [cols, setCols] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);


  const draw = (event: MouseEvent) => {
    if (!isDrawing.current) return;

    const ctx = canvasRef.current?.getContext("2d");
    const frame = canvasRef.current?.getBoundingClientRect();
    const x = Math.floor((event.clientX - frame!.left) / gridSize) * gridSize;
    const y = Math.floor((event.clientY - frame!.top) / gridSize) * gridSize;

    ctx?.fillRect(x, y, gridSize, gridSize);
  };

  useEffect(() => {
    setFrameWidth(window.innerWidth - 50); // compansate for padding of body
    setFrameHeight(window.innerHeight / 2);
  }, []);

  useEffect(() => {
    canvasRef.current?.addEventListener(
      "mouseleave",
      () => (isDrawing.current = false),
    );
    canvasRef.current?.addEventListener(
      "mouseup",
      () => (isDrawing.current = false),
    );

    canvasRef.current?.addEventListener("mousedown", (event) => {
      isDrawing.current = true;
      draw(event);
    });
    canvasRef.current?.addEventListener("mousemove", (event) => draw(event));

    return () => {
      canvasRef.current?.removeEventListener(
        "mouseleave",
        () => (isDrawing.current = false),
      );
      canvasRef.current?.removeEventListener(
        "mouseup",
        () => (isDrawing.current = false),
      );
      canvasRef.current?.removeEventListener("mousedown", (event) => {
        isDrawing.current = true;
        draw(event);
      });
      canvasRef.current?.removeEventListener("mousemove", (event) =>
        draw(event),
      );
    };
  }, []);

  return (
    <div className="grid-frame">
      <canvas ref={canvasRef} height={frameHeight} width={frameWidth} />
    </div>
  );
}

export default App;
