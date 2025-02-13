export function extractChartData(generatedChart: FrameNode) {
  let chartData: { name: string; bars: any[] } = {
    name: generatedChart.name,
    bars: [],
  };

  let columnChart = generatedChart.findOne(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  ) as FrameNode | null;

  columnChart.children.forEach((barElement) => {
    if (barElement.type !== "FRAME") return;

    let barData: { name: string; stackedBars: any[]; label: string } = {
      name: barElement.name,
      stackedBars: [],
      label: "",
    };

    let barFrame = barElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    ) as FrameNode | null;

    if (!barFrame) return;

    barFrame.children.forEach((stackedBar) => {
      if (stackedBar.type === "RECTANGLE") {
        barData.stackedBars.push({
          name: stackedBar.name,
          height: stackedBar.height,
          width: stackedBar.width,
          color: stackedBar.fills[0].color || null,
        });
      }
    });

    chartData.bars.push(barData);
  });

  return chartData;
}

/**
 * ✅ Downloads JSON file from extracted data.
 */
export function downloadJSON(data: any, filename = "chart_data.json") {
  const jsonStr = JSON.stringify(data, null, 2);

  try {
    figma.ui.postMessage({
      type: "downloadJSON",
      jsonStr: jsonStr, // Send raw JSON text
      filename: filename,
    });
  } catch (error) {}
}
