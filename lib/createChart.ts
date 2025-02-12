import { DEFAULT_STACKED_HEIGHTS, DEFAULT_COLORS } from "./constant";
import { setIsCreatingChart } from "./state";

export async function createNewChart(
  selectedComponent: InstanceNode | FrameNode,
  msg: any,
  isModifyMode: boolean,
) {
  setIsCreatingChart(true);
  figma.currentPage.selection = [selectedComponent];
  let newInstance: FrameNode;

  if (isModifyMode) {
    console.log("+++++++++++isModifyMode", isModifyMode);
    console.log("+++++++++++isModifyMode", isModifyMode);
    newInstance = selectedComponent as FrameNode;
  } else {
    newInstance = selectedComponent.clone();
    newInstance.name = "Generated Chart";
    newInstance.x += 300;
    newInstance.y += 100;
    figma.currentPage.appendChild(newInstance);
    newInstance = newInstance.detachInstance();
  }

  let columnChart = newInstance.findChild(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  );
  console.log("+++++++++++columnChart", columnChart);
  if (!columnChart) {
    figma.notify("❌ 'Column Chart' not found!");
    setIsCreatingChart(false); // ✅ Allow selection updates
    // ✅ Re-enable selection change
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
      node.name.trim().toLowerCase() === "bar element" ||
      node.name.trim().toLowerCase() === "bar element 1",
  );
  console.log("+++++++++++templateBarElement", templateBarElement);

  if (!templateBarElement) {
    figma.notify("❌ 'Bar Element Simple' not found!");
    return;
  }
  try {
    if (templateBarElement.type === "INSTANCE")
      templateBarElement = templateBarElement.detachInstance();
    console.log("✅ Detached 'Bar Element' to use as a clean template");

    let templateBarFrame = templateBarElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    );
    console.log("+++++++++++templateBarFrame", templateBarFrame);
    if (!templateBarFrame) {
      figma.notify("❌ 'Bar Frame' not found in template!");
      return;
    }

    let templateBarRect = templateBarFrame.findOne(
      (node) => node.type === "RECTANGLE",
    ) as RectangleNode | null;

    console.log("+++++++++++templateBarRect", templateBarRect);
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
    console.log("+++++++++++templateBarFrame", templateBarFrame);

    const maxFromDefaults = Math.max(
      ...DEFAULT_STACKED_HEIGHTS.map((arr) => arr.length),
    );
    const maxFromJson = msg.chartData
      ? Math.max(...msg.chartData.bars.map((b: any) => b.stackedBars.length), 0)
      : 0;

    const numStackedBars = isModifyMode ? maxFromJson : maxFromDefaults;

    const defaultNumBars = msg.numBars;
    const jsonNumBars = msg.chartData ? msg.chartData.bars.length : 0;
    const numBars = isModifyMode ? jsonNumBars : defaultNumBars;

    for (let i = 0; i < numBars; i++) {
      let currentBarElement;
      let barFrame;

      if (i === 0 && !isModifyMode) {
        currentBarElement = templateBarElement;
        console.log("currentBarElement", currentBarElement);
        console.log("+++++++++++++++++", i);
      } else {
        currentBarElement = templateBarElement.clone();
        console.log("currentBarElement", currentBarElement);
        console.log("+++++++++++++++++", i);
      }

      columnChart.appendChild(currentBarElement);
      currentBarElement.name = `Bar Element ${i + 1}`;
      console.log(`✅ Appended cloned bar to columnChart (index: ${i})`);

      currentBarElement.layoutAlign = "STRETCH";
      currentBarElement.layoutGrow = 1;

      barFrame = currentBarElement.findOne(
        (node) =>
          node.type === "FRAME" &&
          node.name.trim().toLowerCase() === "bar frame",
      );

      if (!barFrame) {
        console.warn(`⚠️ No 'Bar Frame' found in '${currentBarElement.name}'`);
        continue;
      }
      console.log("++++++++barFrame.height", barFrame.height);
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
        let barHeight;
        let barColor;
        console.log("++++++++isModifyMode", isModifyMode);
        if (isModifyMode && msg.chartData) {
          const stackedBarData =
            msg.chartData.bars[i].stackedBars[j] || undefined;
          if (!stackedBarData) continue;
          console.log("++++++++stackedBarData.height", stackedBarData.height);
          barHeight = stackedBarData.height;
          barColor = stackedBarData.color;
        } else {
          console.log(
            "barHeight",
            DEFAULT_STACKED_HEIGHTS[i % DEFAULT_STACKED_HEIGHTS.length][j],
          );
          barHeight =
            DEFAULT_STACKED_HEIGHTS[i % DEFAULT_STACKED_HEIGHTS.length][j] || 0;
          barColor = DEFAULT_COLORS[j % DEFAULT_COLORS.length];
        }

        if (barHeight === 0) continue;

        let stackedBar = bar0Clone.clone(); // ✅ Use clone of original Bar 0
        stackedBar.name = `Stacked Bar ${j + 1}`;
        stackedBar.constraints = { horizontal: "STRETCH", vertical: "SCALE" };
        stackedBar.visible = true;
        barFrame.appendChild(stackedBar);
        console.log("✅ Added stackedBar:", stackedBar.name);
        console.log(barHeight);
        stackedBar.resize(barFrame.width, barHeight);
        stackedBar.y = yOffset - barHeight; // ✅ Fix: Position bars correctly
        stackedBar.fills = [{ type: "SOLID", color: barColor }];
        yOffset -= barHeight + barSpacing; // ✅ Move the offset up for the next stacked bar
      }

      let newLabelFrame = currentBarElement.findOne(
        (node) => node.name.trim().toLowerCase() === "label frame",
      );

      let newLabelText = newLabelFrame.findOne(
        (node) =>
          (node.type === "TEXT" &&
            node.name.trim().toLowerCase() === "label") ||
          node.name.trim().toLowerCase() === "bucket 1" ||
          node.name.trim().toLowerCase() === "label 1",
      );

      if (newLabelText) {
        console.log(`Label ${i + 1}`);
        await figma.loadFontAsync(newLabelText.fontName as FontName);
        newLabelText.characters = isModifyMode
          ? msg.chartData.bars[i].label || `Label ${i + 1}`
          : `Label ${i + 1}`;
        console.log(`✅ Updated Label Text for Bar ${i + 1}`);
      }
    }
    setIsCreatingChart(false);
    console.log("🔍 Final columnChart Children:", columnChart.children);
    figma.notify(`✅ Adjusted bar heights & created ${numBars} bar elements!`);
    figma.currentPage.selection = [newInstance];
    figma.viewport.scrollAndZoomIntoView([newInstance]);

    figma.ui.postMessage({
      type: "chart-created",
      chartData: extractChartData(newInstance),
    });
    // ✅ Extract chart data and send to UI for download
    //const chartData = extractChartData(columnChart);
    //downloadJSON(chartData);
  } catch (error) {
    console.error("🚨 Error occurred in createNewChart:", error);
    console.error("🚨 Error occurred in createNewChart:", error.stack);
  }
}
