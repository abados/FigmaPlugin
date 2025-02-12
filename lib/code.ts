import { createNewChart } from "../lib/createChart";
import { isCreatingChart } from "../lib/state";

figma.showUI(__html__, { width: 400, height: 300 });

figma.on("run", () => {
  console.log("🔄 Plugin opened, checking selection...");
  setTimeout(() => checkSelectionAndUpdateUI(), 100);
});

/**
 * ✅ Runs when the user changes selection.
 * ✅ Updates UI dynamically.
 */
figma.on("selectionchange", () => {
  console.log("🔄 Selection changed, checking selection...");
  checkSelectionAndUpdateUI();
});

function checkSelectionAndUpdateUI() {
  console.log(
    "🔄 checkSelectionAndUpdateUI triggered | isCreatingChart:",
    isCreatingChart,
  );

  if (isCreatingChart) {
    console.log("🚨 Chart is being created, skipping UI update.");
    return;
  }

  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length === 0) {
    console.log("🟡 No selection detected. Switching to default UI.");
    figma.ui.postMessage({ type: "showDefaultUI" }); // 🚨 This sends the message!
    return;
  }
  const selectedObject = selectedNodes[0];

  if (selectedObject.type === "INSTANCE") {
    console.log("📌 Selected an Instance. Showing default UI.");
    figma.ui.postMessage({ type: "showDefaultUI" });
    return;
  }

  if (
    selectedObject.name === "Generated Chart" &&
    selectedObject.type === "FRAME"
  ) {
    console.log("📊 Selected a Generated Chart. Extracting data...");
    const chartData = extractChartData(selectedObject);
    console.log("📊 Sending extracted chart data to UI:", chartData);
    figma.ui.postMessage({
      type: "showModifyUI",
      chartData: chartData,
    });
    return;
  }

  // ✅ If selection is something else, fallback to default UI
  console.log("⚠️ Selected an unsupported object. Showing default UI.");
  figma.ui.postMessage({ type: "showDefaultUI" });
}

figma.ui.onmessage = async (msg) => {
  console.log("📩 Message received from UI:", msg);

  if (msg.type === "chart-created") {
    console.log("🎨 Chart was created, switching to Modify Mode.");
    figma.ui.postMessage({
      type: "showModifyUI",
      chartData: msg.chartData,
    });
    return;
  }

  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length === 0) {
    figma.notify("❌ No component selected!");
    return;
  }

  const selectedObject = selectedNodes[0];

  if (selectedObject.type === "INSTANCE") {
    console.log("📌 Selected an Instance. Showing default UI.");
    figma.ui.postMessage({
      type: "showDefaultUI",
    });

    // ✅ Create a new chart based on the selected instance
    await createNewChart(selectedObject, msg, false);
    return;
  } else if (
    selectedObject.name === "Generated Chart" &&
    selectedObject.type === "FRAME"
  ) {
    console.log("📊 Selected a Generated Chart. Extracting data...");

    if (msg.type === "import-json") {
      await createNewChart(selectedObject, msg, true);

      figma.ui.postMessage({
        type: "showModifyUI",
        chartData: msg.chartData,
      });
    }
    const chartData = extractChartData(selectedObject);
    console.log("📊 Sending extracted chart data to UI:", chartData);
    figma.ui.postMessage({
      type: "downloadJSON",
      jsonStr: JSON.stringify(chartData, null, 2),
      filename: "chart_data.json",
    });

    return;
  }
};

/**
 * ✅ Extracts the structure of the chart into JSON format.
 */
function extractChartData(generatedChart: FrameNode) {
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

    console.log("📊 Found Bar Element:", barElement.name);

    let barData: { name: string; stackedBars: any[]; label: string } = {
      name: barElement.name,
      stackedBars: [],
      label: "",
    };

    let barFrame = barElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    ) as FrameNode | null;

    if (!barFrame) {
      console.warn(`⚠️ No 'Bar Frame' found in '${barElement.name}'`);
      return;
    }

    console.log("📊 Extracting bars from:", barFrame.name);

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

    console.log("✅ Extracted stacked bars:", barData.stackedBars);
    chartData.bars.push(barData);
  });

  console.log(
    "✅ Final extracted chart data:",
    JSON.stringify(chartData, null, 2),
  );

  return chartData;
}

/**
 * ✅ Downloads JSON file from extracted data.
 */
function downloadJSON(data: any, filename = "chart_data.json") {
  console.log("🔍 Inside downloadJSON() function...");

  const jsonStr = JSON.stringify(data, null, 2);
  console.log("📄 JSON string to send to UI:", jsonStr);

  try {
    figma.ui.postMessage({
      type: "downloadJSON",
      jsonStr: jsonStr, // Send raw JSON text
      filename: filename,
    });

    console.log("✅ JSON message sent to UI!");
  } catch (error) {
    console.error("❌ Error in downloadJSON function:", error);
  }
}
