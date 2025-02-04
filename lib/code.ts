figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "create-instance") {
    const selectedNode = figma.currentPage.selection[0];

    if (!selectedNode) {
      console.error("❌ No selection found.");
      figma.notify(
        "❌ Please select 'Single Column Chart' before running the plugin.",
      );
      return;
    }

    // Ensure it's a component
    if (selectedNode.type !== "COMPONENT") {
      console.error("❌ Selected item is not a component.");
      figma.notify("❌ The selected item must be a component.");
      return;
    }

    // Create an instance
    let chartInstance = (selectedNode as ComponentNode).createInstance();
    figma.currentPage.appendChild(chartInstance);
    figma.currentPage.selection = [chartInstance];
    figma.viewport.scrollAndZoomIntoView([chartInstance]);

    console.log("🎉 Instance successfully created!");

    // Try finding the bar element inside the instance
    const barElement = chartInstance.findOne(
      (node) => node.name === "Bar" && node.type === "RECTANGLE",
    ) as RectangleNode;

    if (!barElement) {
      console.error("❌ Could not find the Bar element inside the instance.");
      figma.notify("❌ Bar element not found.");
      return;
    }

    console.log("📏 Found Bar Element:", barElement);

    // Resize the bar
    const newHeight = msg.newHeight || 100; // Default height if none is provided
    barElement.resize(barElement.width, newHeight);
    console.log(`📏 Updated Bar height to: ${newHeight}px`);

    figma.notify("✅ Bar height updated!");
  }
};
