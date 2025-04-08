import { useEffect, useState, useRef, useCallback } from "react";
import "./Grid.css";

export default function Grid({
  grid,
  setGrid,
  cursorSize,
  isGameRunning,
  setUiActivated,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const uiHideTimeoutRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [initialCellState, setInitialCellState] = useState(null);
  const [uiActive, setUiActive] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    cellSize: 0,
    columns: 0,
    rows: 0,
  });

  // Auto-hide UI after 2 seconds if game is not running
  const setupUiAutoHide = useCallback(() => {
    // Clear any existing timeout
    if (uiHideTimeoutRef.current) {
      clearTimeout(uiHideTimeoutRef.current);
      uiHideTimeoutRef.current = null;
    }

    // If game is running, don't auto-hide
    if (isGameRunning) {
      setUiActive(true);
      setUiActivated(true);
      return;
    }

    // Set timeout to hide UI after 2 seconds
    uiHideTimeoutRef.current = setTimeout(() => {
      setUiActive(false);
      setUiActivated(false);
    }, 2000);
  }, [isGameRunning, setUiActivated]);

  // When game running state changes, update UI visibility
  useEffect(() => {
    if (isGameRunning) {
      // If game starts running, ensure UI is visible and stays visible
      setUiActive(true);
      setUiActivated(true);

      // Clear any auto-hide timeout
      if (uiHideTimeoutRef.current) {
        clearTimeout(uiHideTimeoutRef.current);
        uiHideTimeoutRef.current = null;
      }
    } else {
      // If game stops, start the auto-hide timer
      setupUiAutoHide();
    }
  }, [isGameRunning, setupUiAutoHide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (uiHideTimeoutRef.current) {
        clearTimeout(uiHideTimeoutRef.current);
      }
    };
  }, []);

  // Calculate dimensions to exactly fit screen
  const calculateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Determine number of columns based on screen width
    let columns;
    if (width <= 480) {
      columns = 70;
    } else if (width <= 1024) {
      columns = 100;
    } else {
      columns = 250;
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

  // Unified interaction start handler
  const handleInteractionStart = useCallback(
    (clientX, clientY, isTouch = false) => {
      // Always show UI on first interaction and start auto-hide timer
      if (!uiActive) {
        setUiActive(true);
        setUiActivated(true);

        // Start auto-hide timer if game is not running
        if (!isGameRunning) {
          setupUiAutoHide();
        }

        // Don't start drawing on the first interaction
        return;
      }

      // If we're here, UI is already active, so we can start drawing
      const { row, col } = screenToGrid(clientX, clientY);

      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
        const state = grid[row][col];
        setInitialCellState(state);
        setIsDrawing(true);
        setLastPos({ x: clientX, y: clientY });

        // Apply cursor
        applyCursor(row, col, state);
      }
    },
    [
      grid,
      screenToGrid,
      applyCursor,
      uiActive,
      isGameRunning,
      setupUiAutoHide,
      setUiActivated,
    ]
  );

  // Mouse down handler
  const handleMouseDown = useCallback(
    (e) => {
      // Reset any auto-hide timer to keep UI visible during interaction
      if (!isGameRunning) {
        setupUiAutoHide();
      }

      // Only prevent default for mouse events or when UI is active
      e.preventDefault();
      handleInteractionStart(e.clientX, e.clientY, false);
    },
    [handleInteractionStart, isGameRunning, setupUiAutoHide]
  );

  // Touch start handler
  const handleTouchStart = useCallback(
    (e) => {
      // Only handle touch move if we're drawing
      if (!uiActive) {
        // If not drawing, allow default behavior (scrolling)
        return;
      }
      // Reset any auto-hide timer to keep UI visible during interaction
      if (!isGameRunning) {
        setupUiAutoHide();
      }

      // Store touch start time for differentiating between tap and scroll
      setTouchStartTime(Date.now());

      // For touch events, only prevent default if UI is active or game is running
      if (uiActive || isGameRunning) {
        e.preventDefault();

        const touch = e.touches[0];
        handleInteractionStart(touch.clientX, touch.clientY, true);
      } else {
        // Don't prevent default to allow scrolling when UI is not active
        // and game is not running, but still show UI
        if (!uiActive) {
          setUiActive(true);
          setUiActivated(true);

          // Start auto-hide timer
          setupUiAutoHide();
        }
      }
    },
    [
      handleInteractionStart,
      uiActive,
      isGameRunning,
      setUiActivated,
      setupUiAutoHide,
    ]
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing || initialCellState === null || !lastPos) return;

      // Keep UI visible during drawing if game is not running
      if (!isGameRunning) {
        setupUiAutoHide();
      }

      e.preventDefault();

      // Draw line between last position and current position
      drawLine(lastPos.x, lastPos.y, e.clientX, e.clientY, initialCellState);

      // Update last position
      setLastPos({ x: e.clientX, y: e.clientY });
    },
    [
      isDrawing,
      initialCellState,
      lastPos,
      drawLine,
      isGameRunning,
      setupUiAutoHide,
    ]
  );

  // Touch move handler
  const handleTouchMove = useCallback(
    (e) => {
      // Only handle touch move if we're drawing
      if (!isDrawing || initialCellState === null || !lastPos) {
        // If not drawing, allow default behavior (scrolling)
        return;
      }

      // Keep UI visible during drawing if game is not running
      if (!isGameRunning) {
        setupUiAutoHide();
      }

      // We're drawing, so prevent scrolling
      e.preventDefault();

      const touch = e.touches[0];

      // Draw line between last position and current position
      drawLine(
        lastPos.x,
        lastPos.y,
        touch.clientX,
        touch.clientY,
        initialCellState
      );

      // Update last position
      setLastPos({ x: touch.clientX, y: touch.clientY });
    },
    [
      isDrawing,
      initialCellState,
      lastPos,
      drawLine,
      isGameRunning,
      setupUiAutoHide,
    ]
  );

  // Handle end events
  const handleInteractionEnd = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
    setInitialCellState(null);
    setTouchStartTime(null);

    // Start auto-hide timer if game is not running
    if (!isGameRunning) {
      setupUiAutoHide();
    }
  }, [isGameRunning, setupUiAutoHide]);

  // Initialize canvas and event listeners for resizing
  useEffect(() => {
    handleResize(); // Initial setup

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Set up event listeners for interaction based on game state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Always set up mouse events the same way
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleInteractionEnd);

    // First remove any existing touch listeners to avoid duplicates
    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchmove", handleTouchMove);
    canvas.removeEventListener("touchend", handleInteractionEnd);

    // Then add touch listeners with different passive settings based on state
    // When UI is active or game is running, we want to control touch behavior
    if (uiActive || isGameRunning) {
      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    } else {
      // Otherwise, allow default scrolling behavior
      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    }
    canvas.addEventListener("touchend", handleInteractionEnd);

    return () => {
      // Cleanup
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleInteractionEnd);

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleInteractionEnd);
    };
  }, [
    handleMouseDown,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleInteractionEnd,
    uiActive,
    isGameRunning,
  ]);

  // Refresh canvas when grid changes
  useEffect(() => {
    if (grid.length > 0 && dimensions.cellSize > 0) {
      refreshCanvas();
    }
  }, [grid, refreshCanvas, dimensions.cellSize]);

  return (
    <div className="grid-container" ref={containerRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
