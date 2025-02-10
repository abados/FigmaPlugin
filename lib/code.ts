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
    [0, 25, 35],
    [15, 0, 50],
    [30, 30, 20],
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
};
