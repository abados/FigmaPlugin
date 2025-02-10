figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async (msg) => {
  console.log("📩 Message received from UI:", msg);

  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length === 0) {
    figma.notify("❌ No component selected!");
    return;
  }

  const selectedComponent = selectedNodes[0];
  if (selectedComponent.type !== "INSTANCE") {
    figma.notify("❌ Selected item is not an instance of a component!");
    return;
  }

  // ✅ Clone and detach the selected component instance
  let newInstance = selectedComponent.clone();
  newInstance.name = "Generated Chart";
  newInstance.x += 300;
  newInstance.y += 100;
  figma.currentPage.appendChild(newInstance);
  newInstance = newInstance.detachInstance();

  // ✅ Find the "column chart" frame in the new instance
  let columnChart = newInstance.children.find(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  );

  columnChart.layoutMode = "HORIZONTAL"; // Arrange bars side by side
  columnChart.primaryAxisSizingMode = "FIXED"; // Expand width automatically
  columnChart.counterAxisSizingMode = "FIXED"; // Expand height automatically

  console.log("🔍 Column Chart :", columnChart);

  if (!columnChart) {
    figma.notify("❌ 'Column Chart' not found!");
    return;
  }

  // ✅ Find "Bar Element Simple" inside "Column Chart"
  let originalBarElement = columnChart.findOne(
    (node) =>
      (node.type === "INSTANCE" &&
        node.name.trim().toLowerCase() === "bar element simple") ||
      node.name.trim().toLowerCase() === "bar element",
  );

  if (!originalBarElement) {
    figma.notify("❌ 'Bar Element Simple' not found!");
    return;
  }

  // ✅ Move the first bar inside `barContainer`
  originalBarElement = originalBarElement.detachInstance();
  //columnChart.appendChild(originalBarElement);
  console.log("✅ Detached and moved first bar inside barContainer");

  const numStackedBars = 3; // Number of stacked segments in each bar
  const stackedHeights = [
    [10, 30, 40], // Heights for Bar 1
    [0, 25, 35], // Heights for Bar 2
    [15, 0, 50], // Heights for Bar 3
    [30, 30, 20], // Heights for Bar 4
    [25, 35, 20], // Heights for Bar 5
  ]; // Heights for each stacked segment in each ba
  const numBars = msg.numBars || 1;
  //const predefinedHeights = [20, 40, 30, 60, 80];

  for (let i = 0; i < numBars; i++) {
    // ✅ Clone from the detached version inside barContainer
    let currentBarElement =
      i === 0 ? originalBarElement : originalBarElement.clone();

    // ✅ Append cloned bars into the barContainer
    columnChart.appendChild(currentBarElement);
    currentBarElement.name = `Bar Element ${i + 1}`;
    console.log(`✅ Appended cloned bar to barContainer (index: ${i})`);

    // ✅ Fix layout alignment so bars appear properly inside barContainer
    currentBarElement.layoutAlign = "STRETCH";
    currentBarElement.layoutGrow = 1;

    // ✅ Ensure the "Bar Frame" exists
    let barFrame = currentBarElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    );

    if (!barFrame) {
      console.warn(`⚠️ No 'Bar Frame' found in '${currentBarElement.name}'`);
      continue;
    }

    let yOffset = barFrame.height; // Start from the bottom of the barFrame
    const colors = [
      { r: 0.1, g: 0.6, b: 0.9 },
      { r: 0.8, g: 0.5, b: 0.4 },
      { r: 0.3, g: 0.7, b: 0.2 },
    ]; // Colors for stacked segments

    let originalBar = barFrame.findOne(
      (node) => node.type === "RECTANGLE",
    ) as RectangleNode | null;

    for (let j = 0; j < numStackedBars; j++) {
      let barHeight = stackedHeights[i % stackedHeights.length][j]; // Pick height
      console.log(`📏 Setting height for stacked bar ${j}: ${barHeight}`);
      // ✅ Clone the original bar for stacking
      if (barHeight === 0) continue;

      let stackedBar = j === 0 ? originalBar : originalBar.clone();
      stackedBar.name = `Stacked Bar ${j + 1}`;
      barFrame.appendChild(stackedBar);
      // ✅ Resize and reposition each stacked bar
      stackedBar.resize(stackedBar.width, barHeight);
      stackedBar.y = yOffset - barHeight;
      stackedBar.fills = [{ type: "SOLID", color: colors[j] }];
      yOffset -= barHeight; // Move up for the next stacked bar
    }

    // ✅ Locate "Label Frame" & Update Label
    let newLabelFrame = currentBarElement.findOne(
      (node) => node.name.trim().toLowerCase() === "label frame",
    );

    if (!newLabelFrame) {
      console.warn(`⚠️ 'Label Frame' not found in '${currentBarElement.name}'`);
      continue;
    }

    let newLabelText = newLabelFrame.findOne(
      (node) =>
        (node.type === "TEXT" && node.name.trim().toLowerCase() === "label") ||
        node.name.trim().toLowerCase() === "bucket 1",
    );

    if (newLabelText) {
      await figma.loadFontAsync(newLabelText.fontName as FontName);
      newLabelText.characters = `Label ${i + 1}`;
      console.log(`✅ Updated Label Text for Bar ${i + 1}`);
    }
  }

  // ✅ Final Debugging Log to Check All Bars in Column Chart
  console.log("🔍 Final columnChart Children:", columnChart.children);
  figma.notify(`✅ Adjusted bar heights & created ${numBars} bar elements!`);

  // Select the new instance and bring it into view
  figma.currentPage.selection = [newInstance];
  figma.viewport.scrollAndZoomIntoView([newInstance]);
};
