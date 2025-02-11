figma.showUI(__html__, { width: 400, height: 300 });

figma.on("run", () => {
  console.log("🔄 Plugin opened, checking selection...");
  checkSelectionAndUpdateUI();
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
  const selectedNodes = figma.currentPage.selection;

  if (selectedNodes.length === 0) {
    console.log("🟡 No selection detected. Switching to default UI.");
    figma.ui.postMessage({ type: "showDefaultUI" });
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
    await createNewChart(selectedObject, msg);
    return;
  } else if (
    selectedObject.name === "Generated Chart" &&
    selectedObject.type === "FRAME"
  ) {
    console.log("📊 Selected a Generated Chart. Extracting data...");

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
async function createNewChart(selectedComponent: InstanceNode, msg: any) {
  let newInstance = selectedComponent.clone();
  newInstance.name = "Generated Chart";
  newInstance.x += 300;
  newInstance.y += 100;
  figma.currentPage.appendChild(newInstance);
  newInstance = newInstance.detachInstance();

  let columnChart = newInstance.findChild(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  );

  if (!columnChart) {
    figma.notify("❌ 'Column Chart' not found!");
    return;
  }

  columnChart.layoutMode = "HORIZONTAL";
  columnChart.primaryAxisSizingMode = "FIXED";
  columnChart.counterAxisSizingMode = "FIXED";

  console.log("🔍 Column Chart :", columnChart);

  let templateBarElement = columnChart.findOne(
    (node) =>
      (node.type === "INSTANCE" &&
        node.name.trim().toLowerCase() === "bar element simple") ||
      node.name.trim().toLowerCase() === "bar element",
  );

  if (!templateBarElement) {
    figma.notify("❌ 'Bar Element Simple' not found!");
    return;
  }

  templateBarElement = templateBarElement.detachInstance();
  console.log("✅ Detached 'Bar Element' to use as a clean template");

  let templateBarFrame = templateBarElement.findOne(
    (node) =>
      node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
  );

  if (!templateBarFrame) {
    figma.notify("❌ 'Bar Frame' not found in template!");
    return;
  }

  let templateBarRect = templateBarFrame.findOne(
    (node) => node.type === "RECTANGLE",
  ) as RectangleNode | null;

  if (!templateBarRect) {
    figma.notify("❌ No base rectangle found in template!");
    return;
  }

  // ✅ Clone "Bar 0" first before removing it
  let bar0Clone = templateBarRect.clone();

  // ✅ Remove "Bar 0" from the templateBarFrame after cloning
  templateBarFrame
    .findAll((node) => node.type === "RECTANGLE" && node.name === "Bar 0")
    .forEach((bar) => {
      console.log(`🗑 Removing Bar 0 from template: ${bar.name}`);
      bar.remove();
    });

  const numStackedBars = 3;
  const stackedHeights = [
    [10, 30, 40],
    [0, 25, 80],
    [15, 0, 50],
    [30, 30, 100],
    [25, 35, 20],
  ];
  const numBars = msg.numBars || 5;
  const colors = [
    { r: 0.1, g: 0.6, b: 0.9 },
    { r: 0.8, g: 0.5, b: 0.4 },
    { r: 0.3, g: 0.7, b: 0.2 },
  ];

  for (let i = 0; i < numBars; i++) {
    let currentBarElement;
    let barFrame;

    if (i === 0) {
      currentBarElement = templateBarElement;
    } else {
      currentBarElement = templateBarElement.clone();
    }

    columnChart.appendChild(currentBarElement);
    currentBarElement.name = `Bar Element ${i + 1}`;
    console.log(`✅ Appended cloned bar to columnChart (index: ${i})`);

    currentBarElement.layoutAlign = "STRETCH";
    currentBarElement.layoutGrow = 1;

    barFrame = currentBarElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    );

    if (!barFrame) {
      console.warn(`⚠️ No 'Bar Frame' found in '${currentBarElement.name}'`);
      continue;
    }

    let yOffset = barFrame.height; // ✅ Fix: Start from the bottom of the frame
    // ✅ Remove "Bar 0" inside each cloned `barFrame`
    barFrame
      .findAll((node) => node.type === "RECTANGLE" && node.name === "Bar 0")
      .forEach((bar) => {
        console.log(`🗑 Removing Bar 0: ${bar.name}`);
        bar.remove();
      });

    // ✅ Clear existing bars before adding new ones
    barFrame
      .findAll((node) => node.type === "RECTANGLE" && node.name !== "Bar 0")
      .forEach((bar) => bar.remove());
    const barSpacing = 2;
    for (let j = 0; j < numStackedBars; j++) {
      let barHeight = stackedHeights[i % stackedHeights.length][j];
      console.log(`📏 Setting height for stacked bar ${j}: ${barHeight}`);

      if (barHeight === 0) continue;

      let stackedBar = bar0Clone.clone(); // ✅ Use clone of original Bar 0
      stackedBar.name = `Stacked Bar ${j + 1}`;
      stackedBar.constraints = { horizontal: "STRETCH", vertical: "SCALE" };
      stackedBar.visible = true;
      barFrame.appendChild(stackedBar);
      console.log("✅ Added stackedBar:", stackedBar.name);

      stackedBar.resize(barFrame.width, barHeight);
      stackedBar.y = yOffset - barHeight; // ✅ Fix: Position bars correctly
      stackedBar.fills = [{ type: "SOLID", color: colors[j] }];
      yOffset -= barHeight + barSpacing; // ✅ Move the offset up for the next stacked bar
    }

    let newLabelFrame = currentBarElement.findOne(
      (node) => node.name.trim().toLowerCase() === "label frame",
    );

    let newLabelText = newLabelFrame.findOne(
      (node) =>
        (node.type === "TEXT" && node.name.trim().toLowerCase() === "label") ||
        node.name.trim().toLowerCase() === "bucket 1" ||
        node.name.trim().toLowerCase() === "label 1",
    );

    if (newLabelText) {
      console.log(`Label ${i + 1}`);
      await figma.loadFontAsync(newLabelText.fontName as FontName);
      newLabelText.characters = `Label ${i + 1}`;
      console.log(`✅ Updated Label Text for Bar ${i + 1}`);
    }
  }

  console.log("🔍 Final columnChart Children:", columnChart.children);
  figma.notify(`✅ Adjusted bar heights & created ${numBars} bar elements!`);

  figma.currentPage.selection = [newInstance];
  figma.viewport.scrollAndZoomIntoView([newInstance]);
  // ✅ Extract chart data and send to UI for download
  const chartData = extractChartData(columnChart);
  //downloadJSON(chartData);
}

/**
 * ✅ Extracts the structure of the chart into JSON format.
 */
function extractChartData(columnChart: FrameNode) {
  let chartData: { name: string; bars: any[] } = {
    name: columnChart.name,
    bars: [],
  };

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

    if (barFrame) {
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
    }

    chartData.bars.push(barData);
  });

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
