import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Grid from "./Grid/Grid";
import GameControls from "./GameControls/GameControls";
import GameInfo from "./GameInfo/GameInfo";
import Modal from "./Modal/Modal";
import GameSettings from "./Modal/GameSettings/GameSettings";
import patterns from "../../utils/golPatterns.json";
import devicePatterns from "../../utils/devicePatterns.json";
import "./GameOfLife.css";

export default function GameOfLife() {
  const [grid, setGrid] = useState([]);
  const [cursorSize, setCursorSize] = useState(1);
  const [initialGrid, setInitialGrid] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [showImageProcessor, setShowImageProcessor] = useState(false);
  const [dimensions, setDimensions] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimeoutRef = useRef(null);
  const simulationRef = useRef(null);

  // Memoize the calculation of grid dimensions
  const calculateDimensions = useMemo(() => {
    return () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let columns;
      if (width <= 480) {
        columns = 70;
      } else if (width <= 1024) {
        columns = 90;
      } else {
        columns = 160;
      }

      const cellSize = width / columns;
      const rows = Math.ceil(height / cellSize);

      return { columns, rows, cellSize };
    };
  }, []);

  // Create an empty grid
  const createEmptyGrid = useCallback(() => {
    const { columns, rows } = calculateDimensions();
    return Array(rows)
      .fill()
      .map(() => Array(columns).fill(0));
  }, [calculateDimensions]);

  // Load specific pattern
  const loadPattern = useCallback(
    (patternNameOrArray) => {
      const { columns, rows } = calculateDimensions();
      let pattern;

      // Determine the pattern source
      if (Array.isArray(patternNameOrArray)) {
        // Direct pattern array
        pattern = patternNameOrArray;
      } else {
        // Pattern name from configuration
        pattern =
          devicePatterns[patternNameOrArray] || patterns[patternNameOrArray];

        // If pattern not found, return empty grid
        if (!pattern) {
          return setGrid(createEmptyGrid());
        }
      }

      // Calculate pattern dimensions
      const patternRows = pattern.length;
      const patternCols = pattern[0].length;

      // Ensure we have enough rows for the pattern
      const neededRows = Math.max(rows, patternRows + 10); // Add padding

      // Create empty grid with needed dimensions
      const emptyGrid = Array(neededRows)
        .fill()
        .map(() => Array(columns).fill(0));

      // Calculate center positions for the pattern
      const startRow = Math.floor((neededRows - patternRows) / 2);
      const startCol = Math.floor((columns - patternCols) / 2);

      // Place the pattern in the center of the grid
      for (let row = 0; row < patternRows; row++) {
        for (let col = 0; col < patternCols; col++) {
          const gridRow = (startRow + row + neededRows) % neededRows;
          const gridCol = (startCol + col + columns) % columns;
          emptyGrid[gridRow][gridCol] = pattern[row][col];
        }
      }

      // Update grid state
      setGrid(emptyGrid);
      setInitialGrid(emptyGrid);
      setGeneration(0);
      setIsRunning(false);
    },
    [calculateDimensions, createEmptyGrid]
  );

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const newDimensions = calculateDimensions();
      setDimensions(newDimensions);

      // Determine pattern based on screen size
      const patternName =
        window.innerWidth <= 480
          ? "mobile"
          : window.innerWidth <= 1024
          ? "tablet"
          : "desktop";

      loadPattern(patternName);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateDimensions, loadPattern]);

  // Optimized computeNextGrid function with memoization of neighbors
  const computeNextGrid = useCallback((currentGrid) => {
    if (!currentGrid.length) return currentGrid;

    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    let hasChanges = false;

    // Create a new grid only if changes are detected
    const newGrid = Array(rows)
      .fill()
      .map(() => Array(cols).fill(0));

    // Process each cell in the grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Calculate neighbor count
        let neighbors = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;

            const newRow = (row + dx + rows) % rows;
            const newCol = (col + dy + cols) % cols;
            neighbors += currentGrid[newRow][newCol];
          }
        }

        // Determine new state based on Game of Life rules
        const currentState = currentGrid[row][col];
        const newState =
          currentState === 1
            ? neighbors === 2 || neighbors === 3
              ? 1
              : 0
            : neighbors === 3
            ? 1
            : 0;

        // Set the new state
        newGrid[row][col] = newState;

        // Check if the state has changed
        if (newState !== currentState) {
          hasChanges = true;
        }
      }
    }

    // Return the new grid only if changes were made
    return hasChanges ? newGrid : currentGrid;
  }, []);

  // Use requestAnimationFrame for more efficient simulation
  useEffect(() => {
    let animationFrameId = null;
    let lastUpdateTime = 0;
    const simulationSpeed = 200; // ms between updates

    const runSimulation = (timestamp) => {
      // Only update if enough time has passed
      if (timestamp - lastUpdateTime >= simulationSpeed) {
        setGrid((prevGrid) => {
          const nextGrid = computeNextGrid(prevGrid);
          setGeneration((prev) => prev + 1);
          return nextGrid;
        });
        lastUpdateTime = timestamp;
      }

      // Schedule next frame
      animationFrameId = requestAnimationFrame(runSimulation);
    };

    if (isRunning) {
      // Start the simulation loop
      animationFrameId = requestAnimationFrame(runSimulation);
    }

    return () => {
      // Clean up
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning, computeNextGrid]);

  // Toggle isRunning state
  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Function to update state when grid is modified
  const handleGridChange = useCallback(
    (newGrid) => {
      setGrid(newGrid);
      if (generation === 0) {
        setInitialGrid(newGrid);
      }
    },
    [generation]
  );

  // Function to reload the grid before the game started
  const reloadInitialGrid = useCallback(() => {
    setGrid(initialGrid);
    setGeneration(0);
    setIsRunning(false);
  }, [initialGrid]);

  // Function to update state when an image is uploaded
  const handleImageProcessed = useCallback((processedGrid) => {
    setGrid(processedGrid);
    setInitialGrid(processedGrid);
    setShowImageProcessor(false);
    setGeneration(0);
    setIsRunning(false);
  }, []);

  // Function to clear the grid
  const resetGame = useCallback(() => {
    const emptyGrid = createEmptyGrid();
    setGrid(emptyGrid);
    setInitialGrid(emptyGrid);
    setGeneration(0);
    setIsRunning(false);
  }, [createEmptyGrid]);

  // Add handleCursorSizeChange function
  const handleCursorSizeChange = useCallback((newSize) => {
    setCursorSize(Math.max(1, newSize)); // Ensure size is at least 1
  }, []);

  // Function to handle click/touch on the container
  const handleContainerClick = useCallback(() => {
    // Show controls
    setControlsVisible(true);

    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Set timeout to hide controls after 2 seconds
    hideTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="game-container"
      onClick={handleContainerClick}
      onTouchStart={handleContainerClick}
    >
      <div className={`game-ui ${controlsVisible ? "visible" : "hidden"}`}>
        <GameInfo generation={generation} />
        <GameControls
          isRunning={isRunning}
          onToggleRun={toggleRunning}
          onReset={resetGame}
          onReload={reloadInitialGrid}
          generation={generation}
          onOpenSettings={() => setShowSettings(true)}
          cursorSize={cursorSize}
          onCursorSizeChange={setCursorSize}
        />
      </div>

      <Grid grid={grid} setGrid={handleGridChange} cursorSize={cursorSize} />

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)}>
        <GameSettings
          onImageProcessed={(processedGrid) => {
            handleImageProcessed(processedGrid);
            setShowSettings(false);
          }}
          cursorSize={cursorSize}
          onCursorSizeChange={handleCursorSizeChange}
          gridColumns={grid[0]?.length || 0}
          gridRows={grid.length || 0}
          patterns={Object.keys(patterns)}
          onPatternSelect={loadPattern}
        />
      </Modal>
    </div>
  );
}
