import { DEFAULT_STACKED_HEIGHTS, DEFAULT_COLORS } from "./constant";
import { setIsCreatingChart } from "./state";
import { extractChartData } from "./files";

export async function createNewChart(
  selectedComponent: InstanceNode | FrameNode,
  msg: any,
  isModifyMode: boolean,
) {
  console.log("🔄 Rebuilding Chart with Data:", msg);
  console.log("🔄 Rebuilding Chart with Data:", msg.chartData);

  setIsCreatingChart(true);
  figma.currentPage.selection = [selectedComponent];
  let newInstance: FrameNode;

  if (isModifyMode) {
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
  if (!columnChart) {
    figma.notify("❌ 'Column Chart' not found!");
    setIsCreatingChart(false); // ✅ Allow selection updates
    // ✅ Re-enable selection change
    return;
  }

  columnChart.layoutMode = "HORIZONTAL";
  columnChart.primaryAxisSizingMode = "FIXED";
  columnChart.counterAxisSizingMode = "FIXED";

  let templateBarElement = columnChart.findOne(
    (node) =>
      (node.type === "INSTANCE" &&
        node.name.trim().toLowerCase() === "bar element simple") ||
      node.name.trim().toLowerCase() === "bar element" ||
      node.name.trim().toLowerCase() === "bar element 1",
  );

  templateBarElement.name = "Bar Element 0";
  if (!templateBarElement) {
    figma.notify("❌ 'Bar Element Simple' not found!");
    return;
  }
  try {
    if (templateBarElement.type === "INSTANCE")
      templateBarElement = templateBarElement.detachInstance();

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
      .findAll((node) => node.type === "RECTANGLE")
      .forEach((bar) => {
        bar.remove();
      });
    columnChart
      .findAll(
        (node) =>
          node.type === "FRAME" &&
          node.name.toLowerCase().includes("bar element") &&
          node.id !== templateBarElement.id, // ✅ Keep the template
      )
      .forEach((barElement) => {
        barElement.remove();
      });

    // 🔹 **Determine Bar Data Source (Default vs. JSON Import)**
    let categories: string[];
    let stackedBars: string[];
    let rowData: any[];

    if (isModifyMode && msg.chartData) {
      // ✅ Importing from JSON
      const { dataSet } = msg.chartData;
      categories = dataSet.rows.map((row: any) => row[0]); // Bar names (X-axis)
      stackedBars = dataSet.columns.slice(1).map((col: any) => col.name); // Stacked bar names (Y-axis)
      rowData = dataSet.rows;
    } else {
      // ✅ Creating a new chart from default values
      categories = Array.from(
        { length: msg.numBars },
        (_, i) => `Bar Element ${i + 1}`,
      );
      stackedBars = Array.from(
        { length: DEFAULT_STACKED_HEIGHTS[0].length },
        (_, i) => `Stacked Bar ${i + 1}`,
      );
      rowData = categories.map((_, i) => [
        categories[i],
        ...DEFAULT_STACKED_HEIGHTS[i % DEFAULT_STACKED_HEIGHTS.length],
      ]);
    }

    const maxFromDefaults = Math.max(
      ...DEFAULT_STACKED_HEIGHTS.map((arr) => arr.length),
    );
    const maxFromJson = isModifyMode
      ? Math.max(
          ...rowData.map((row) =>
            row.slice(1).reduce((sum, val) => sum + (val || 0), 0),
          ),
        )
      : 0;
    const numStackedBars = isModifyMode ? stackedBars.length : maxFromDefaults;
    const numBars = categories.length;
    let maxSum = 0;

    for (let i = 0; i < numBars; i++) {
      let currentBarElement;
      let barFrame;
      if (i === 0 && !isModifyMode) {
        currentBarElement = templateBarElement;
      } else {
        currentBarElement = templateBarElement.clone();
      }
      columnChart.appendChild(currentBarElement);
      currentBarElement.name = `Bar Element ${i + 1}`;
      currentBarElement.layoutAlign = "STRETCH";
      currentBarElement.layoutGrow = 1;

      barFrame = currentBarElement.findOne(
        (node) =>
          node.type === "FRAME" &&
          node.name.trim().toLowerCase() === "bar frame",
      );

      if (!barFrame) {
        continue;
      }
      let yOffset = barFrame.height; // ✅ Fix: Start from the bottom of the frame
      // ✅ Remove "Bar 0" inside each cloned `barFrame`
      barFrame
        .findAll((node) => node.type === "RECTANGLE")
        .forEach((bar) => {
          bar.remove();
        });
      const { rowResults, maxSum } = findMaxAndSum(
        DEFAULT_STACKED_HEIGHTS,
        numStackedBars,
      );

      for (let j = 0; j < numStackedBars; j++) {
        let barHeight;
        let constantBarHeight;
        let barColor;
        if (isModifyMode && msg.chartData) {
          const realBarHeight = rowData[i][j + 1] || 0;
          if (!realBarHeight) continue;
          barHeight =
            maxSum > 0 ? (barFrame.height * realBarHeight) / maxSum : 0;
          //barHeight = stackedBarData.height;
          barColor = DEFAULT_COLORS[j % DEFAULT_COLORS.length];
        } else {
          constantBarHeight =
            DEFAULT_STACKED_HEIGHTS[i % DEFAULT_STACKED_HEIGHTS.length][j] || 0;
          barHeight =
            (barFrame.height * (constantBarHeight - 0)) / (maxSum - 0);
          barColor = DEFAULT_COLORS[j % DEFAULT_COLORS.length];
        }

        if (barHeight === 0) continue;

        let stackedBar = bar0Clone.clone(); // ✅ Use clone of original Bar 0
        stackedBar.name = `Stacked Bar ${j + 1}`;
        stackedBar.constraints = { horizontal: "STRETCH", vertical: "SCALE" };
        stackedBar.visible = true;
        barFrame.appendChild(stackedBar);
        stackedBar.resize(barFrame.width, barHeight);
        stackedBar.y = yOffset - barHeight; // ✅ Fix: Position bars correctly
        stackedBar.fills = [{ type: "SOLID", color: barColor }];
        yOffset -= barHeight; // ✅ Move the offset up for the next stacked bar
      }

      let newLabelFrame = currentBarElement.findOne(
        (node) => node.name.trim().toLowerCase() === "label frame",
      );

      let newLabelText = newLabelFrame.findOne(
        (node) =>
          (node.type === "TEXT" &&
            node.name.trim().toLowerCase() === "label") ||
          node.name.trim().toLowerCase() === "bucket 1" ||
          node.name.trim().toLowerCase() === "label 1" ||
          node.name.trim().toLowerCase() === "label text",
      );
      let scaleTextNode = newLabelFrame.findOne(
        (node) =>
          node.type === "TEXT" &&
          node.name.trim().toLowerCase() === "scale - do not delete",
      ) as TextNode | null;

      if (newLabelText && scaleTextNode) {
        await figma.loadFontAsync(newLabelText.fontName as FontName);
        newLabelText.characters = isModifyMode
          ? rowData[i][0] || `Label ${i + 1}`
          : `Label ${i + 1}`;
        const originalValues = rowData[i].slice(1).join(", "); // Convert array to string (e.g., "10, 30, 40")
        scaleTextNode.characters = `Original: ${originalValues} | Max: ${maxSum}`;
        console.log("originalValues", originalValues);
      }
    }

    let templateToDelete = columnChart.findOne(
      (node) =>
        node.type === "FRAME" && node.name.toLowerCase() === "bar element 0",
    );

    if (templateToDelete) {
      templateToDelete.remove();
    }
    setIsCreatingChart(false);
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
  } catch (error) {}
}

function findMaxAndSum(allHeights: number[][], numStackedBars: number) {
  let maxSum = 0; // To track the maximum sum across all rows
  let rowResults = allHeights.map((heights) => {
    let max = 0;
    let sum = 0;

    for (let i = 0; i < numStackedBars; i++) {
      if (heights[i] !== undefined) {
        max = Math.max(max, heights[i]);
        sum += heights[i];
      }
    }

    maxSum = Math.max(maxSum, sum); // Track the highest row sum

    return { max, sum };
  });

  return { rowResults, maxSum };
}
