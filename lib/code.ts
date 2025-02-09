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

  // Clone the selected component instance
  let newInstance = selectedComponent.clone();
  newInstance.name = "Generated Chart";
  newInstance.x += 300;
  newInstance.y += 100;
  figma.currentPage.appendChild(newInstance);
  newInstance = newInstance.detachInstance();

  // Find the "column chart" frame in the new instance
  let columnChart = newInstance.children.find(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  );

  if (!columnChart) {
    figma.notify("❌ 'Column Chart' not found!");
    return;
  }

  // Gives "Hug" to the parent and "FILL" height to the columnChart
  if (newInstance.layoutMode !== "NONE") {
    newInstance.primaryAxisSizingMode = "AUTO"; // Allow dynamic height
    console.log(
      "✅ Adjusted 'Generated Chart' to support FILL height in children",
    );
  }

  // Find the "bar element" or "bar element simple" inside the column chart
  let barElement = columnChart.children.find(
    (node) =>
      node.name.trim().toLowerCase() === "bar element" ||
      node.name.trim().toLowerCase() === "bar element simple",
  );

  if (!barElement) {
    figma.notify("❌ 'Bar Element' not found!");
    return;
  }

  // Locate "Label Frame" inside the bar element
  let labelFrame = barElement.children.find(
    (node) => node.name.trim().toLowerCase() === "label frame",
  );

  if (!labelFrame) {
    figma.notify("❌ 'Label Frame' not found!");
    return;
  }

  // Locate "Label" text node (or "bucket") inside the label frame
  let labelText = labelFrame.children.find(
    (node) =>
      (node.type === "TEXT" && node.name.trim().toLowerCase() === "label") ||
      node.name.trim().toLowerCase() === "bucket",
  );

  if (!labelText || !labelText.fontName) {
    figma.notify("❌ 'Label' text node not found!");
    return;
  }

  // Load the font once before modifying any text nodes
  try {
    await figma.loadFontAsync(labelText.fontName);
  } catch (error) {
    console.error("❌ Failed to load font:", error);
    return;
  }

  const numBars = msg.numBars || 1;

  // Predefined bar heights (feel free to adjust or extend)
  const predefinedHeights = [20, 40, 30, 60, 80];

  for (let i = 0; i < numBars; i++) {
    // Reuse barElement for i=0, clone for subsequent bars
    let currentBarElement = i === 0 ? barElement : barElement.clone();
    console.log("currentBarElement", currentBarElement + " " + i);

    if (!currentBarElement) {
      console.error(`❌ 'currentBarElement' is undefined at index ${i}`);
      continue;
    }

    if (i === 0) {
      // For the very first bar element
      let barWithSpace = barElement.children.find(
        (node) => node.type === "FRAME",
      );
      let barFrame = barWithSpace.children.find(
        (node) => node.type === "FRAME",
      );

      if (barFrame) {
        barFrame.paddingTop = 100 - predefinedHeights[i];
        console.log("barFrame", barFrame.paddingTop);
      }

      let bar = barFrame.children.find((node) => node.type === "RECTANGLE");
      if (bar) {
        bar.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
      }
    } else {
      // For every other bar element
      currentBarElement.name = `Bar Element ${i + 1}`;
      let barWithSpace = currentBarElement.children.find(
        (node) => node.type === "FRAME",
      );
      let barFrame = barWithSpace.children.find(
        (node) => node.type === "FRAME",
      );

      if (barFrame) {
        barFrame.paddingTop = 100 - predefinedHeights[i];
        console.log("barFrame", barFrame.paddingTop);
      }

      // Ensure the cloned bar is actually added to the columnChart
      if (currentBarElement.parent !== columnChart) {
        columnChart.appendChild(currentBarElement);
      }

      let bar = barFrame.children.find((node) => node.type === "RECTANGLE");
      if (bar) {
        bar.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
        bar.fills = [{ type: "SOLID", color: { r: 0.7, g: 0.5, b: 0.3 } }];
        bar.resize(bar.width, predefinedHeights[i]);
        //br.height = predefinedHeights[i];
      }
    }

    // Locate "Label Frame" again inside each bar element
    let newLabelFrame = currentBarElement.children.find(
      (node) => node.name.trim().toLowerCase() === "label frame",
    );

    if (!newLabelFrame) {
      console.warn(`⚠️ 'Label Frame' not found in '${currentBarElement.name}'`);
      continue;
    }

    // Locate text node named "Label"
    let newLabelText = newLabelFrame.children.find(
      (node) =>
        (node.type === "TEXT" && node.name.trim().toLowerCase() === "label") ||
        node.name.trim().toLowerCase() === "bucket",
    );

    if (!newLabelText) {
      console.warn(
        `⚠️ No 'Label' text node found in '${currentBarElement.name}'`,
      );
      continue;
    }

    try {
      // Update the label text
      newLabelText.characters = `Label ${i + 1}`;
    } catch (error) {
      console.error(
        `❌ Failed to update label text for '${currentBarElement.name}':`,
        error,
      );
    }
  }

  figma.notify(`✅ Adjusted bar heights & created ${numBars} bar elements!`);

  // Select the new instance and bring it into view
  figma.currentPage.selection = [newInstance];
  figma.viewport.scrollAndZoomIntoView([newInstance]);
};
