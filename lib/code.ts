// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 500, height: 500 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg: { type: string; count: number }) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "create-shapes") {
    // This plugin creates rectangles on the screen.
    const numberOfRectangles = msg.count;

    const nodes: SceneNode[] = [];
    for (let i = 0; i < numberOfRectangles; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  } else if (msg.type === "create-components") {
    // Create a component instead of a rectangle
    const component = figma.createComponent();
    component.name = "Custom Component";

    // Set component size
    component.resize(200, 150);

    // Set a background fill
    component.fills = [{ type: "SOLID", color: { r: 0, g: 0.5, b: 1 } }];

    // Add a text layer inside the component
    const text = figma.createText();
    text.characters = "Hello, Component!";
    text.resize(180, 40);
    text.x = 10;
    text.y = 55;

    // Load font before applying text (important!)
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    // Append text inside the component
    component.appendChild(text);

    // Add the component to the current page
    figma.currentPage.appendChild(component);

    // Select and zoom into the component
    figma.currentPage.selection = [component];
    figma.viewport.scrollAndZoomIntoView([component]);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};
