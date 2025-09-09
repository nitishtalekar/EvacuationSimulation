"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import CharacterMessage from "@/components/CharacterMessage";
import { Table } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import EditableTableTitle from "@/components/EditableColumnTitle";
import "./table-dark.css";
import { useRouter } from "next/navigation";

export default function SimulationPage() {

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
    {
      name: "Dr. Jane Doe",
      profession: "Student",
      personality: "Kind",
    },
  ]);

  // const [tableData, setTableData] = useState<any[]>([]);
  // const [columns, setColumns] = useState<any[]>([]);
  const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);

  // Move static columns into state
  const [staticColumns, setStaticColumns] = useState([
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Profession", dataIndex: "profession", key: "profession" },
    { title: "Personality", dataIndex: "personality", key: "personality" },
  ]);

  const columns = useMemo(() => {
    // Delete row column
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

    // Static columns with delete button in header
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
              // Remove from staticColumns
              setStaticColumns(staticColumns.filter((_, i) => i !== colIdx));
              // Remove from each character
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

    // Dynamic columns (with editable title and delete button)
    const dynCols = dynamicColumns.map((col, colIdx) => ({
      title: (
        <EditableTableTitle
          value={col}
          onChange={(newVal) => {
            // Only update if the name actually changed and is not empty
            if (!newVal || newVal === col) return;

            // Update dynamicColumns
            const newCols = [...dynamicColumns];
            newCols[colIdx] = newVal;
            setDynamicColumns(newCols);

            // Update character data: rename property
            setCharacters((chars) =>
              chars.map((char) => {
                // If the property already exists, don't overwrite
                if (newVal in char) return char;
                const { [col]: oldValue, ...rest } = char;
                return {
                  name: char.name,
                  profession: char.profession,
                  personality: char.personality,
                  opinion_strength: char.opinion_strength,
                  additional_info: char.additional_info,
                  ...rest,
                  [newVal]: oldValue,
                };
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

    // Add column button at the end
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

  const [isSimulationComplete, setIsSimulationComplete] = useState(false);

  const [evacmsg, setEvacmsg] = useState(
    "Weather alert in your area. Seek shelter immediately."
  );
  const [systemPrompt, setSystemPrompt] = useState(
    "You are {name}, a {profession}. This is a message you recieve {evacmsg}. Please respond with if you will evacuate or not, and a small 10 word reason why."
  );
  const [evaluationPrompt, setEvaluationPrompt] = useState(
    "You are an impartial evaluator. Given the evacuation message: {evacmsg} and the following response: {response}, evaluate how appropriate the response is on a scale of -1 to 1, where -1 means completely inappropriate and 1 means completely appropriate. Provide only the numerical score as output."
  );
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [isRunning, setIsRunning] = useState(false);
  const [showInputs, setShowInputs] = useState(true);

  const updateCharacter = (index: number, field: string, value: any) => {
    const newChars = [...characters];
    (newChars[index] as any)[field] = value;
    setCharacters(newChars);
  };

  const addCharacter = () => {
    // Gather all column keys (static and dynamic)
    const allKeys = [
      ...staticColumns.map((col) => col.dataIndex),
      ...dynamicColumns,
    ];

    // Create a new character with all keys, defaulting to ""
    const newChar = allKeys.reduce<Partial<any>>(
      (acc, key) => ({ ...acc, [key]: "" }),
      {}
    );

    // Optionally set defaults for static fields
    newChar.name = "Test Character";
    newChar.profession = "Student";
    newChar.personality = "INTJ";

    setCharacters([...characters, newChar as any]);
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const handleStartSimulation = async () => {
    setMessages([]);
    setIsRunning(true);

    const payload = { characters, evacmsg, systemPrompt, evaluationPrompt };
    console.log("[handleStartSimulation] Payload:", payload);

    const response = await fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
    }

    try {
      console.log("[handleStartSimulation] Full buffer:", buffer);
      const json = JSON.parse(buffer);
      console.log("[handleStartSimulation] Results:", json.results);

      // just in case you still want to keep state in sync
      setMessages(json.results);
    } catch (err) {
      console.error("[handleStartSimulation] Failed to parse JSON:", err);
    }

    setIsRunning(false);
    setIsSimulationComplete(true);
  };

  return (
    <div className="container min-vh-100 text-white bg-dark py-4">
      <h1 className="fw-bold mb-5 text-center mt-5">
        Multi Agent Evaluation Program
      </h1>

      <div className="d-flex flex-row align-items-center justify-content-between mb-4 g-3">
        <button
          onClick={handleStartSimulation}
          disabled={isRunning}
          className={`btn ${
            isRunning ? "btn-secondary disabled" : "btn-primary"
          }`}
        >
          {isRunning ? "Running Simulation..." : "Start Simulation"}
        </button>

        <div className="d-flex justify-content-end align-items-center gap-3">
          {isSimulationComplete && (
            <div className="text-center mb-4">
              <button
                className="btn btn-success"
                onClick={() => {
                  const simulationData = {
                    characters,
                    evacmsg,
                    messages,
                  };

                  const blob = new Blob(
                    [JSON.stringify(simulationData, null, 2)],
                    {
                      type: "application/json",
                    }
                  );
                  const url = URL.createObjectURL(blob);

                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `simulation_${Date.now()}.json`; // filename
                  a.click();

                  URL.revokeObjectURL(url); // cleanup
                }}
              >
                Save Simulation
              </button>
            </div>
          )}
          <div className="text-center mb-4">
            <button
              className="btn btn-secondary"
              onClick={() => setShowInputs(!showInputs)}
            >
              {showInputs ? "Hide Settings" : "Show Settings"}
            </button>
          </div>
        </div>
      </div>

      <div className={`slide-toggle ${showInputs ? "open" : "closed"}`}>
        <div className="container border border-light rounded-4 p-4 bg-dark p-2">
          <div className="mb-4">
            <label className="form-label fw-semibold">
              Evacuation Message:
            </label>
            <textarea
              rows={3}
              className="form-control bg-dark text-white"
              value={evacmsg}
              onChange={(e) => setEvacmsg(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">System Prompt:</label>
            <textarea
              rows={5}
              className="form-control bg-dark text-white"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Evaluation Prompt:</label>
            <textarea
              rows={5}
              className="form-control bg-dark text-white"
              value={evaluationPrompt}
              onChange={(e) => setEvaluationPrompt(e.target.value)}
            />
          </div>

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

            <button
              className="btn btn-outline-light mb-3"
              onClick={addCharacter}
            >
              + Add Character
            </button>
          </div>
        </div>
      </div>

      <div
        className="bg-secondary bg-opacity-25 rounded-4 shadow p-4 overflow-auto mt-3"
        style={{ maxHeight: "80vh" }}
      >
        {messages.length > 0 ? (
          messages.map((msg, idx) => <CharacterMessage key={idx} data={msg} />)
        ) : (
          <p className="text-center text-white">
            No messages yet. Click [Start Simulation].
          </p>
        )}
      </div>
    </div>
  );
}
