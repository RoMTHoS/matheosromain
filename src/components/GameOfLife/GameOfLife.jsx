import { useState, useEffect, useCallback } from "react";
import Grid from "./Grid/Grid";
import configs from "../../utils/config.json";
import GameControls from "./GameControls/GameControls";
import GameInfo from "./GameInfo/GameInfo";
import ImageProcessor from "./ImageProcessor/ImageProcessor";
import Modal from "./Modal/Modal";
import GameSettings from "./Modal/GameSettings/GameSettings";

export default function GameOfLife() {
  const [grid, setGrid] = useState([]);
  const [cursorSize, setCursorSize] = useState(1);
  const [initialGrid, setInitialGrid] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [showImageProcessor, setShowImageProcessor] = useState(false);
  const [dimensions, setDimensions] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

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
      columns = 180;
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

  // useEffect to handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const newDimensions = calculateDimensions();
      setDimensions(newDimensions);
      setGrid(
        Array(newDimensions.rows)
          .fill()
          .map(() => Array(newDimensions.columns).fill(0))
      );
      setInitialGrid(
        Array(newDimensions.rows)
          .fill()
          .map(() => Array(newDimensions.columns).fill(0))
      );
      setGeneration(0);
      setIsRunning(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateDimensions]);

  const computeNextGrid = useCallback((currentGrid) => {
    if (!currentGrid.length) return currentGrid;

    return currentGrid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const neighbors = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ].reduce((count, [dx, dy]) => {
          const newRow =
            (rowIndex + dx + currentGrid.length) % currentGrid.length;
          const newCol =
            (colIndex + dy + currentGrid[0].length) % currentGrid[0].length;
          return count + currentGrid[newRow][newCol];
        }, 0);

        if (cell === 1) return neighbors === 2 || neighbors === 3 ? 1 : 0;
        return neighbors === 3 ? 1 : 0;
      })
    );
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

  return (
    <div className="game-container">
      <GameInfo generation={generation} />
      <Grid grid={grid} setGrid={handleGridChange} cursorSize={cursorSize} />
      <GameControls
        isRunning={isRunning}
        onToggleRun={toggleRunning}
        onReset={resetGame}
        onReload={reloadInitialGrid}
        generation={generation}
        onOpenSettings={() => setShowSettings(true)}
        // onUploadImage={() => setShowImageProcessor(true)}
        cursorSize={cursorSize}
        onCursorSizeChange={setCursorSize}
      />
      {showImageProcessor && (
        <ImageProcessor
          onImageProcessed={handleImageProcessed}
          // Pass the current grid dimensions
          gridColumns={grid[0]?.length || 0}
          gridRows={grid.length || 0}
        />
      )}
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
        />
      </Modal>
    </div>
  );
}
