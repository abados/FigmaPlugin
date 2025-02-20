/// <reference types="@figma/plugin-typings" />
import Papa from "papaparse";

export function extractChartData(generatedChart: FrameNode) {
  let columns: any[] = [{ name: "Category", type: "string" }];
  let rows: any[] = [];
  let stackedBarNames: string[] = []; // ✅ Maintain correct order
  let hasStackedBars = false; // Flag to determine if we need "stacked" mode

  let columnChart = generatedChart.findOne(
    (node) =>
      node.type === "FRAME" &&
      node.name.trim().toLowerCase() === "column chart",
  ) as FrameNode | null;

  if (!columnChart) return null;

  // 🔹 First, collect all stacked bar names to preserve the correct order
  columnChart.children.forEach((barElement) => {
    if (barElement.type !== "FRAME") return;

    let barFrame = barElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    ) as FrameNode | null;

    if (!barFrame) return;

    barFrame.children.forEach((stackedBar) => {
      if (stackedBar.type === "RECTANGLE") {
        if (!stackedBarNames.includes(stackedBar.name)) {
          stackedBarNames.push(stackedBar.name); // ✅ Ensure correct order
        }
      }
    });
  });

  // 🔹 Extract values row-by-row
  columnChart.children.forEach((barElement) => {
    if (barElement.type !== "FRAME") return;

    let barFrame = barElement.findOne(
      (node) =>
        node.type === "FRAME" && node.name.trim().toLowerCase() === "bar frame",
    ) as FrameNode | null;

    let scaleTextNode = barElement.findOne(
      (node) =>
        node.type === "TEXT" &&
        node.name.trim().toLowerCase() === "values - do not delete",
    ) as TextNode | null;

    let originalValues: number[] = [];
    if (scaleTextNode) {
      let matches = scaleTextNode.characters.match(/Original: (.*) \| Max:/);
      if (matches && matches[1]) {
        originalValues = matches[1].split(", ").map((num) => parseFloat(num));
      }
    }

    if (!barFrame) return;

    //let barData: any = [barElement.name]; // First column is the category (X-axis)
    let extractedStackedBars: Record<string, number> = {};

    // 🔹 Map originalValues correctly to stacked bar names
    stackedBarNames.forEach((name, index) => {
      extractedStackedBars[name] = originalValues[index] || 0; // ✅ Explicitly assign 0 for missing values
    });

    if (Object.values(extractedStackedBars).filter((v) => v > 0).length > 1) {
      hasStackedBars = true; // ✅ Confirm stacked mode
    }

    // 🔹 Ensure all stacked bars exist in the correct order
    let rowValues = stackedBarNames.map((name) => extractedStackedBars[name]);

    rows.push([barElement.name, ...rowValues]); // ✅ Preserve correct order
  });

  // 🔹 Ensure correct column structure
  stackedBarNames.forEach((name) => {
    columns.push({ name, type: "number" });
  });

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "ColumnChart Configuration",
    type: "object",
    dataSet: {
      columns: columns,
      rows: rows,
    },
    dataOptions: {
      category: [{ name: "Category", type: "string" }],
      value: columns.slice(1).map((col) => ({
        name: col.name,
        aggregation: "sum",
      })),
      breakBy: [],
    },
    styleOptions: {
      subtype: hasStackedBars ? "stacked" : "normal",
      legend: { enabled: true, position: "right" },
      xAxis: { enabled: true, title: "Categories" },
      yAxis: { enabled: true, title: "Values" },
    },
    onBeforeRender:
      "function () { console.log('Customize chart before render'); }",
    onDataPointClick:
      "function (dataPoint) { console.log('Clicked on', dataPoint); }",
    onDataPointContextMenu:
      "function (event, dataPoint) { console.log('Context menu on', dataPoint); }",
    onDataPointsSelected:
      "function (selectedDataPoints) { console.log('Selected points', selectedDataPoints); }",
    onDataReady: "function (data) { console.log('Data ready', data); }",
  };
}

/**
 * ✅ Downloads JSON file from extracted data.
 */
export function downloadJSON(data: any, filename = "chart_data.json") {
  const jsonStr = JSON.stringify(data, null, 2);

  try {
    figma.ui.postMessage({
      type: "downloadJSON",
      jsonStr: jsonStr, // Send raw JSON text
      filename: filename,
    });
  } catch (error) {}
}

export function handleJsonImport(event: Event, setChartData: any) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if (e.target) {
        const jsonData = JSON.parse(e.target.result as string);
        setChartData(jsonData);

        parent.postMessage(
          {
            pluginMessage: {
              type: "import-json",
              chartData: jsonData,
            },
          },
          "*",
        );

        // 🔹 If in Create Mode, request chart creation immediately
        parent.postMessage(
          {
            pluginMessage: {
              type: "create-instance",
              chartData: jsonData, // ✅ Send chart data so Figma knows to use it
            },
          },
          "*",
        );
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  };
  reader.readAsText(file);
}

/**
 * ✅ Parses CSV file and sends to UI
 */
export function handleCsvImport(event: Event, setChartData: any) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];

  Papa.parse(file, {
    complete: (result) => {
      const csvData = result.data as string[][]; // Convert CSV rows into arrays
      const jsonData = convertCsvToJson(csvData);
      setChartData(jsonData);
      parent.postMessage(
        {
          pluginMessage: {
            type: "import-json",
            chartData: jsonData,
          },
        },
        "*",
      );
    },
    header: false, // Assume no headers
    skipEmptyLines: true,
  });
}

/**
 * ✅ Convert CSV to JSON Format
 */
export function convertCsvToJson(csvData: string[][]) {
  if (csvData.length < 2) {
    console.error("Invalid CSV format");
    return null;
  }

  // ✅ Extract column names from the first row
  const columnNames = csvData[0];

  // ✅ Convert rows into JSON format
  const rows = csvData.slice(1).map((row) => {
    return [row[0], ...row.slice(1).map((value) => parseFloat(value) || 0)];
  });

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "ColumnChart Configuration",
    type: "object",
    dataSet: {
      columns: columnNames.map((name) => ({ name, type: "number" })),
      rows: rows,
    },
    dataOptions: {
      category: [{ name: columnNames[0], type: "string" }],
      value: columnNames.slice(1).map((col) => ({
        name: col,
        aggregation: "sum",
      })),
      breakBy: [],
    },
    styleOptions: {
      subtype: "stacked",
      legend: { enabled: true, position: "right" },
      xAxis: { enabled: true, title: columnNames[0] },
      yAxis: { enabled: true, title: "Values" },
    },
  };
}
