"use client";

import Avvvatars from "avvvatars-react";

function MyAvatar({ value }: { value: string }) {
  return (
    <div style={{ width: 40, height: 40 }}>
      <Avvvatars value={value} style="shape" />
    </div>
  );
}

export default function CharacterMessage({ data }: any) {
  return (
    <div className="d-flex align-items-start gap-3 my-4">
      <MyAvatar value={data.character?.name} />
      <div className="flex-grow-1">
        <div className="fw-bold mb-2">{data.character?.name}</div>
        <div className="row">
          <div className="col bg-secondary text-white px-3 py-2 rounded me-2">
            <div className="fw-semibold">Response</div>
            <div className="mt-1 text-break">{data.response}</div>
          </div>

          <div className="col border border-light text-white px-3 py-2 rounded">
            <div className="fw-semibold">Evaluation</div>
            <div className="mt-1 text-break">{data.evaluation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

