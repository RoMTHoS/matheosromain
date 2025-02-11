import "./GameSettings.css";
import ImageProcessor from "../../ImageProcessor/ImageProcessor";

const GameSettings = ({
  onImageProcessed,
  cursorSize,
  onCursorSizeChange,
  gridColumns,
  gridRows,
}) => {
  return (
    <div className="game-settings">
      <h2 className="settings-title">Game Settings</h2>

      <div className="settings-section">
        <h3>Upload Pattern</h3>
        <ImageProcessor
          onImageProcessed={onImageProcessed}
          gridColumns={gridColumns}
          gridRows={gridRows}
        />
      </div>

      <div className="settings-section">
        <h3>Cursor Size</h3>
        <div className="cursor-controls">
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
  );
};

export default GameSettings;
