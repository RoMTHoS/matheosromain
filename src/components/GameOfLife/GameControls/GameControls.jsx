import "./GameControls.css";
import { ResetIcon } from "../../icons/ResetIcon";
import { PlayIcon } from "../../icons/PlayIcon";
import { PauseIcon } from "../../icons/PauseIcon";
import { MenuIcon } from "../../icons/MenuIcon";
import { ReloadIcon } from "../../icons/ReloadIcon";
import { useCallback } from "react";

const GameControls = ({
  isRunning,
  onToggleRun,
  onReset,
  onReload,
  onOpenSettings,
  generation,
}) => {
  // Wrapper for play/pause button to ensure UI stays visible
  const handleToggleRun = useCallback(
    (e) => {
      // Prevent event bubbling
      e.stopPropagation();
      onToggleRun();
    },
    [onToggleRun]
  );

  // Wrapper for reset/reload button to allow UI auto-hide
  const handleResetReload = useCallback(
    (e) => {
      // Prevent event bubbling
      e.stopPropagation();
      if (generation === 0) {
        onReset();
      } else {
        onReload();
      }
    },
    [generation, onReset, onReload]
  );

  // Wrapper for settings button to allow UI auto-hide
  const handleOpenSettings = useCallback(
    (e) => {
      // Prevent event bubbling
      e.stopPropagation();
      onOpenSettings();
    },
    [onOpenSettings]
  );

  return (
    <div className="game-controls">
      <button
        onClick={handleResetReload}
        className="control-button"
        aria-label={generation === 0 ? "Reset Grid" : "Reload Initial Grid"}
      >
        {generation === 0 ? <ResetIcon /> : <ReloadIcon />}
      </button>

      <button
        onClick={handleToggleRun}
        className="control-button play-button"
        aria-label={isRunning ? "Pause" : "Start"}
      >
        {isRunning ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        onClick={handleOpenSettings}
        className="control-button"
        aria-label="Load Pattern"
      >
        <MenuIcon />
      </button>
    </div>
  );
};

export default GameControls;
