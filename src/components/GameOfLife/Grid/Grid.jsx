import { useEffect, useState, useRef, useCallback } from "react";
import useCanvasInteractions from "../../hooks/useCanvasInteractions";

export default function Grid({ grid, setGrid, cursorSize }) {
  const canvasRef = useRef(null);

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    cellSize: 0,
    columns: 0,
    rows: 0,
  });

  const [isInteracting] = useCanvasInteractions(
    canvasRef,
    grid,
    setGrid,
    dimensions.cellSize,
    cursorSize
  );

  // Calculate dimensions to exactly fit screen
  const calculateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Determine number of columns based on screen width
    let columns;
    if (width <= 480) {
      columns = 70;
    } else if (width <= 1024) {
      columns = 90;
    } else {
      columns = 180;
    }

    // Calculate exact cell size
    const cellSize = width / columns;

    // Calculate exact number of rows needed to cover screen height
    const rows = Math.ceil(height / cellSize);

    return {
      width,
      height,
      cellSize,
      columns,
      rows,
    };
  }, []);

  // Update dimensions
  const updateDimensions = useCallback(() => {
    const newDimensions = calculateDimensions();
    const canvas = canvasRef.current;

    // Set exact canvas dimensions based on cell size and grid dimensions
    canvas.width = newDimensions.cellSize * newDimensions.columns;
    canvas.height = newDimensions.cellSize * newDimensions.rows;

    setDimensions(newDimensions);
  }, [calculateDimensions]);

  // Initial and resize dimension updates
  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  // Initialize grid when dimensions change
  useEffect(() => {
    if (dimensions.columns > 0 && dimensions.rows > 0 && grid.length === 0) {
      const initialGrid = Array.from({ length: dimensions.rows }, () =>
        Array.from({ length: dimensions.columns }, () =>
          Math.random() > 0.5 ? 1 : 0
        )
      );
      setGrid(initialGrid);
    }
  }, [dimensions, grid.length, setGrid]);

  // Draw grid on canvas
  const drawGrid = useCallback(
    (grid) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const { cellSize } = dimensions;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          ctx.fillStyle = cell === 1 ? "#ffffffde" : "#242424";
          ctx.fillRect(
            colIndex * cellSize,
            rowIndex * cellSize,
            cellSize,
            cellSize
          );

          ctx.strokeStyle = cell === 1 ? "#242424" : "#ffffffde";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            colIndex * cellSize,
            rowIndex * cellSize,
            cellSize,
            cellSize
          );
        });
      });
    },
    [dimensions]
  );

  // Redraw grid when grid changes
  useEffect(() => {
    if (grid.length > 0) {
      drawGrid(grid);
    }
  }, [grid, drawGrid, isInteracting]);

  return (
    <div className="grid-container">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
