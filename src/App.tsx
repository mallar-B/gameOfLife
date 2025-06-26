import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [gridSize, setGridSize] = useState<number>(20);
  const [frameWidth, setFrameWidth] = useState<number>(0);
  const [frameHeight, setFrameHeight] = useState<number>(0);
  const [rows, setRows] = useState<number>(500);
  const [cols, setCols] = useState<number>(500);
  const [grid, setGrid] = useState<Array<Array<number>>>(() => {
    const arr2d: Array<Array<number>> = [];
    for (let i = 0; i < 500; i++) {
      const row: Array<number> = [];
      for (let j = 0; j < 500; j++) {
        row.push(0);
      }
      arr2d.push(row);
    }
    return arr2d;
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const drawnCellsRef = useRef(new Set<string>());

  const countNeighbours = useCallback(
    (tempGrid: Array<Array<number>>, row: number, col: number) => {
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const currRow = row + i;
          const currCol = col + j;
          if (
            currRow >= 0 &&
            currRow < rows &&
            currCol >= 0 &&
            currCol < cols &&
            !(i === 0 && j === 0)
          ) {
            count += tempGrid[currRow][currCol];
          }
        }
      }
      return count;
    },
    [rows, cols],
  );

  const nextIteration = useCallback(() => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]); // Deep copy is important
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const neighbourCount = countNeighbours(prevGrid, row, col);
          if (prevGrid[row][col] === 1) {
            if (neighbourCount < 2 || neighbourCount > 3) {
              newGrid[row][col] = 0;
            }
          } else {
            if (neighbourCount === 3) {
              newGrid[row][col] = 1;
            }
          }
        }
      }
      return newGrid;
    });
  }, [countNeighbours, rows, cols]);

  const updteCell = (col: number, row: number) => {
    const cellKey = `${row}-${col}`;
    if (drawnCellsRef.current.has(cellKey)) return;
    drawnCellsRef.current.add(cellKey);

    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      const newRow = [...newGrid[row]];
      newRow[col] = newRow[col] === 0 ? 1 : 0;
      newGrid[row] = newRow;
      return newGrid;
    });
  };

  const draw = (event: MouseEvent) => {
    if (!isDrawing.current) return;

    const frame = canvasRef.current?.getBoundingClientRect();
    const x = Math.floor((event.clientX - frame!.left) / gridSize) * gridSize;
    const y = Math.floor((event.clientY - frame!.top) / gridSize) * gridSize;
    const gridX = Math.floor(x / gridSize); // col
    const gridY = Math.floor(y / gridSize); // row

    updteCell(gridX, gridY);
  };

  // This useEffect make sure to draw instantly
  // This is the main drawing logic
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, cols * gridSize, rows * gridSize);

    // Draw grid lines
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= frameWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, frameHeight);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= frameHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(frameWidth, y);
      ctx.stroke();
    }

    // Draw each cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col] === 1) {
          console.log("black are", row, col);
          ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
        }
      }
    }
  }, [grid, frameWidth, frameHeight, rows, cols]);

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
    <div className="container">
      <div className="grid-frame">
        <canvas ref={canvasRef} height={frameHeight} width={frameWidth} />
      </div>
      <div className="button-container">
        <button>next step</button>
        <button>start</button>
        <button>clear</button>
      </div>
    </div>
  );
}

export default App;
