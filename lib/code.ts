figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async (msg) => {
  console.log("📩 Message received from UI:", msg);

  // ✅ Step 1: Get the selected instance
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

  // ✅ Step 2: Clone the instance and position it
  let newInstance = selectedComponent.clone();
  newInstance.name = "Generated Chart";
  newInstance.x += 300;
  newInstance.y += 100;
  figma.currentPage.appendChild(newInstance);
  newInstance = newInstance.detachInstance();

  // ✅ Step 3: Locate "Column Chart" inside the instance
  let columnChart = newInstance.children.find(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  );

  if (!columnChart) {
    figma.notify("❌ 'Column Chart' not found!");
    return;
  }

  // ✅ Step 5: Locate "Bar Element" inside Column Chart
  let barElement = columnChart.children.find(
    (node) => node.name.trim().toLowerCase() === "bar element",
  );

  if (!barElement) {
    figma.notify("❌ 'Bar Element' not found!");
    return;
  }

  // ✅ Step 6: Locate "Label Frame" and Load Font Once
  let labelFrame = barElement.children.find(
    (node) => node.name.trim().toLowerCase() === "label frame",
  );

  if (!labelFrame) {
    figma.notify("❌ 'Label Frame' not found!");
    return;
  }

  let labelText = labelFrame.children.find(
    (node) =>
      node.type === "TEXT" && node.name.trim().toLowerCase() === "label",
  );

  if (!labelText) {
    figma.notify("❌ 'Label' text node not found!");
    return;
  }

  try {
    // ✅ Load font once before the loop
    await figma.loadFontAsync(labelText.fontName);
  } catch (error) {
    console.error("❌ Failed to load font:", error);
    return;
  }

  // ✅ Step 9: Clone "Bar Element" multiple times inside "Column Chart"
  const numBars = msg.numBars || 1;

  for (let i = 0; i < numBars; i++) {
    let currentBarElement = i === 0 ? barElement : barElement.clone();

    if (!currentBarElement) {
      console.error(`❌ Failed to clone 'Bar Element' for index ${i}`);
      continue;
    }

    if (i === 0) {
      // ✅ Modify existing first 'Bar Element' (do not clone)
      let barWithSpace = barElement.children.find(
        (node) => node.type === "FRAME",
      );

      let barFrame = null;
      if (barWithSpace && barWithSpace.children) {
        barFrame = barWithSpace.children.find((node) => node.type === "FRAME");
      }

      if (barFrame) {
        barFrame.paddingTop = 100 - msg.newHeight;
      }
    } else {
      // ✅ Clone additional 'Bar Elements'
      currentBarElement.name = `Bar Element ${i + 1}`;
      if (currentBarElement.parent !== columnChart) {
        columnChart.appendChild(currentBarElement);
      }
    }

    // ✅ Locate 'Label Frame' inside each 'Bar Element'
    let newLabelFrame = currentBarElement.children.find(
      (node) => node.name.trim().toLowerCase() === "label frame",
    );

    if (!newLabelFrame) {
      console.warn(`⚠️ 'Label Frame' not found in '${currentBarElement.name}'`);
      continue;
    }

    // ✅ Find 'Label' inside 'Label Frame'
    let newLabelText = newLabelFrame.children.find(
      (node) =>
        node.type === "TEXT" && node.name.trim().toLowerCase() === "label",
    );

    if (!newLabelText) {
      console.warn(
        `⚠️ No 'Label' text node found in '${currentBarElement.name}'`,
      );
      continue;
    }

    // ✅ Update label text using preloaded font
    newLabelText.characters = `Label ${i + 1}`;
  }

  figma.notify(`✅ Adjusted bar heights & created ${numBars} bar elements!`);

  // ✅ Step 10: Resize "Column Chart" to fit all bars
  try {
    const totalBarHeight = numBars * (msg.newHeight + 10);
    columnChart.resize(columnChart.width, totalBarHeight);
  } catch (error) {
    console.error("❌ Error while resizing 'Column Chart':", error);
  }

  // ✅ Step 11: Select & Zoom
  figma.currentPage.selection = [newInstance];
  figma.viewport.scrollAndZoomIntoView([newInstance]);
};
