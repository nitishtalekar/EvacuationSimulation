"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import CharacterMessage from "@/components/CharacterMessage";
import { Table } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import EditableTableTitle from "@/components/EditableColumnTitle";
import "./table-dark.css";
import { useRouter } from "next/navigation";

export default function AutoSimulationPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (!data.authenticated) router.push("/");
    };
    checkSession();
  }, [router]);

  const [characters, setCharacters] = useState<any[]>([
    { name: "Dr. Jane Doe", profession: "Student", personality: "Kind" },
  ]);

  const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);
  const [staticColumns, setStaticColumns] = useState([
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Profession", dataIndex: "profession", key: "profession" },
    { title: "Personality", dataIndex: "personality", key: "personality" },
  ]);

  const columns = useMemo(() => {
    const deleteRowCol = {
      title: "",
      key: "delete",
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <button
          className="btn btn-link text-danger p-0 d-flex justify-content-center align-items-center"
          title="Delete Row"
          onClick={() => removeCharacter(index)}
          type="button"
          style={{ height: 32, width: 32 }}
        >
          <MinusCircleOutlined style={{ fontSize: 16 }} />
        </button>
      ),
      width: 48,
    };

    const staticCols = staticColumns.map((col, colIdx) => ({
      ...col,
      title: (
        <div className="d-flex align-items-center gap-1">
          <span>{col.title}</span>
          <button
            className="btn btn-link text-danger p-0 d-flex align-items-center"
            title="Delete Column"
            type="button"
            style={{ height: 24, width: 24 }}
            onClick={() => {
              setStaticColumns(staticColumns.filter((_, i) => i !== colIdx));
              setCharacters((chars) =>
                chars.map((char) => {
                  const { [col.dataIndex]: __, ...rest } = char;
                  return rest as any;
                })
              );
            }}
          >
            <MinusCircleOutlined style={{ fontSize: 14 }} />
          </button>
        </div>
      ),
      render: (_: any, record: any, index: number) => (
        <input
          className="form-control bg-dark text-white"
          value={characters[index][col.dataIndex] || ""}
          onChange={(e) =>
            updateCharacter(index, col.dataIndex, e.target.value)
          }
        />
      ),
    }));

    const dynCols = dynamicColumns.map((col, colIdx) => ({
      title: (
        <EditableTableTitle
          value={col}
          onChange={(newVal) => {
            if (!newVal || newVal === col) return;
            const newCols = [...dynamicColumns];
            newCols[colIdx] = newVal;
            setDynamicColumns(newCols);
            setCharacters((chars) =>
              chars.map((char) => {
                if (newVal in char) return char;
                const { [col]: oldValue, ...rest } = char;
                return { ...rest, [newVal]: oldValue };
              })
            );
          }}
          onDelete={() => {
            const newCols = dynamicColumns.filter((_, i) => i !== colIdx);
            setDynamicColumns(newCols);
            setCharacters((chars) =>
              chars.map((char) => {
                const { [col]: __, ...rest } = char;
                return rest as any;
              })
            );
          }}
        />
      ),
      dataIndex: col,
      key: col,
      render: (_: any, record: any, index: number) => (
        <input
          className="form-control bg-dark text-white"
          value={characters[index][col] || ""}
          onChange={(e) => updateCharacter(index, col, e.target.value)}
        />
      ),
    }));

    const addColButton = {
      title: (
        <button
          className="btn btn-link text-success p-0 d-flex justify-content-center align-items-center"
          title="Add Column"
          type="button"
          style={{ height: 32, width: 32 }}
          onClick={() => {
            let colNum = 1;
            let newColName = `Column ${colNum}`;
            while (
              dynamicColumns.includes(newColName) ||
              staticColumns.some((c) => c.key === newColName)
            ) {
              colNum += 1;
              newColName = `Column ${colNum}`;
            }
            setDynamicColumns([...dynamicColumns, newColName]);
            setCharacters((chars) =>
              chars.map((char) => ({ ...char, [newColName]: "" }))
            );
          }}
        >
          <PlusCircleOutlined style={{ fontSize: 18 }} className="text-white" />
        </button>
      ),
      key: "add-column",
      align: "center" as const,
      width: 48,
      render: () => null,
    };

    return [deleteRowCol, ...staticCols, ...dynCols, addColButton];
  }, [characters, dynamicColumns, staticColumns]);

  const tableData = useMemo(
    () => characters.map((char, index) => ({ key: index, ...char })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characters]
  );

  const [evacMessages, setEvacMessages] = useState<string[]>([
    "Severe weather alert in your area. Evacuate immediately.",
  ]);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are {name}, a {profession}. This is a message you receive: {evacmsg}. Please respond if you will evacuate or not, with a short reason."
  );
  const [evaluationPrompt, setEvaluationPrompt] = useState(
    "You are an impartial evaluator. Given the evacuation message: {evacmsg} and the response: {response}, score appropriateness from -1 to 1. Output only the number."
  );

  const [allMessages, setAllMessages] = useState<
    { evacmsg: string; messages: { role: string; content: string }[] }[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateCharacter = (index: number, field: string, value: any) => {
    const newChars = [...characters];
    (newChars[index] as any)[field] = value;
    setCharacters(newChars);
  };

  const addCharacter = () => {
    const allKeys = [
      ...staticColumns.map((col) => col.dataIndex),
      ...dynamicColumns,
    ];
    const newChar = allKeys.reduce<Partial<any>>(
      (acc, key) => ({ ...acc, [key]: "" }),
      {}
    );
    newChar.name = "Test Character";
    newChar.profession = "Student";
    newChar.personality = "INTJ";
    setCharacters([...characters, newChar as any]);
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const handleStartAutoSimulation = async () => {
    setAllMessages([]);
    setIsRunning(true);

    for (const msg of evacMessages) {
      const payload = {
        characters,
        evacmsg: msg,
        systemPrompt,
        evaluationPrompt,
      };
      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.body) continue;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
      }

      try {
        const json = JSON.parse(buffer);
        setAllMessages((prev) => [
          ...prev,
          { evacmsg: msg, messages: json.results },
        ]);
      } catch (err) {
        console.error("Failed to parse JSON:", err);
      }
    }

    setIsRunning(false);
  };

  return (
    <div className="container min-vh-100 text-white bg-dark py-4">
      <h1 className="fw-bold mb-5 text-center mt-5">Auto Simulation</h1>

      {/* System Prompt */}
      <div className="mb-3">
        <label className="form-label fw-semibold">System Prompt:</label>
        <textarea
          rows={4}
          className="form-control bg-dark text-white"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
      </div>

      {/* Evaluation Prompt */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Evaluation Prompt:</label>
        <textarea
          rows={4}
          className="form-control bg-dark text-white"
          value={evaluationPrompt}
          onChange={(e) => setEvaluationPrompt(e.target.value)}
        />
      </div>

      {/* Evac Messages */}
      <div className="mb-4">
        <label className="form-label fw-semibold">Evacuation Messages:</label>
        {evacMessages.map((msg, idx) => (
          <div key={idx} className="d-flex gap-2 mb-2">
            <textarea
              rows={2}
              className="form-control bg-dark text-white"
              value={msg}
              onChange={(e) => {
                const newMsgs = [...evacMessages];
                newMsgs[idx] = e.target.value;
                setEvacMessages(newMsgs);
              }}
            />
            <button
              className="btn btn-danger"
              onClick={() =>
                setEvacMessages(evacMessages.filter((_, i) => i !== idx))
              }
            >
              <MinusCircleOutlined />
            </button>
          </div>
        ))}
        <button
          className="btn btn-success mt-2"
          onClick={() => setEvacMessages([...evacMessages, ""])}
        >
          <PlusCircleOutlined /> Add Message
        </button>
      </div>

      {/* Characters Table */}
      <div className="mb-4 px-2">
        <h5 className="fw-semibold mb-3">Characters</h5>
        <div className="table-responsive mb-3">
          <Table
            className="ant-table-dark"
            dataSource={tableData}
            columns={columns}
            pagination={false}
            bordered
            size="middle"
          />
        </div>
        <button className="btn btn-outline-light mb-3" onClick={addCharacter}>
          + Add Character
        </button>
      </div>

      {/* Start Auto Simulation */}
      <div className="mb-4 d-flex align-items-center gap-3">
        <button
          className={`btn ${isRunning ? "btn-secondary" : "btn-primary"}`}
          onClick={handleStartAutoSimulation}
          disabled={isRunning}
        >
          {isRunning ? "Running Auto Simulation..." : "Start Auto Simulation"}
        </button>

        {!isRunning && allMessages.length > 0 && (
          <button
            className="btn btn-success"
            onClick={() => {
              const simulationData = {
                characters,
                systemPrompt,
                evaluationPrompt,
                evacMessages,
                allMessages,
              };

              const blob = new Blob([JSON.stringify(simulationData, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);

              const a = document.createElement("a");
              a.href = url;
              a.download = `auto_simulation_${Date.now()}.json`;
              a.click();

              URL.revokeObjectURL(url); // cleanup
            }}
          >
            Save Simulation
          </button>
        )}
      </div>

      {/* Simulation Messages */}
      {allMessages.map((sim, idx) => (
        <div
          key={idx}
          className="bg-secondary bg-opacity-25 rounded-4 shadow p-4 overflow-auto mt-3"
          style={{ maxHeight: "50vh" }}
        >
          <h5>Evacuation Message: {sim.evacmsg}</h5>
          {sim.messages.length > 0 ? (
            sim.messages.map((msg, i) => (
              <CharacterMessage key={i} data={msg} />
            ))
          ) : (
            <p className="text-center text-white">No messages yet.</p>
          )}
        </div>
      ))}
    </div>
  );
}
