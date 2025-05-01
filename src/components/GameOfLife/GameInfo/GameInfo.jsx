import { useState } from "react";
import { GenerationIcon } from "../../icons/GenerationIcon";
import { InfoIcon } from "../../icons/InfoIcon";
import Modal from "../Modal/Modal";
import "./GameInfo.css";

const GameInfo = ({ generation }) => {
  const [infoModalIsOpen, setInfoModalIsOpen] = useState(false);

  const openInfoModal = () => {
    setInfoModalIsOpen(true);
  };

  const closeInfoModal = () => {
    setInfoModalIsOpen(false);
  };

  return (
    <>
      {/* Generation counter */}
      <div className="game-info-generation">
        <GenerationIcon />
        <span>{generation}</span>
      </div>

      {/* Info icon */}
      <div className="game-info-button" onClick={openInfoModal}>
        <InfoIcon />
      </div>

      {/* Game of Life Rules Modal */}
      <Modal
        isOpen={infoModalIsOpen}
        onClose={closeInfoModal}
        title={"Conway's Game of Life"}
      >
        <div className="game-rules-container">
          <p>
            Conway's Game of Life is a cellular automaton devised by
            mathematician John Conway in 1970. It's a zero-player game, meaning
            its evolution is determined by its initial state.
          </p>
          <br></br>
          <p>
            The analogies of the Game of Life with the development, decline, and
            alterations of a colony of microorganisms bring it closer to
            simulation games that mimic real-life processes.
          </p>

          <h3>The Rules:</h3>
          <ul>
            <li>
              <strong>Birth:</strong> A dead cell with exactly 3 live neighbors
              becomes alive in the next generation.
            </li>
            <li>
              <strong>Survival:</strong> A live cell with 2 or 3 live neighbors
              survives to the next generation.
            </li>
            <li>
              <strong>Death by underpopulation:</strong> A live cell with fewer
              than 2 live neighbors dies.
            </li>
            <li>
              <strong>Death by overpopulation:</strong> A live cell with more
              than 3 live neighbors dies.
            </li>
          </ul>

          <h3>Patterns</h3>
          <p>Various patterns emerge from these simple rules:</p>
          <ul>
            <li>
              <strong>Still lifes:</strong> Patterns that don't change (e.g.,
              Block, Beehive)
            </li>
            <li>
              <strong>Oscillators:</strong> Patterns that repeat (e.g., Blinker,
              Toad)
            </li>
            <li>
              <strong>Spaceships:</strong> Patterns that move across the grid
              (e.g., Glider)
            </li>
          </ul>
          <p>
            Several pre-made patterns are available from the tools menu for you
            to experiment with.
          </p>
          <br></br>
          <p>
            The Game of Life demonstrates how complex patterns can emerge from
            simple rules, making it a fascinating example of emergence and
            self-organization.
          </p>
          <br></br>
          <p>Despite its very simple rules, it is Turing-complete.</p>
        </div>
      </Modal>
    </>
  );
};

export default GameInfo;
