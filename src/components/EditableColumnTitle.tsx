import React, { useState, useEffect } from "react";
import { MinusCircleOutlined } from "@ant-design/icons";
// ...other imports...

export default function EditableColumnTitle({ value, onChange, onDelete }: { value: string, onChange: (v: string) => void, onDelete: () => void }) {
  const [localValue, setLocalValue] = useState(value);

  // Keep localValue in sync if value changes from outside
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="d-flex align-items-center gap-1">
      <input
        className="form-control form-control-sm bg-dark text-white"
        style={{ minWidth: 80 }}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value) onChange(localValue);
        }}
        onKeyDown={e => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        onClick={e => e.stopPropagation()}
      />
      <button
        className="btn btn-link text-danger p-0 d-flex align-items-center"
        title="Delete Column"
        type="button"
        style={{ height: 24, width: 24 }}
        onClick={onDelete}
      >
        <MinusCircleOutlined style={{ fontSize: 14 }} />
      </button>
    </div>
  );
}