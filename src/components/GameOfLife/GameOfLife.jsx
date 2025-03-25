import { useState, useEffect, useCallback, useRef } from "react";
import Grid from "./Grid/Grid";
import GameControls from "./GameControls/GameControls";
import GameInfo from "./GameInfo/GameInfo";
import Modal from "./Modal/Modal";
import GameSettings from "./Modal/GameSettings/GameSettings";
import patterns from "../../utils/golPatterns.json"; // Import patterns configuration
import devicePatterns from "../../utils/devicePatterns.json"; // Import patterns configuration
import "./GameOfLife.css"; // Make sure to create this CSS file

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

  // Calculate grid dimensions
  const calculateDimensions = useCallback(() => {
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
  }, []);

  // Get empty grid with correct dimensions
  const getEmptyGrid = useCallback(() => {
    const { columns, rows } = calculateDimensions();
    return Array(rows)
      .fill()
      .map(() => Array(columns).fill(0));
  }, [calculateDimensions]);

  // Load a pattern and center it on the grid
  const loadCenteredPattern = useCallback(
    (patternName) => {
      const { columns, rows } = calculateDimensions();
      const emptyGrid = Array(rows)
        .fill()
        .map(() => Array(columns).fill(0));

      // Get the pattern from patterns configuration
      const pattern = devicePatterns[patternName];
      if (!pattern) return emptyGrid;

      // Calculate center positions
      const patternRows = pattern.length;
      const patternCols = pattern[0].length;

      const startRow = Math.floor((rows - patternRows) / 2);
      const startCol = Math.floor((columns - patternCols) / 2);

      // Place the pattern in the center of the grid
      for (let row = 0; row < patternRows; row++) {
        for (let col = 0; col < patternCols; col++) {
          const gridRow = (startRow + row + rows) % rows;
          const gridCol = (startCol + col + columns) % columns;
          emptyGrid[gridRow][gridCol] = pattern[row][col];
        }
      }

      return emptyGrid;
    },
    [calculateDimensions]
  );

  // useEffect to handle screen resize
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

      // Load the centered pattern
      const newGrid = loadCenteredPattern(patternName);

      setGrid(newGrid);
      setInitialGrid(newGrid);
      setGeneration(0);
      setIsRunning(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateDimensions, loadCenteredPattern]);

  // Load specific pattern (string name or direct pattern array)
  const loadPattern = useCallback(
    (patternNameOrArray) => {
      let newGrid;

      if (Array.isArray(patternNameOrArray)) {
        // If an array is passed directly, use it as the pattern
        const pattern = patternNameOrArray;
        const { columns, rows } = calculateDimensions();
        const emptyGrid = Array(rows)
          .fill()
          .map(() => Array(columns).fill(0));

        // Calculate center positions
        const patternRows = pattern.length;
        const patternCols = pattern[0].length;

        const startRow = Math.floor((rows - patternRows) / 2);
        const startCol = Math.floor((columns - patternCols) / 2);

        // Place the pattern in the center of the grid
        newGrid = [...emptyGrid];
        for (let row = 0; row < patternRows; row++) {
          for (let col = 0; col < patternCols; col++) {
            const gridRow = (startRow + row + rows) % rows;
            const gridCol = (startCol + col + columns) % columns;
            newGrid[gridRow][gridCol] = pattern[row][col];
          }
        }
      } else {
        // Otherwise, get the pattern by name from the patterns object
        newGrid = loadCenteredPattern(patternNameOrArray);
      }

      setGrid(newGrid);
      setInitialGrid(newGrid);
      setGeneration(0);
      setIsRunning(false);
    },
    [loadCenteredPattern, calculateDimensions]
  );

  const computeNextGrid = useCallback((currentGrid) => {
    if (!currentGrid.length) return currentGrid;

    // Check if any cells would change state
    let hasChanges = false;
    const newGrid = currentGrid.map((row, rowIndex) => {
      let rowChanged = false;
      const newRow = row.map((cell, colIndex) => {
        // Calculate neighbor count
        let neighbors = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;

            const newRow =
              (rowIndex + dx + currentGrid.length) % currentGrid.length;
            const newCol =
              (colIndex + dy + currentGrid[0].length) % currentGrid[0].length;
            neighbors += currentGrid[newRow][newCol];
          }
        }

        // Determine new state based on Game of Life rules
        const newState =
          cell === 1
            ? neighbors === 2 || neighbors === 3
              ? 1
              : 0
            : neighbors === 3
            ? 1
            : 0;

        if (newState !== cell) {
          rowChanged = true;
          hasChanges = true;
        }

        return newState;
      });

      // Only create a new row if something changed
      return rowChanged ? newRow : row;
    });

    // If nothing changed, return the original grid
    return hasChanges ? newGrid : currentGrid;
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setGrid((prevGrid) => {
          const nextGrid = computeNextGrid(prevGrid);
          setGeneration((prev) => prev + 1);
          return nextGrid;
        });
      }, 200);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, computeNextGrid]);

  // Toggle isRunning state
  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Function to update state when grid is modify
  const handleGridChange = useCallback(
    (newGrid) => {
      setGrid(newGrid);
      if (generation === 0) {
        setInitialGrid(newGrid);
      }
    },
    [generation]
  );

  // Function to reload the grid before that the game was starting
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
    const emptyGrid = getEmptyGrid();
    setGrid(emptyGrid);
    setInitialGrid(emptyGrid);
    setGeneration(0);
    setIsRunning(false);
  }, [getEmptyGrid]);

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
