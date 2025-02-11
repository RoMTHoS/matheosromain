import "./GameControls.css";
import { ResetIcon } from "../../icons/ResetIcon";
import { PlayIcon } from "../../icons/PlayIcon";
import { PauseIcon } from "../../icons/PauseIcon";
import { MenuIcon } from "../../icons/MenuIcon";
import { ReloadIcon } from "../../icons/ReloadIcon";

const GameControls = ({
  isRunning,
  onToggleRun,
  onReset,
  onReload,
  onOpenSettings,
  generation,
  // onUploadImage,
  // cursorSize,
  // onCursorSizeChange,
}) => {
  return (
    <div className="game-controls">
      <button
        onClick={generation === 0 ? onReset : onReload}
        className="control-button"
        aria-label={generation === 0 ? "Reset Grid" : "Reload Initial Grid"}
      >
        {generation === 0 ? <ResetIcon /> : <ReloadIcon />}
      </button>

      <button
        onClick={onToggleRun}
        className="control-button"
        aria-label={isRunning ? "Pause" : "Start"}
      >
        {isRunning ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        onClick={onOpenSettings}
        className="control-button"
        aria-label="Load Pattern"
      >
        <MenuIcon />
      </button>

      {/* <div className="cursor-size-control">
        <button
          onClick={() => onCursorSizeChange(Math.max(1, cursorSize - 2))}
          className="control-button"
          disabled={cursorSize <= 1}
          aria-label="Decrease cursor size"
        >
          -
        </button>
        <span className="cursor-size-value">{cursorSize}</span>
        <button
          onClick={() => onCursorSizeChange(cursorSize + 2)}
          className="control-button"
          aria-label="Increase cursor size"
        >
          +
        </button>
      </div> */}
    </div>
  );
};

export default GameControls;
