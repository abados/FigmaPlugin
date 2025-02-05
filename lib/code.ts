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
  let newInstance = selectedComponent.clone();
  newInstance.name = "Generated Chart";
  newInstance.x += 300;
  newInstance.y += 100;
  figma.currentPage.appendChild(newInstance);
  newInstance = newInstance.detachInstance();

  let columnChart = newInstance.children.find(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  );

  if (!columnChart) {
    figma.notify("❌ 'Column Chart' not found!");
    return;
  }
  //Gives Hug to the parent and H fill to columnChart
  if (newInstance.layoutMode !== "NONE") {
    newInstance.primaryAxisSizingMode = "AUTO"; // Allow dynamic height
    console.log(
      "✅ Adjusted 'Generated Chart' to support FILL height in children",
    );
  }

  let barElement = columnChart.children.find(
    (node) => node.name.trim().toLowerCase() === "bar element",
  );

  if (!barElement) {
    figma.notify("❌ 'Bar Element' not found!");
    return;
  }

  // ✅ Locate 'Label Frame' and 'Label' text node in the original 'Bar Element'
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

  if (!labelText || !labelText.fontName) {
    figma.notify("❌ 'Label' text node not found!");
    return;
  }

  // ✅ Load font ONCE before modifying any text nodes
  try {
    await figma.loadFontAsync(labelText.fontName);
  } catch (error) {
    console.error("❌ Failed to load font:", error);
    return;
  }

  const numBars = msg.numBars || 1;

  for (let i = 0; i < numBars; i++) {
    let currentBarElement = i === 0 ? barElement : barElement.clone();
    console.log("currentBarElement", currentBarElement + " " + i);
    if (!currentBarElement) {
      console.error(`❌ 'currentBarElement' is undefined at index ${i}`);
      continue;
    }
    const predefinedHeights = [20, 40, 30, 60, 80];
    if (i === 0) {
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
    } else {
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

    try {
      // ✅ Modify text since font is already loaded
      newLabelText.characters = `Label ${i + 1}`;
    } catch (error) {
      console.error(
        `❌ Failed to update label text for '${currentBarElement.name}':`,
        error,
      );
    }
  }

  figma.notify(`✅ Adjusted bar heights & created ${numBars} bar elements!`);

  figma.currentPage.selection = [newInstance];
  figma.viewport.scrollAndZoomIntoView([newInstance]);
};
