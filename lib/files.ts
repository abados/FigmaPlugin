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

  // Determine all possible stacked bar names (Stacked Bar 1, 2, 3, ...)
  const allStackedBarNames = new Set<string>();

  columnChart.children.forEach((barElement) => {
    if (barElement.type !== "FRAME") return;

    let barFrame = barElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    ) as FrameNode | null;

    if (!barFrame) return;

    barFrame.children.forEach((stackedBar) => {
      if (stackedBar.type === "RECTANGLE") {
        allStackedBarNames.add(stackedBar.name); // Collect all unique stacked bar names
      }
    });
  });

  const sortedStackedBarNames = Array.from(allStackedBarNames).sort(); // Ensure order is consistent

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

    let extractedStackedBars: any = {};

    barFrame.children.forEach((stackedBar) => {
      if (stackedBar.type === "RECTANGLE") {
        extractedStackedBars[stackedBar.name] = {
          name: stackedBar.name,
          height: stackedBar.height,
          width: stackedBar.width,
          color: stackedBar.fills[0].color || null,
        };
      }
    });

    // ✅ Ensure correct ordering of stacked bars and fill missing ones with height: 0
    barData.stackedBars = sortedStackedBarNames.map(
      (name) =>
        extractedStackedBars[name] || {
          name,
          height: 0,
          width: 75,
          color: null,
        },
    );

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
