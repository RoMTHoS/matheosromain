import { useState, useEffect, useCallback, useRef } from "react";

const useCanvasInteractions = (
  canvasRef,
  grid,
  setGrid,
  cellSize,
  cursorSize = 1
) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [initialState, setInitialState] = useState(null);
  const lastPositionRef = useRef(null);

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback(
    (x, y) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((x - rect.left) / cellSize);
      const row = Math.floor((y - rect.top) / cellSize);
      return { row, col };
    },
    [cellSize]
  );

  // Bresenham's line algorithm for grid cells
  const drawLine = useCallback(
    (x0, y0, x1, y1, state) => {
      // Convert screen coordinates to grid coordinates
      const startPos = screenToGrid(x0, y0);
      const endPos = screenToGrid(x1, y1);

      let { row: y0Grid, col: x0Grid } = startPos;
      let { row: y1Grid, col: x1Grid } = endPos;

      // Track modified cells and rows
      const cellUpdates = [];

      // Bresenham's algorithm
      const dx = Math.abs(x1Grid - x0Grid);
      const dy = Math.abs(y1Grid - y0Grid);
      const sx = x0Grid < x1Grid ? 1 : -1;
      const sy = y0Grid < y1Grid ? 1 : -1;
      let err = dx - dy;

      while (true) {
        // Apply cursor size at this position
        const radius = Math.floor(cursorSize / 2);

        // Update cells in a square pattern around the center
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const row = (y0Grid + dy + grid.length) % grid.length;
            const col = (x0Grid + dx + grid[0].length) % grid[0].length;

            // Only update if the cell matches the initial state
            if (grid[row][col] === state) {
              cellUpdates.push({
                row,
                col,
                value: state === 1 ? 0 : 1,
              });
            }
          }
        }

        // Break if we've reached the end point
        if (x0Grid === x1Grid && y0Grid === y1Grid) break;

        // Calculate next position
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0Grid += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0Grid += sy;
        }
      }

      // Apply batch updates with efficient row copying
      if (cellUpdates.length > 0) {
        setGrid((prevGrid) => {
          const newGrid = [...prevGrid];
          const rowsCopied = new Set();

          cellUpdates.forEach(({ row, col, value }) => {
            // Only copy each row once
            if (!rowsCopied.has(row)) {
              newGrid[row] = [...prevGrid[row]];
              rowsCopied.add(row);
            }
            newGrid[row][col] = value;
          });

          return newGrid;
        });
      }

      return cellUpdates.length > 0;
    },
    [grid, setGrid, cursorSize, screenToGrid]
  );

  const handleMove = useCallback(
    (x, y) => {
      if (!isInteracting || initialState === null || !lastPositionRef.current)
        return;

      // Use Bresenham's algorithm to draw a line between points
      drawLine(
        lastPositionRef.current.x,
        lastPositionRef.current.y,
        x,
        y,
        initialState
      );

      lastPositionRef.current = { x, y };
    },
    [isInteracting, initialState, drawLine]
  );

  const handleStart = useCallback(
    (x, y) => {
      const { row, col } = screenToGrid(x, y);

      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
        const state = grid[row][col];
        setInitialState(state);
        setIsInteracting(true);
        lastPositionRef.current = { x, y };

        // Apply at the start position
        const radius = Math.floor(cursorSize / 2);
        const cellUpdates = [];

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const r = (row + dy + grid.length) % grid.length;
            const c = (col + dx + grid[0].length) % grid[0].length;

            if (grid[r][c] === state) {
              cellUpdates.push({
                row: r,
                col: c,
                value: state === 1 ? 0 : 1,
              });
            }
          }
        }

        if (cellUpdates.length > 0) {
          setGrid((prevGrid) => {
            const newGrid = [...prevGrid];
            const rowsCopied = new Set();

            cellUpdates.forEach(({ row, col, value }) => {
              if (!rowsCopied.has(row)) {
                newGrid[row] = [...prevGrid[row]];
                rowsCopied.add(row);
              }
              newGrid[row][col] = value;
            });

            return newGrid;
          });
        }
      }
    },
    [grid, setGrid, cursorSize, screenToGrid]
  );

  const handleEnd = useCallback(() => {
    setIsInteracting(false);
    setInitialState(null);
    lastPositionRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse events
    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleMouseDown = (e) => handleStart(e.clientX, e.clientY);
    const handleMouseUp = handleEnd;

    // Touch events
    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };
    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = handleEnd;

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleMove, handleStart, handleEnd]);

  return [isInteracting, setIsInteracting];
};

export default useCanvasInteractions;
