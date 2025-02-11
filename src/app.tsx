import { useEffect, useState } from "preact/hooks";
import "./app.css";

export function App() {
  const [barHeight, setBarHeight] = useState(80);
  const [numBars, setNumBars] = useState(1);
  const [mode, setMode] = useState<"create" | "modify">("create");
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    window.onmessage = (event) => {
      console.log("📩 Received message from Figma Plugin:", event.data);

      if (!event.data.pluginMessage) {
        console.warn("⚠️ No pluginMessage received!");
        return;
      }

      const { type, jsonStr, filename, chartData } = event.data.pluginMessage;
      if (mode === "create" && type !== "showModifyUI") {
        console.warn("🚨 Ignoring UI update while chart is creating...");
        return;
      }

      if (type === "showDefaultUI" && mode !== "create") {
        console.log("🎨 Switching to 'Create Mode' (only if not creating)");
        setMode("create");
      }

      if (type === "showModifyUI" && chartData) {
        console.log("🎨 Switching to 'Modify Mode' with data:", chartData);
        setMode("modify");
        setChartData(chartData);
      }

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
          // ✅ Restored missing download logic
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
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

  const handleModifyInstance = () => {
    console.log(
      "✏️ Sending modify-instance message with updated chart data:",
      chartData,
    );

    parent.postMessage(
      {
        pluginMessage: {
          type: "modify-instance",
          updatedChartData: chartData,
        },
      },
      "*",
    );
  };

  const handleDownloadInstance = () => {
    console.log("📥 Sending request to download chart data...");

    parent.postMessage(
      {
        pluginMessage: {
          type: "request-download-json",
        },
      },
      "*",
    );
  };

  const handleUploadJSON = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        console.log("📂 Imported JSON data:", jsonData);

        // Send imported data to Figma
        parent.postMessage(
          {
            pluginMessage: {
              type: "import-json",
              chartData: jsonData,
            },
          },
          "*",
        );

        // Update UI state
        setChartData(jsonData);
      } catch (error) {
        console.error("❌ Error parsing JSON:", error);
      }
    };

    reader.readAsText(file);
  };

  const handleChartDataChange = (index: number, key: string, event: Event) => {
    if (!chartData) return;

    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;

    setChartData((prevData: typeof chartData) => {
      if (!prevData) return prevData;

      return {
        ...prevData,
        bars: prevData.bars.map((bar: any, i: number) => {
          if (i === index) {
            return {
              ...bar,
              stackedBars: bar.stackedBars.map((stackedBar: any, j: number) => {
                return j === 0 ? { ...stackedBar, [key]: value } : stackedBar;
              }),
            };
          }
          return bar;
        }),
      };
    });
  };

  return (
    <div className="container">
      {mode === "create" ? (
        <>
          <h2>Create Chart Instance</h2>

          <label>
            Bar Height:
            <input
              type="number"
              value={barHeight}
              onChange={(e) =>
                setBarHeight(
                  parseInt((e.target as HTMLInputElement).value) || 80,
                )
              }
            />
          </label>

          <label>
            Number of Bars:
            <input
              type="number"
              value={numBars}
              onChange={(e) =>
                setNumBars(parseInt((e.target as HTMLInputElement).value) || 1)
              }
            />
          </label>

          <button onClick={handleCreateInstance}>Create Chart Instance</button>
        </>
      ) : (
        <>
          <h2>Modify Chart Instance</h2>

          {chartData?.bars?.map((bar: any, index: number) => (
            <div key={index} className="bar-settings">
              <h3>{bar.name}</h3>
              <label>
                Height:
                <input
                  type="number"
                  value={bar.stackedBars[0].height}
                  onChange={(e) => handleChartDataChange(index, "height", e)}
                />
              </label>
              <label>
                Width:
                <input
                  type="number"
                  value={bar.stackedBars[0].width}
                  onChange={(e) => handleChartDataChange(index, "width", e)}
                />
              </label>
            </div>
          ))}

          <button onClick={handleModifyInstance}>Update Chart</button>
          <button onClick={handleDownloadInstance}>
            Download Chart Instance
          </button>
          <input type="file" accept=".json" onChange={handleUploadJSON} />
        </>
      )}
    </div>
  );
}
