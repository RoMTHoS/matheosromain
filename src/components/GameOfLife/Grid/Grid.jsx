// Updated Grid component with separated functions for resizing and drawing

import { useEffect, useState, useRef, useCallback } from "react";

export default function Grid({
  grid,
  setGrid,
  cursorSize,
  isGameRunning,
  setUiActivated,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [initialCellState, setInitialCellState] = useState(null);
  const [uiActive, setUiActive] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    cellSize: 0,
    columns: 0,
    rows: 0,
  });

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
      columns = 160;
    }

    // Calculate exact cell size based on width
    const cellSize = width / columns;

    // Calculate minimum rows needed to cover viewport height
    const minRows = Math.ceil(height / cellSize);

    // Use the larger of minRows or grid.length to determine actual rows
    const rows = grid.length > minRows ? grid.length : minRows;

    return {
      width,
      viewportHeight: height,
      cellSize,
      columns,
      rows,
    };
  }, [grid.length]);

  // Draw grid lines separately for better performance
  const drawGridLines = useCallback((ctx, width, height, cellSize) => {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;

    // Draw vertical lines
    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  // Draw the grid cells
  const drawGrid = useCallback(
    (grid) => {
      const canvas = canvasRef.current;
      if (!canvas || !grid.length) return;

      const ctx = canvas.getContext("2d");
      const { cellSize } = dimensions;
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = "#151619";
      ctx.fillRect(0, 0, width, height);

      // Draw alive cells
      ctx.fillStyle = "#FFF";
      grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === 1) {
            ctx.fillRect(
              colIndex * cellSize + 0.5,
              rowIndex * cellSize + 0.5,
              cellSize - 1,
              cellSize - 1
            );
          }
        });
      });

      // Draw grid lines
      drawGridLines(ctx, width, height, cellSize);
    },
    [dimensions, drawGridLines]
  );

  // SEPARATE FUNCTION: Update canvas dimensions on resize
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;

    const dims = calculateDimensions();
    const canvas = canvasRef.current;

    // Update canvas size
    canvas.width = dims.cellSize * dims.columns;
    canvas.height = dims.cellSize * dims.rows;

    // Update dimensions state only when it changes
    setDimensions((prevDimensions) => {
      if (
        prevDimensions.cellSize !== dims.cellSize ||
        prevDimensions.columns !== dims.columns ||
        prevDimensions.rows !== dims.rows ||
        prevDimensions.width !== dims.width ||
        prevDimensions.viewportHeight !== dims.viewportHeight
      ) {
        return dims;
      }
      return prevDimensions;
    });

    // Redraw grid
    if (grid.length > 0) {
      drawGrid(grid);
    }
  }, [calculateDimensions, drawGrid, grid]);

  // SEPARATE FUNCTION: Refresh the canvas with current grid data
  const refreshCanvas = useCallback(() => {
    if (!canvasRef.current || !grid.length) return;
    drawGrid(grid);
  }, [drawGrid, grid]);

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback(
    (x, y) => {
      if (!canvasRef.current) return { row: -1, col: -1 };

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const { cellSize } = dimensions;

      const col = Math.floor((x - rect.left) / cellSize);
      const row = Math.floor((y - rect.top) / cellSize);

      return { row, col };
    },
    [dimensions]
  );

  // Toggle cell state and redraw
  const toggleCell = useCallback(
    (row, col, state) => {
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length)
        return false;

      // Create a new grid with the toggled cell
      const newGrid = [...grid];

      // Only modify if it matches the initial state
      if (grid[row][col] === state) {
        newGrid[row][col] = state === 1 ? 0 : 1;
        setGrid(newGrid);

        // Redraw individual cell for better performance
        const ctx = canvasRef.current.getContext("2d");
        const { cellSize } = dimensions;

        ctx.fillStyle = newGrid[row][col] === 1 ? "#FFF" : "#151619";
        ctx.fillRect(
          col * cellSize + 0.5,
          row * cellSize + 0.5,
          cellSize - 1,
          cellSize - 1
        );

        // Redraw affected grid lines
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 0.5;

        ctx.beginPath();
        ctx.moveTo(col * cellSize, row * cellSize);
        ctx.lineTo((col + 1) * cellSize, row * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(col * cellSize, (row + 1) * cellSize);
        ctx.lineTo((col + 1) * cellSize, (row + 1) * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(col * cellSize, row * cellSize);
        ctx.lineTo(col * cellSize, (row + 1) * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((col + 1) * cellSize, row * cellSize);
        ctx.lineTo((col + 1) * cellSize, (row + 1) * cellSize);
        ctx.stroke();

        console.log(JSON.stringify(newGrid));
        return true;
      }

      return false;
    },
    [grid, setGrid, dimensions]
  );

  // Apply cursor with size
  const applyCursor = useCallback(
    (row, col, state) => {
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length)
        return;

      const radius = Math.floor(cursorSize / 2);
      let changed = false;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const r = row + dy;
          const c = col + dx;

          if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
            if (toggleCell(r, c, state)) {
              changed = true;
            }
          }
        }
      }

      return changed;
    },
    [grid, cursorSize, toggleCell]
  );

  // Handle mouse/touch start
  const handleStart = useCallback(
    (e) => {
      e.preventDefault();

      // If UI is not yet active, just activate UI and don't start drawing
      if (!uiActive) {
        setUiActive(true);
        setUiActivated(true); // This should be passed from parent component
        return;
      }

      const x = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
      const y = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;

      const { row, col } = screenToGrid(x, y);

      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
        const state = grid[row][col];
        setInitialCellState(state);
        setIsDrawing(true);
        setLastPos({ x, y });

        // Apply cursor
        applyCursor(row, col, state);
      }
    },
    [grid, screenToGrid, applyCursor, uiActive, setUiActivated]
  );

  // Draw line using Bresenham algorithm
  const drawLine = useCallback(
    (x0, y0, x1, y1, state) => {
      const { row: row0, col: col0 } = screenToGrid(x0, y0);
      const { row: row1, col: col1 } = screenToGrid(x1, y1);

      if (row0 < 0 || col0 < 0 || row1 < 0 || col1 < 0) return;

      let x = col0;
      let y = row0;

      const dx = Math.abs(col1 - col0);
      const dy = Math.abs(row1 - row0);
      const sx = col0 < col1 ? 1 : -1;
      const sy = row0 < row1 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        applyCursor(y, x, state);

        if (x === col1 && y === row1) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
    },
    [screenToGrid, applyCursor]
  );

  // Handle mouse/touch move
  const handleMove = useCallback(
    (e) => {
      if (!isDrawing || initialCellState === null || !lastPos) return;

      e.preventDefault();

      const x = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
      const y = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;

      // Draw line between last position and current position
      drawLine(lastPos.x, lastPos.y, x, y, initialCellState);

      // Update last position
      setLastPos({ x, y });
    },
    [isDrawing, initialCellState, lastPos, drawLine]
  );

  // Handle mouse/touch end
  const handleEnd = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  // Initialize canvas and event listeners for resizing
  useEffect(() => {
    handleResize(); // Initial setup

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Set up event listeners for drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd);

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);

      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Refresh canvas when grid changes
  useEffect(() => {
    if (grid.length > 0 && dimensions.cellSize > 0) {
      refreshCanvas();
    }
  }, [grid, refreshCanvas, dimensions.cellSize]);

  // Specifically refresh when dimensions change
  useEffect(() => {
    if (grid.length > 0 && dimensions.cellSize > 0) {
      refreshCanvas();
    }
  }, [dimensions, refreshCanvas, grid]);

  return (
    <div className="grid-container" ref={containerRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
