import { useState } from "preact/hooks";
import "./app.css";

export function App() {
  const [barHeight, setBarHeight] = useState(80); // Default height
  const [numBars, setNumBars] = useState(1); // Default number of bars

  const handleCreateInstance = () => {
    console.log("📤 Sending create-instance message with values:", {
      barHeight,
      numBars,
    });

    parent.postMessage(
      {
        pluginMessage: {
          type: "create-instance",
          newHeight: barHeight,
          numBars: numBars,
        },
      },
      "*",
    );
  };

  const handleBarHeightChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    setBarHeight(parseInt(target.value) || 80);
  };

  const handleNumBarsChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    setNumBars(parseInt(target.value) || 1);
  };

  return (
    <div className="container">
      <h2>Create Chart Instance</h2>

      <label>
        Bar Height:
        <input
          type="number"
          value={barHeight}
          onChange={handleBarHeightChange}
        />
      </label>

      <label>
        Number of Bars:
        <input type="number" value={numBars} onChange={handleNumBarsChange} />
      </label>

      <button onClick={handleCreateInstance}>Create Chart Instance</button>
    </div>
  );
}
