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
    key: string,
    event: Event,
  ) => {
    if (!chartData) return;
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;

    setChartData((prevData: any) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        bars: prevData.bars.map((bar: any, i: number) =>
          i === barIndex
            ? {
                ...bar,
                stackedBars: bar.stackedBars.map(
                  (stackedBar: any, j: number) =>
                    j === stackIndex
                      ? { ...stackedBar, [key]: value }
                      : stackedBar,
                ),
              }
            : bar,
        ),
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
                <th>Val 1</th>
                <th>Val 2</th>
                <th>Val 3</th>
              </tr>
            </thead>
            <tbody>
              {chartData?.bars?.map((bar: any, barIndex: number) =>
                bar.stackedBars.map((stackedBar: any, stackIndex: number) => (
                  <tr key={`${barIndex}-${stackIndex}`}>
                    <td>{stackIndex + 1}</td>
                    <td>
                      <input
                        type="number"
                        value={stackedBar.height}
                        onChange={(e) =>
                          handleChartDataChange(
                            barIndex,
                            stackIndex,
                            "value1",
                            e,
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={stackedBar.height}
                        onChange={(e) =>
                          handleChartDataChange(
                            barIndex,
                            stackIndex,
                            "value2",
                            e,
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={stackedBar.height}
                        onChange={(e) =>
                          handleChartDataChange(
                            barIndex,
                            stackIndex,
                            "value3",
                            e,
                          )
                        }
                      />
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
          <button
            onClick={() =>
              parent.postMessage(
                {
                  pluginMessage: {
                    type: "modify-instance",
                    updatedChartData: chartData,
                  },
                },
                "*",
              )
            }
          >
            Update Chart
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
                } catch (error) {
                }
              };
              reader.readAsText(file);
            }}
          />
        </>
      )}
    </div>
  );
}
