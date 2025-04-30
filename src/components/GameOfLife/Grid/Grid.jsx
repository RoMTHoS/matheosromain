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

  // Add icon tracking state - store bounds of each icon
  const [iconBounds, setIconBounds] = useState({
    github: { x1: 0, y1: 0, x2: 0, y2: 0 },
    linkedin: { x1: 0, y1: 0, x2: 0, y2: 0 },
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
      columns = 80;
    } else if (width <= 1024) {
      columns = 130;
    } else {
      columns = 370;
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

  // Track the marker corners for each icon and update their bounds
  const updateIconBoundsFromMarkers = useCallback((grid, cellSize) => {
    if (!grid || grid.length === 0) return;

    // Temporary storage for markers
    const githubMarkers = [];
    const linkedinMarkers = [];

    // Scan the grid for markers (3 for GitHub, 4 for LinkedIn)
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
      const row = grid[rowIndex];
      if (!row) continue;

      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        if (row[colIndex] === 3) {
          // Found a GitHub marker
          githubMarkers.push({
            x: colIndex * cellSize,
            y: rowIndex * cellSize,
          });
        } else if (row[colIndex] === 4) {
          // Found a LinkedIn marker
          linkedinMarkers.push({
            x: colIndex * cellSize,
            y: rowIndex * cellSize,
          });
        }
      }
    }

    // If we found all GitHub markers (should be 4 corners)
    if (githubMarkers.length >= 2) {
      // Find the min/max coordinates to get the bounding box
      const xValues = githubMarkers.map((marker) => marker.x);
      const yValues = githubMarkers.map((marker) => marker.y);

      const x1 = Math.min(...xValues);
      const y1 = Math.min(...yValues);
      const x2 = Math.max(...xValues);
      const y2 = Math.max(...yValues);

      // Update GitHub bounds
      setIconBounds((prev) => ({
        ...prev,
        github: { x1, y1, x2, y2 },
      }));
    }

    // If we found all LinkedIn markers (should be 4 corners)
    if (linkedinMarkers.length >= 2) {
      // Find the min/max coordinates to get the bounding box
      const xValues = linkedinMarkers.map((marker) => marker.x);
      const yValues = linkedinMarkers.map((marker) => marker.y);

      const x1 = Math.min(...xValues);
      const y1 = Math.min(...yValues);
      const x2 = Math.max(...xValues);
      const y2 = Math.max(...yValues);

      // Update LinkedIn bounds
      setIconBounds((prev) => ({
        ...prev,
        linkedin: { x1, y1, x2, y2 },
      }));
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

      // Draw cells based on their values
      grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === 1) {
            ctx.fillStyle = "#FFF";
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

      // Update icon bounds based on markers in the grid
      updateIconBoundsFromMarkers(grid, cellSize);

      // Debug visualization - uncomment to see bounding boxes
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        iconBounds.github.x1,
        iconBounds.github.y1,
        iconBounds.github.x2 - iconBounds.github.x1,
        iconBounds.github.y2 - iconBounds.github.y1
      );
      ctx.strokeStyle = "blue";
      ctx.strokeRect(
        iconBounds.linkedin.x1,
        iconBounds.linkedin.y1,
        iconBounds.linkedin.x2 - iconBounds.linkedin.x1,
        iconBounds.linkedin.y2 - iconBounds.linkedin.y1
      );
    },
    [dimensions, drawGridLines, updateIconBoundsFromMarkers]
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

  // Check if a point is within an icon area
  const isPointInIcon = useCallback(
    (x, y) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const canvasX = x - rect.left;
      const canvasY = y - rect.top;

      // Check if point is within GitHub icon bounds
      if (
        canvasX >= iconBounds.github.x1 &&
        canvasX <= iconBounds.github.x2 &&
        canvasY >= iconBounds.github.y1 &&
        canvasY <= iconBounds.github.y2
      ) {
        return "github";
      }

      // Check if point is within LinkedIn icon bounds
      if (
        canvasX >= iconBounds.linkedin.x1 &&
        canvasX <= iconBounds.linkedin.x2 &&
        canvasY >= iconBounds.linkedin.y1 &&
        canvasY <= iconBounds.linkedin.y2
      ) {
        return "linkedin";
      }

      return null;
    },
    [iconBounds]
  );

  // Handle icon click
  const handleIconClick = useCallback((iconName) => {
    if (iconName === "github") {
      window.open("https://github.com/RoMTHoS", "_blank");
      console.log("GitHub icon clicked!");
    } else if (iconName === "linkedin") {
      window.open(
        "https://www.linkedin.com/in/romain-matheos-12153616b/",
        "_blank"
      );
      console.log("LinkedIn icon clicked!");
    }
  }, []);

  // Toggle cell state and redraw
  const toggleCell = useCallback(
    (row, col, state) => {
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length)
        return false;

      // Create a new grid with the toggled cell
      const newGrid = [...grid];

      // Don't toggle marker cells (3 and 4)
      if (grid[row][col] === 3 || grid[row][col] === 4) {
        return false;
      }

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
      // IMPORTANT: First check if click/touch is on an icon - BEFORE UI activation
      const clickedIcon = isPointInIcon(clientX, clientY);
      if (clickedIcon) {
        handleIconClick(clickedIcon);
        // Prevent further processing and don't activate UI if it was a click on an icon
        return;
      }

      // If not on an icon, now we can handle UI activation
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
        // Don't allow drawing on marker cells (3 and 4)
        if (grid[row][col] === 3 || grid[row][col] === 4) {
          return;
        }

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
      isPointInIcon,
      handleIconClick,
    ]
  );

  // Mouse down handler
  const handleMouseDown = useCallback(
    (e) => {
      // Prevent default regardless to ensure proper handling
      e.preventDefault();

      // All click handling is in handleInteractionStart
      handleInteractionStart(e.clientX, e.clientY, false);

      // Reset any auto-hide timer to keep UI visible during interaction
      // (but only if the UI is actually active - don't interfere with icon clicks)
      if (uiActive && !isGameRunning) {
        setupUiAutoHide();
      }
    },
    [handleInteractionStart, uiActive, isGameRunning, setupUiAutoHide]
  );

  // Touch start handler
  const handleTouchStart = useCallback(
    (e) => {
      const touch = e.touches[0];

      // IMPORTANT: Check for icon touch FIRST, before any other processing
      const clickedIcon = isPointInIcon(touch.clientX, touch.clientY);
      if (clickedIcon) {
        // Cancel the event to prevent any default behavior
        e.preventDefault();
        handleIconClick(clickedIcon);
        return;
      }

      // Now handle normal touch behavior
      // Only handle touch if UI is active, otherwise allow default behavior (scrolling)
      if (!uiActive) {
        // We'll still activate the UI but allow default scrolling
        setUiActive(true);
        setUiActivated(true);

        // Start auto-hide timer
        if (!isGameRunning) {
          setupUiAutoHide();
        }
        return;
      }

      // Prevent default for touch events when UI is active or game is running
      if (uiActive || isGameRunning) {
        e.preventDefault();

        // Store touch start time for potential tap vs. scroll detection
        setTouchStartTime(Date.now());

        // Process the touch for drawing
        handleInteractionStart(touch.clientX, touch.clientY, true);

        // Reset auto-hide timer to keep UI visible
        if (!isGameRunning) {
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
      isPointInIcon,
      handleIconClick,
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
    if (uiActive && !isGameRunning) {
      setupUiAutoHide();
    }
  }, [uiActive, isGameRunning, setupUiAutoHide]);

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

    // Always set up touch events with passive: false to ensure we can prevent default
    // for icon clicks even on first interaction
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });

    // For touch move, we can be more selective
    if (uiActive || isGameRunning) {
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    } else {
      // Allow default scrolling behavior when not drawing
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
