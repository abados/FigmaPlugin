import { useEffect, useState } from "preact/hooks";
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

  useEffect(() => {
    window.onmessage = (event) => {
      console.log("📩 Received message from Figma Plugin:", event.data);

      if (!event.data.pluginMessage) {
        console.warn("⚠️ No pluginMessage received!");
        return;
      }

      const { type, jsonStr, filename } = event.data.pluginMessage;

      if (type === "downloadJSON") {
        console.log("📥 JSON file received, triggering download...", {
          jsonStr,
          filename,
        });

        if (!jsonStr) {
          console.error("❌ JSON data is missing!");
          return;
        }

        try {
          // ✅ Create a Blob in the UI
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          // ✅ Trigger JSON file download
          const link = document.createElement("a");
          link.href = url;
          link.download = filename || "chart_data.json";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log("✅ JSON file should now be downloading.");
        } catch (error) {
          console.error("❌ Error creating JSON file in UI:", error);
        }
      }
    };
  }, []);

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
