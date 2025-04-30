import { useState } from "react";
import ImageProcessor from "../ImageProcessor/ImageProcessor";
import alphabetPatterns from "../../../utils/alphabetPattern.json";
import "./GameTools.css";

// Function to convert text to pattern with multi-line support
const textToPattern = (text, gridColumns) => {
  // Split text into lines if needed based on grid width
  const lines = splitTextIntoLines(text, gridColumns);

  // Array to hold all lines of patterns
  const allLinesPatterns = [];

  // Process each line
  lines.forEach((line) => {
    const linePattern = createLinePattern(line, gridColumns);
    allLinesPatterns.push(linePattern);
  });

  // Combine all line patterns into a single pattern with appropriate spacing
  return combineLinePatterns(allLinesPatterns);
};

// Helper function to calculate the width of a text
const calculateTextWidth = (text) => {
  const letters = text.toUpperCase().split("");
  let totalWidth = 0;

  letters.forEach((letter, index) => {
    // For spaces, add standard width
    if (letter === " ") {
      totalWidth += 4;
      return;
    }

    const patternKey = `letter${letter}`;
    const pattern = alphabetPatterns[patternKey];

    if (pattern && pattern[0]) {
      // Add letter width
      totalWidth += pattern[0].length;

      // Add spacing between letters (except after last letter)
      if (index < letters.length - 1) {
        totalWidth += 1;
      }
    }
  });

  return totalWidth;
};

// Helper function to split text into lines based on grid width
const splitTextIntoLines = (text, gridColumns) => {
  // Apply a margin of 2 cells on each side
  const effectiveWidth = gridColumns - 4;

  // Check if text contains spaces
  if (text.includes(" ")) {
    // Word-based splitting (for text with spaces)
    return splitTextWithSpaces(text, effectiveWidth);
  } else {
    // Character-based splitting (for continuous text)
    return splitContinuousText(text, effectiveWidth);
  }
};

// Split text that contains spaces (word-based)
const splitTextWithSpaces = (text, effectiveWidth) => {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    // Check if the word itself is too long
    const wordWidth = calculateTextWidth(word);

    if (wordWidth > effectiveWidth) {
      // If current line is not empty, push it first
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      // Split the long word using character-based splitting
      const wordParts = splitContinuousText(word, effectiveWidth);
      lines.push(...wordParts);
    } else {
      // Calculate width of current line + new word + space
      const testLine = currentLine ? currentLine + " " + word : word;
      const testLineWidth = calculateTextWidth(testLine);

      // If adding this word exceeds effective width, start a new line
      if (testLineWidth > effectiveWidth) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // This shouldn't happen given the checks above, but just in case
          lines.push(word);
          currentLine = "";
        }
      } else {
        currentLine = testLine;
      }
    }
  });

  // Add the last line if it's not empty
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

// Split continuous text without spaces (character-based)
const splitContinuousText = (text, effectiveWidth) => {
  const lines = [];
  let currentLine = "";
  let currentWidth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const patternKey = `letter${char.toUpperCase()}`;
    const pattern = alphabetPatterns[patternKey];

    if (!pattern || !pattern[0]) {
      continue; // Skip invalid characters
    }

    const charWidth = pattern[0].length + (currentLine ? 1 : 0); // Include spacing if not first char

    if (currentWidth + charWidth > effectiveWidth) {
      // This character would exceed the line width, start a new line
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = char;
      currentWidth = pattern[0].length;
    } else {
      // Add character to current line
      currentLine += char;
      currentWidth += charWidth;
    }
  }

  // Add the last line if it's not empty
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

