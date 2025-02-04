import { useState } from "preact/hooks";
import "./app.css";

export function App() {
  const [barHeight, setBarHeight] = useState(80); // Default height
  const [numBars, setNumBars] = useState(1); // Default number of bars

  const handleCreateInstance = () => {
    console.log("📤 Sending create-instance message...");
    parent.postMessage(
      { pluginMessage: { type: "create-instance", newHeight: barHeight } },
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
  const updateBars = () => {
    parent.postMessage(
      { pluginMessage: { type: "update-bars", barHeight, numBars } },
      "*",
    );
  };

  const addBars = () => {
    parent.postMessage({ pluginMessage: { type: "add-bars", numBars } }, "*");
  };

  return (
    <div className="container">
      <h2>Update Chart</h2>

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
      <button onClick={updateBars}>Update Bars</button>
      <button onClick={addBars}>Add Bars</button>
    </div>
  );
}
