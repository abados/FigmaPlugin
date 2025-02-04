figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async (msg) => {
  console.log("📩 Message received from UI:", msg);

  // ✅ Step 1: Get the selected instance
  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length === 0) {
    console.error("❌ No component selected!");
    figma.notify("❌ No component selected!");
    return;
  }

  const selectedComponent = selectedNodes[0];
  if (selectedComponent.type !== "INSTANCE") {
    console.error("❌ Selected item is not an instance of a component!");
    figma.notify("❌ Selected item is not an instance of a component!");
    return;
  }

  console.log("🔹 Using selected component...");

  // ✅ Step 2: Clone the instance and position it
  let newInstance = selectedComponent.clone();
  newInstance.name = "Generated Chart";
  newInstance.x += 300;
  newInstance.y += 100;
  figma.currentPage.appendChild(newInstance);
  console.log("✅ Cloned instance:", newInstance);

  // ✅ Step 3: DETACH instance to make it editable
  const detachedInstance = newInstance.detachInstance();
  console.log("🔓 Detached instance:", detachedInstance);

  // ✅ Step 4: Locate "Column Chart" inside the detached instance
  let columnChart = detachedInstance.children.find(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  );

  if (!columnChart) {
    console.error("❌ Could not find 'Column Chart' inside the instance.");
    figma.notify("❌ 'Column Chart' not found!");
    return;
  }

  console.log("✅ Found 'Column Chart':", columnChart);

  // ✅ Step 5: Print every child of "Column Chart"
  console.log(
    "📂 Direct children inside 'Column Chart':",
    columnChart.children.map((n) => `${n.name} (${n.type})`),
  );

  // ✅ Step 6: Locate "Bar Element" inside Column Chart
  let barElement = columnChart.children.find(
    (node) => node.name.trim().toLowerCase() === "bar element",
  );

  if (!barElement) {
    console.error("❌ Could not find 'Bar Element' inside Column Chart.");
    figma.notify("❌ 'Bar Element' not found!");
    return;
  }

  console.log("✅ Found 'Bar Element':", barElement);

  // ✅ Step 7: DETACH "Bar Element" if it's still an InstanceNode
  if (barElement.type === "INSTANCE") {
    console.log("🔓 Detaching 'Bar Element' because it's still an instance.");
    barElement = barElement.detachInstance();
    console.log("🔓 'Bar Element' is now detached and editable:", barElement);
  }

  // ✅ Step 8: Clone "Bar Element" and append multiple copies
  const numBars = msg.numBars || 1;
  const barHeight = msg.newHeight || 80;
  console.log(`🔹 Creating ${numBars} bar elements with height ${barHeight}px`);

  for (let i = 1; i < numBars; i++) {
    const newBarElement = barElement.clone();
    newBarElement.name = `Bar Element ${i + 1}`;
    newBarElement.y += i * (barHeight + 10); // Stack bars with spacing
    columnChart.appendChild(newBarElement);
    console.log(`✅ Added Bar Element: ${newBarElement.name}`);
  }

  console.log("🛠 Final bar elements count:", columnChart.children.length);
  figma.notify(`✅ Created ${numBars} bar elements!`);

  // ✅ Step 9: Resize "Column Chart" to fit all bars
  try {
    const totalBarHeight = numBars * (barHeight + 10); // Extra spacing
    columnChart.resize(columnChart.width, totalBarHeight);
    console.log("✅ Resized 'Column Chart' to fit new bars.");
  } catch (error) {
    console.error("❌ Error while resizing 'Column Chart':", error);
  }

  // ✅ Step 10: Select & Zoom
  figma.currentPage.selection = [detachedInstance];
  figma.viewport.scrollAndZoomIntoView([detachedInstance]);

  console.log(
    `🎉 Successfully created ${numBars} "Bar Element" inside the new instance!`,
  );
};