// Helper function to create a pattern for a single line of text
const createLinePattern = (line, gridColumns) => {
  const letters = line.toUpperCase().split("");
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

  // Calculate total width of the text
  let totalTextWidth = 0;
  letterPatterns.forEach((pattern, index) => {
    if (pattern && pattern[0]) {
      totalTextWidth += pattern[0].length;

      // Add spacing between letters (except after the last letter)
      if (index < letterPatterns.length - 1) {
        totalTextWidth += 1;
      }
    }
  });

  // Apply a margin of 2 cells on each side
  const effectiveWidth = gridColumns - 4;

  // Calculate padding needed for centering (including left margin of 2)
  const paddingLeft = Math.max(
    2,
    Math.floor((effectiveWidth - totalTextWidth) / 2) + 2
  );

  // Add left padding for centering
  for (let row = 0; row < maxHeight; row++) {
    for (let i = 0; i < paddingLeft; i++) {
      result[row].push(0);
    }
  }

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

  // Ensure right margin (add padding to reach grid width with right margin of 2)
  const rightPadding = Math.max(0, gridColumns - result[0].length - 2);
  for (let row = 0; row < maxHeight; row++) {
    for (let i = 0; i < rightPadding; i++) {
      result[row].push(0);
    }
  }

  return result;
};

// Helper function to combine multiple line patterns into a single pattern
const combineLinePatterns = (linePatterns) => {
  if (linePatterns.length === 0) return [];
  if (linePatterns.length === 1) return linePatterns[0];

  // Calculate total height needed
  let totalHeight = 0;
  linePatterns.forEach((linePattern) => {
    totalHeight += linePattern.length;

    // Add 3 rows of space between lines
    totalHeight += 3;
  });

  // Remove the last 3 rows of spacing that were added
  totalHeight -= 3;

  // Get the maximum width of all lines
  const maxWidth = Math.max(...linePatterns.map((line) => line[0].length));

  // Create the combined pattern
  const combinedPattern = [];

  let currentRow = 0;
  linePatterns.forEach((linePattern, lineIndex) => {
    // Add each row of the current line pattern
    for (let i = 0; i < linePattern.length; i++) {
      // Create a new row in the combined pattern
      combinedPattern[currentRow] = [];

      // Copy the current line's row, padding with zeros if needed
      const row = linePattern[i];
      combinedPattern[currentRow] = [...row];

      // Pad with zeros if this line is shorter than the max width
      if (row.length < maxWidth) {
        const padding = Array(maxWidth - row.length).fill(0);
        combinedPattern[currentRow].push(...padding);
      }

      currentRow++;
    }

    // Add space between lines (except after the last line)
    if (lineIndex < linePatterns.length - 1) {
      for (let i = 0; i < 3; i++) {
        combinedPattern[currentRow] = Array(maxWidth).fill(0);
        currentRow++;
      }
    }
  });

  return combinedPattern;
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
    const textPattern = textToPattern(customText, gridColumns);

    // Check if pattern will fit in the grid height
    if (textPattern.length > gridRows) {
      setTextError(
        `Text too tall for grid (${textPattern.length} > ${gridRows} rows)`
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
    <div className="game-tools">
      <h2 className="tools-title">Game Tools</h2>

      <div className="tools-section">
        <div className="tools-section-content">
          <h3>Upload an image and make it alive</h3>
          <ImageProcessor
            onImageProcessed={onImageProcessed}
            gridColumns={gridColumns}
            gridRows={gridRows}
          />
        </div>

        <div className="cursor-controls tools-section-content">
          <h3>Cursor Size</h3>
          <div className="cursor-controls-buttons">
            <button
              onClick={() => onCursorSizeChange(Math.max(1, cursorSize - 2))}
              className="cursor-button"
              disabled={cursorSize <= 1}
            >
              -
            </button>
            <span className="cursor-value">{cursorSize}</span>
            <button
              onClick={() => onCursorSizeChange(cursorSize + 2)}
              className="cursor-button"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="tools-section-content">
        <h3>Bring any text to life</h3>
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder=" Enter text..."
          className="text-input"
          rows={3}
        />
        {textError && <div className="text-error">{textError}</div>}
      </div>

      <button onClick={handleTextSubmit} className="confirm-button">
        Generate Pattern From Text
      </button>
      <br></br>
      <div className="tools-section-content">
        <h3>Game of Life famous patterns</h3>
        <div className="pattern-selector">
          {Object.entries(patterns).map(([family, familyPatterns]) => (
            <div key={family} className="pattern-family">
              <p className="family-name">{family}</p>
              <div className="family-patterns">
                {Object.keys(familyPatterns).map((patternName) => (
                  <button
                    key={patternName}
                    onClick={() => onPatternSelect(familyPatterns[patternName])}
                    className="pattern-button"
                  >
                    {patternName}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameTools;
