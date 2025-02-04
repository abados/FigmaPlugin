import { useState } from "preact/hooks";
import "./app.css";

export function App() {
  const [count, setCount] = useState(5);

  const handleOnChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    setCount(parseInt(target.value));
  };

  const handleCreate = () => {
    parent.postMessage(
      { pluginMessage: { type: "create-shapes", count } },
      "*",
    );
  };

  const handleCancle = () => {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  };

  const handleCreateComponent = () => {
    parent.postMessage(
      { pluginMessage: { type: "create-components", count } },
      "*",
    );
  };

  return (
    <>
      <p>
        Count:{" "}
        <input
          id="count"
          type="number"
          value={count}
          onChange={handleOnChange}
        />
      </p>
      <button id="create" onClick={handleCreate}>
        Create
      </button>
      <button id="createComponent" onClick={handleCreateComponent}>
        Create Component
      </button>
      <button id="cancel" onClick={handleCancle}>
        Cancel
      </button>
    </>
  );
}
