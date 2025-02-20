import { useEffect, useState } from "preact/hooks";
import "./app.css";

export function App() {
  const [barHeight, setBarHeight] = useState(80);
  const [numBars, setNumBars] = useState(1);
  const [mode, setMode] = useState<"create" | "modify">("create");
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    window.onmessage = (event) => {
      if (!event.data.pluginMessage) return;
      const { type, jsonStr, filename, chartData } = event.data.pluginMessage;

      if (type === "showDefaultUI") setMode("create");
      if (type === "showModifyUI" && chartData) {
        setMode("modify");
        setChartData(chartData);
      }
      if (type === "downloadJSON" && jsonStr) {
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename || "chart_data.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  }, []);

  const handleChartDataChange = (
    barIndex: number,
    stackIndex: number,
    event: Event,
  ) => {
    if (!chartData) return;
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value) || 0; // Preserve decimal precision

    setChartData((prevData: any) => {
      if (!prevData) return prevData;

      const updatedRows = prevData.dataSet.rows.map((row: any, i: number) =>
        i === barIndex
          ? [
              ...row.slice(0, stackIndex + 1),
              value, // ✅ Keep the exact entered value
              ...row.slice(stackIndex + 2),
            ]
          : row,
      );
      console.log("handleChartDataChange", updatedRows);
      return {
        ...prevData,
        dataSet: {
          ...prevData.dataSet,
          rows: updatedRows, // ✅ Save only original entered values
        },
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
          <button
            onClick={() =>
              parent.postMessage(
                {
                  pluginMessage: {
                    type: "create-instance",
                    newHeight: barHeight,
                    numBars,
                  },
                },
                "*",
              )
            }
          >
            Create Chart Instance
          </button>
        </>
      ) : (
        <>
          <h2>Modify Chart Instance</h2>
          <table>
            <thead>
              <tr>
                <th>X</th>
                {chartData?.dataSet?.columns
                  ?.slice(1)
                  .map((col: any, colIndex: number) => (
                    <th key={colIndex}>{col.name}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {chartData?.dataSet?.rows?.map((row: any, barIndex: number) => (
                <tr key={barIndex}>
                  <td>{row[0]}</td> {/* Show category name (X-axis) */}
                  {row
                    .slice(1)
                    .map((originalValue: number, stackIndex: number) => (
                      <td key={stackIndex}>
                        <input
                          type="number"
                          step="0.01" // ✅ Preserve decimal values
                          value={originalValue} // ✅ Show unmodified original values
                          onChange={(e) =>
                            handleChartDataChange(barIndex, stackIndex, e)
                          }
                        />
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() =>
              parent.postMessage(
                {
                  pluginMessage: {
                    type: "modify-instance",
                    chartData: chartData,
                  },
                },
                "*",
              )
            }
          >
            Apply Changes
          </button>
          <button
            onClick={() =>
              parent.postMessage(
                { pluginMessage: { type: "request-download-json" } },
                "*",
              )
            }
          >
            Download Chart Instance
          </button>
          <input
            type="file"
            accept=".json"
            onChange={(event) => {
              const target = event.target as HTMLInputElement;
              if (!target.files || target.files.length === 0) return;
              const file = target.files[0];
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const jsonData = JSON.parse(e.target?.result as string);
                  setChartData(jsonData);
                  parent.postMessage(
                    {
                      pluginMessage: {
                        type: "import-json",
                        chartData: jsonData,
                      },
                    },
                    "*",
                  );
                } catch (error) {}
              };
              reader.readAsText(file);
            }}
          />
        </>
      )}
    </div>
  );
}
