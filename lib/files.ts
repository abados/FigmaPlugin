export function extractChartData(generatedChart: FrameNode) {
  let columns: any[] = [{ name: "Category", type: "string" }];
  let rows: any[] = [];
  let stackedBarNames = new Set<string>();
  let hasStackedBars = false; // Flag to determine if we need "stacked" mode

  let columnChart = generatedChart.findOne(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  ) as FrameNode | null;

  if (!columnChart) return null;

  columnChart.children.forEach((barElement) => {
    if (barElement.type !== "FRAME") return;

    let barFrame = barElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    ) as FrameNode | null;

    let scaleTextNode = barElement.findOne(
      (node) =>
        node.type === "TEXT" &&
        node.name.trim().toLowerCase() === "scale - do not delete",
    ) as TextNode | null;

    let scaleFactor = 1; // Default to 1 if no scale is provided
    if (scaleTextNode) {
      let scaleValue = parseFloat(scaleTextNode.characters.trim());
      if (!isNaN(scaleValue) && scaleValue > 0) {
        scaleFactor = scaleValue / 100;
      }
    }

    if (!barFrame) return;

    let barData: any = [barElement.name]; // First column is the category (X-axis)
    let extractedStackedBars: any = {};

    barFrame.children.forEach((stackedBar) => {
      if (stackedBar.type === "RECTANGLE") {
        stackedBarNames.add(stackedBar.name);

        // ✅ Divide by the scale factor to get the original value
        extractedStackedBars[stackedBar.name] = stackedBar.height * scaleFactor;
      }
    });

    if (Object.keys(extractedStackedBars).length > 1) {
      hasStackedBars = true; // There are stacked bars
    }

    stackedBarNames.forEach((name) => {
      barData.push(extractedStackedBars[name] || 0);
    });

    rows.push(barData);
  });

  // Add stacked bar names as columns
  stackedBarNames.forEach((name) => {
    columns.push({ name, type: "number" });
  });

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "ColumnChart Configuration",
    type: "object",
    dataSet: {
      columns: columns,
      rows: rows,
    },
    dataOptions: {
      category: [{ name: "Category", type: "string" }],
      value: columns.slice(1).map((col) => ({
        name: col.name,
        aggregation: "sum",
      })),
      breakBy: [],
    },
    styleOptions: {
      subtype: hasStackedBars ? "stacked" : "normal",
      legend: { enabled: true, position: "right" },
      xAxis: { enabled: true, title: "Categories" },
      yAxis: { enabled: true, title: "Values" },
    },
    onBeforeRender:
      "function () { console.log('Customize chart before render'); }",
    onDataPointClick:
      "function (dataPoint) { console.log('Clicked on', dataPoint); }",
    onDataPointContextMenu:
      "function (event, dataPoint) { console.log('Context menu on', dataPoint); }",
    onDataPointsSelected:
      "function (selectedDataPoints) { console.log('Selected points', selectedDataPoints); }",
    onDataReady: "function (data) { console.log('Data ready', data); }",
  };
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
