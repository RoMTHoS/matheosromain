import { GenerationIcon } from "../../icons/GenerationIcon";
import { InfoIcon } from "../../icons/InfoIcon";
import "./GameInfo.css";

const GameInfo = ({ generation }) => {
  return (
    <>
      {/* Generation counter */}
      <div className="game-info-generation">
        <GenerationIcon />
        {/* <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 1h2v8h8v4h-2v-2h-8V5h-2V3h2zM8 7V5h2v2zM6 9V7h2v2zm-2 2V9h2v2zm10 8v2h-2v2h-2v-8H2v-4h2v2h8v6zm2-2v2h-2v-2zm2-2v2h-2v-2zm0 0h2v-2h-2z"
          />
        </svg> */}
        <span>{generation}</span>
      </div>

      {/* Info icon */}
      <div className="game-info-button">
        <InfoIcon />
        {/* <svg
          xmlns="http://www.w3.org/2000/svg"
          width="34"
          height="34"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M3 3h2v18H3zm16 0H5v2h14v14H5v2h16V3zm-8 6h2V7h-2zm2 8h-2v-6h2z"
          />
        </svg> */}
      </div>
    </>
  );
};

export default GameInfo;
