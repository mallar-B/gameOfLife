import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const IterationCounterLabel = ({ num }: { num: number }) => {
  return (
    <div
      style={{
        position: "absolute",
        right: 10,
        bottom: 5,
        backgroundColor: "#EDE0D4AA",
        backdropFilter: "blur(10px)",
        color: "#7D6E64",
      }}
    >
      Iteration:{num}
    </div>
  );
};

const Button = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <button className="btn" onClick={onClick}>
      {children}
    </button>
  );
};

const Slider = ({
  label,
  value,
  min,
  max,
  step,
  setValue,
  reverse,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  setValue: (value: number) => void;
  reverse?: boolean;
  unit?: string;
}) => {
  return (
    <div className="slider-wrapper">
      <label
        style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
      >
        {label}
      </label>
      <input
        type="range"
        value={reverse ? max + min - value : value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const newValue = Number(e.target.value);
          setValue(reverse ? max + min - newValue : newValue);
        }}
        style={{
          width: "100%",
          appearance: "none",
          height: "6px",
          borderRadius: "3px",
          background: "#ccc",
          outline: "none",
          marginBottom: "10px",
          cursor: "pointer",
        }}
      />
      <span style={{ fontSize: "14px", color: "#555" }}>
        {value}
        {unit}
      </span>
    </div>
  );
};

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
  const isDrawing = useRef<boolean>(false);
  const drawnCellsRef = useRef<Set<string>>(new Set<string>());
  const runIterationRef = useRef<ReturnType<typeof setInterval>>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [iterationSpeed, setIterationSpeed] = useState<number>(425);
  const [iterationNumber, setIterationNumber] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

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
    setIterationNumber((n) => n + 1);
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

  const draw = useCallback(
    (event: MouseEvent) => {
      if (!isDrawing.current) return;

      const frame = canvasRef.current?.getBoundingClientRect();
      const x = Math.floor((event.clientX - frame!.left) / gridSize) * gridSize;
      const y = Math.floor((event.clientY - frame!.top) / gridSize) * gridSize;
      const gridX = Math.floor(x / gridSize); // col
      const gridY = Math.floor(y / gridSize); // row

      updteCell(gridX, gridY);
    },
    [gridSize],
  );

  const resetGrid = () => {
    setGrid(() => {
      const arr2d: Array<Array<number>> = [];
      for (let i = 0; i < rows; i++) {
        const row: Array<number> = [];
        for (let j = 0; j < cols; j++) {
          row.push(0);
        }
        arr2d.push(row);
      }
      return arr2d;
    });
    setIterationNumber(0);
  };

  // This useEffect make sure to draw instantly
  // This is the main drawing logic
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, cols * gridSize, rows * gridSize);
    ctx.fillStyle = "#7F5539";

    // Draw grid lines
    ctx.strokeStyle = "#7F5539";
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
          // console.log("black are", row, col);
          ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
        }
      }
    }
  }, [grid, gridSize, frameWidth, frameHeight, rows, cols]);

  useEffect(() => {
    if (isRunning) {
      runIterationRef.current = setInterval(() => {
        nextIteration();
      }, iterationSpeed);
    } else {
      if (runIterationRef.current) {
        clearInterval(runIterationRef.current);
        runIterationRef.current = null;
      }
    }
    return () => {
      if (runIterationRef.current) {
        clearInterval(runIterationRef.current);
      }
    };
  }, [isRunning, iterationSpeed, nextIteration]);

  useEffect(() => {
    setFrameWidth(window.innerWidth - 50); // compansate for padding of body
    setFrameHeight(window.innerHeight / 1.5);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseLeave = () => (isDrawing.current = false);
    const handleMouseUp = () => (isDrawing.current = false);
    const handleMouseDown = (event: MouseEvent) => {
      isDrawing.current = true;
      draw(event);
    };
    const handleMouseMove = (event: MouseEvent) => draw(event);

    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [draw]);

  return (
    <div className="container">
      <header style={{ textAlign: "center", margin: "1px" }}>
        <h1 style={{ margin: "2px" }}>Conway's Game of Life</h1>
        <p
          style={{
            fontStyle: "italic",
            fontSize: "0.9rem",
            color: "#555",
            margin: "5px",
            paddingBottom: "20px",
          }}
        >
          A zero-player game that evolves from your input
        </p>
      </header>
      <div className="grid-frame">
        <canvas
          ref={canvasRef}
          height={frameHeight}
          width={frameWidth}
          style={{ border: "1px solid black", backgroundColor: "#EDE0D4" }}
        />
        <IterationCounterLabel num={iterationNumber} />
      </div>
      <div className="hud">
        <div className="button-container">
          <Button onClick={nextIteration}>Next Iteration</Button>
          <Button onClick={() => setIsRunning((state) => !state)}>
            {isRunning ? "stop" : "start"}
          </Button>
          <Button onClick={resetGrid}>clear</Button>
          <div className="settings-wrapper">
            <Button onClick={() => setIsSettingsOpen((state) => !state)}>
              Settings
            </Button>
            {isSettingsOpen ? (
              <div className="sliders-container">
                <Slider
                  label="Grid Size"
                  value={gridSize}
                  min={5}
                  max={70}
                  step={1}
                  setValue={setGridSize}
                />
                <Slider
                  label="Iteration Speed"
                  value={iterationSpeed}
                  min={50}
                  max={1000}
                  step={10}
                  setValue={setIterationSpeed}
                  reverse={true}
                  unit="ms"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <footer
        style={{
          // position: "absolute",
          bottom: 0,
          textAlign: "center",
          marginTop: "1rem",
          fontSize: "0.9rem",
          color: "#777",
        }}
      >
        <p>
          Built by Mallar Bhattacharya with React & Typescript.{" "}
          <a
            href="https://github.com/mallar-B/gameOfLife"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
