import { createNewChart } from "../lib/createChart";
import { isCreatingChart } from "../lib/state";
import { extractChartData } from "./files";

figma.showUI(__html__, { width: 400, height: 600 });

figma.on("run", () => {
  setTimeout(() => checkSelectionAndUpdateUI(), 100);
});

/**
 * ✅ Runs when the user changes selection.
 * ✅ Updates UI dynamically.
 */
figma.on("selectionchange", () => {
  checkSelectionAndUpdateUI();
});

function checkSelectionAndUpdateUI() {

  if (isCreatingChart) return;
  

  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length === 0) {
    figma.ui.postMessage({ type: "showDefaultUI" }); // 🚨 This sends the message!
    return;
  }
  const selectedObject = selectedNodes[0];

  if (selectedObject.type === "INSTANCE") {
    figma.ui.postMessage({ type: "showDefaultUI" });
    return;
  }

  if (
    selectedObject.name === "Generated Chart" &&
    selectedObject.type === "FRAME"
  ) {
    const chartData = extractChartData(selectedObject);
    figma.ui.postMessage({
      type: "showModifyUI",
      chartData: chartData,
    });
    return;
  }

  // ✅ If selection is something else, fallback to default UI
  figma.ui.postMessage({ type: "showDefaultUI" });
}

figma.ui.onmessage = async (msg) => {

  if (msg.type === "chart-created") {
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

    if (msg.type === "import-json") {
      await createNewChart(selectedObject, msg, true);

      figma.ui.postMessage({
        type: "showModifyUI",
        chartData: msg.chartData,
      });
    }
    const chartData = extractChartData(selectedObject);
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
