import { useState } from "react";
import ImageProcessor from "../../ImageProcessor/ImageProcessor";
import alphabetPatterns from "../../../../utils/alphabetPattern.json";
import "./GameTools.css";

// Function to convert text to pattern
const textToPattern = (text) => {
  const letters = text.toUpperCase().split("");
  const letterPatterns = letters.map((letter) => {
    // Support spaces by creating an empty pattern of appropriate width
    if (letter === " ") {
      return Array(7)
        .fill()
        .map(() => Array(4).fill(0));
    }

    const patternKey = `letter${letter}`;
    return alphabetPatterns[patternKey] || [];
  });

  // Get max height of all letter patterns
  const maxHeight = Math.max(
    ...letterPatterns.map((pattern) => pattern.length || 0)
  );

  // Initialize result array with empty rows
  const result = Array(maxHeight)
    .fill()
    .map(() => []);

  // Add each letter pattern with 1 column spacing
  letterPatterns.forEach((letterPattern, letterIndex) => {
    if (!letterPattern.length) return; // Skip invalid letters

    const letterHeight = letterPattern.length;
    const letterWidth = letterPattern[0]?.length || 0;

    // Add each row of the letter
    for (let row = 0; row < maxHeight; row++) {
      if (row < letterHeight) {
        // Add the letter row
        result[row].push(...letterPattern[row]);
      } else {
        // Add empty space for this row
        result[row].push(...Array(letterWidth).fill(0));
      }

      // Add 1 column spacing between letters (except after the last letter)
      if (letterIndex < letterPatterns.length - 1) {
        result[row].push(0);
      }
    }
  });

  return result;
};

const GameTools = ({
  onImageProcessed,
  cursorSize,
  onCursorSizeChange,
  gridColumns,
  gridRows,
  patterns,
  onPatternSelect,
}) => {
  const [customText, setCustomText] = useState("");
  const [textError, setTextError] = useState("");

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!customText.trim()) {
      setTextError("Please enter some text");
      return;
    }

    setTextError("");

    // Generate pattern from text
    const textPattern = textToPattern(customText);

    // Check if pattern will fit in the grid
    if (textPattern[0]?.length > gridColumns) {
      setTextError(
        `Text too long for grid (${textPattern[0].length} > ${gridColumns} columns)`
      );
      return;
    }

    // If valid pattern was generated, load it
    if (textPattern.length > 0 && textPattern[0].length > 0) {
      onPatternSelect(textPattern);
    }

    console.log(JSON.stringify(textPattern));
  };

  return (
    <div className="game-settings">
      <h2 className="settings-title">Game Tools</h2>

      <div className="settings-section">
        <h3>Upload an image and make it alive</h3>
        <ImageProcessor
          onImageProcessed={onImageProcessed}
          gridColumns={gridColumns}
          gridRows={gridRows}
        />
      </div>

      <div className="settings-section">
        <div className="cursor-controls">
          <h3>Cursor Size</h3>
          <div className="cursor-controls-buttons">
            <button
              onClick={() => onCursorSizeChange(Math.max(1, cursorSize - 1))}
              className="cursor-button"
              disabled={cursorSize <= 1}
            >
              -
            </button>
            <span className="cursor-value">{cursorSize}</span>
            <button
              onClick={() => onCursorSizeChange(cursorSize + 1)}
              className="cursor-button"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Bring any text to life</h3>
        <form onSubmit={handleTextSubmit} className="text-pattern-form">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder=" Enter text..."
            className="text-input"
          />
          <button type="submit" className="text-submit-btn">
            Create
          </button>
        </form>
        {textError && <div className="text-error">{textError}</div>}
      </div>

      <div className="settings-section">
        <h3>Game of Life famous patterns</h3>
        <div className="pattern-selector">
          {patterns &&
            patterns.map((pattern) => (
              <button
                key={pattern}
                onClick={() => onPatternSelect(pattern)}
                className="pattern-button"
              >
                {pattern}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GameTools;
