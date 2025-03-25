import { useState, useRef } from "react";
import "./ImageProcessor.css";

const ImageProcessor = ({ onImageProcessed, gridColumns, gridRows }) => {
  const [preview, setPreview] = useState(null);
  const canvasRef = useRef(null);

  const processImage = async (file) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // First, draw the original image to a temporary canvas to handle
      // the initial resize while maintaining aspect ratio
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      // Set the canvas size to match our grid dimensions
      canvas.width = gridColumns;
      canvas.height = gridRows;

      // Calculate aspect ratio
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );

      // Calculate centered position
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      // Clear and draw resized image
      ctx.fillStyle = "#e7e7e7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Convert to black and white
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = 128;
        const color = avg > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = color;
      }

      ctx.putImageData(imageData, 0, 0);
      setPreview(canvas.toDataURL());

      // Convert to grid array
      const grid = Array(gridRows)
        .fill()
        .map((_, row) =>
          Array(gridColumns)
            .fill()
            .map((_, col) => {
              const pixel = ctx.getImageData(col, row, 1, 1).data;
              return pixel[0] === 0 ? 1 : 0;
            })
        );

      onImageProcessed(grid);
      console.log(grid);
    };
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="file-input"
      />
      {/* {preview && (
        <div className="preview-container">
          <img src={preview} alt="Processed" className="preview-image" />
        </div>
      )} */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
};

export default ImageProcessor;
