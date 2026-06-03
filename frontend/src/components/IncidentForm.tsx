"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { IncidentIngestSchema, IncidentIngestType } from "@/types/schemas";

export default function IncidentForm() {
  // Setup component local state initialized to our schema fields
  const [formData, setFormData] = useState<IncidentIngestType>({
    workspace_id: "workspace-demo",
    service_name: "",
    raw_log: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setResponseMsg("");

    // Validate using our client-side Zod schema contract
    const validation = IncidentIngestSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Fire off the validated payload to our backend route
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMsg(`✅ Success: ${data.message} | Payload: ${JSON.stringify(data)}`);
        setFormData((prev) => ({ ...prev, raw_log: "" })); // Clear the log window
      } else {
        setResponseMsg(`❌ Server Error: ${JSON.stringify(data.detail)}`);
      }
    } catch (err) {
      setResponseMsg("❌ Network connection failed. Is FastAPI running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-neutral-900 p-6 rounded-lg border border-neutral-800">
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1">Workspace ID</label>
        <input
          type="text"
          value={formData.workspace_id}
          onChange={(e) => setFormData({ ...formData, workspace_id: e.target.value })}
          className="w-full bg-neutral-950 text-white border border-neutral-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        />
        {errors.workspace_id && <p className="text-red-400 text-xs mt-1">{errors.workspace_id}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1">Service Name</label>
        <input
          type="text"
          placeholder="e.g., payment-service"
          value={formData.service_name}
          onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
          className="w-full bg-neutral-950 text-white border border-neutral-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        />
        {errors.service_name && <p className="text-red-400 text-xs mt-1">{errors.service_name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1">Raw Error Stack Trace</label>
        <div className="border border-neutral-700 rounded overflow-hidden">
          <Editor
            height="250px"
            defaultLanguage="plaintext"
            theme="vs-dark"
            value={formData.raw_log}
            onChange={(val) => setFormData({ ...formData, raw_log: val || "" })}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        {errors.raw_log && <p className="text-red-400 text-xs mt-1">{errors.raw_log}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition disabled:bg-neutral-700"
      >
        {loading ? "Processing Pipeline Ingestion..." : "Submit Incident Log"}
      </button>

      {responseMsg && <p className="text-sm font-mono text-center p-2 bg-neutral-950 rounded border border-neutral-800">{responseMsg}</p>}
    </form>
  );
}