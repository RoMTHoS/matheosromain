import { useState, useEffect, useCallback } from "react";

const useCanvasInteractions = (
  canvasRef,
  grid,
  setGrid,
  cellSize,
  cursorSize = 1
) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [initialState, setInitialState] = useState(null);

  const updateCells = useCallback(
    (centerX, centerY, initialState) => {
      if (!grid.length) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      const centerCol = Math.floor((centerX - rect.left) / cellSize);
      const centerRow = Math.floor((centerY - rect.top) / cellSize);

      const radius = Math.floor(cursorSize / 2);
      const newGrid = [...grid];

      // Update cells in a square pattern around the center
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const row = (centerRow + dy + grid.length) % grid.length;
          const col = (centerCol + dx + grid[0].length) % grid[0].length;

          // Only update if the cell matches the initial state
          if (grid[row][col] === initialState) {
            newGrid[row][col] = initialState === 1 ? 0 : 1;
          }
        }
      }

      setGrid(newGrid);
    },
    [grid, setGrid, cellSize, cursorSize]
  );

  const handleMove = useCallback(
    (x, y) => {
      if (!isInteracting || initialState === null) return;
      updateCells(x, y, initialState);
    },
    [isInteracting, initialState, updateCells]
  );

  const handleStart = useCallback(
    (x, y) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((x - rect.left) / cellSize);
      const row = Math.floor((y - rect.top) / cellSize);

      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
        setInitialState(grid[row][col]);
        setIsInteracting(true);
        updateCells(x, y, grid[row][col]);
      }
    },
    [grid, cellSize, updateCells]
  );

  const handleEnd = useCallback(() => {
    setIsInteracting(false);
    setInitialState(null);
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
