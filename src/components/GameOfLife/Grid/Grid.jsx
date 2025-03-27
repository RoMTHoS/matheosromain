import { useEffect, useState, useRef, useCallback } from "react";
import useCanvasInteractions from "../../hooks/useCanvasInteractions";

export default function Grid({ grid, setGrid, cursorSize }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
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

  // Calculate dimensions to exactly fit screen (horizontally) but allow more rows
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
      columns = 160;
    }

    // Calculate exact cell size based on width
    const cellSize = width / columns;

    // Calculate minimum rows needed to cover viewport height
    const minRows = Math.ceil(height / cellSize);

    // Use the larger of minRows or grid.length to determine actual rows
    // This ensures we don't shrink the grid if it has more rows than the viewport
    const rows = grid.length > minRows ? grid.length : minRows;

    return {
      width,
      viewportHeight: height,
      cellSize,
      columns,
      rows,
    };
  }, [grid.length]);

  // Update dimensions when window size changes
  const updateDimensions = useCallback(() => {
    const newDimensions = calculateDimensions();

    if (canvasRef.current) {
      // Always update canvas dimensions on resize for correct drawing
      canvasRef.current.width = newDimensions.cellSize * newDimensions.columns;
      canvasRef.current.height = newDimensions.cellSize * newDimensions.rows;

      // Update state dimensions
      setDimensions(newDimensions);
    }
  }, [calculateDimensions]);

  // Handle window resize specifically
  const handleResize = useCallback(() => {
    updateDimensions();

    // Redraw grid with new dimensions to maintain visual
    if (grid.length > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const { cellSize } = calculateDimensions();

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        grid.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            ctx.fillStyle = cell === 1 ? "#FFF" : "#151619";
            ctx.fillRect(
              colIndex * cellSize,
              rowIndex * cellSize,
              cellSize,
              cellSize
            );

            ctx.strokeStyle = cell === 1 ? "#151619" : "#FFF";
            ctx.lineWidth = 1;
            ctx.strokeRect(
              colIndex * cellSize,
              rowIndex * cellSize,
              cellSize,
              cellSize
            );
          });
        });
      }
    }
  }, [calculateDimensions, grid]);

  // Initial and resize dimension updates
  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateDimensions, handleResize]);

  // Update dimensions when grid size changes
  useEffect(() => {
    if (grid.length > 0) {
      updateDimensions();
    }
  }, [grid.length, updateDimensions]);

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
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const { cellSize } = dimensions;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          ctx.fillStyle = cell === 1 ? "#FFF" : "#151619";
          ctx.fillRect(
            colIndex * cellSize,
            rowIndex * cellSize,
            cellSize,
            cellSize
          );

          ctx.strokeStyle = cell === 1 ? "#151619" : "#FFF";
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
    if (grid.length > 0 && dimensions.cellSize > 0) {
      drawGrid(grid);
    }
  }, [grid, drawGrid, dimensions.cellSize]);

  return (
    <div className="grid-container" ref={containerRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
