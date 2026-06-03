import IncidentForm from "@/components/IncidentForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-blue-500">
          Incident Ingestion Pipeline
        </h1>
        <p className="text-neutral-400 text-sm">
          R&D Environment Tool for Multi-Agent Root Cause Analysis Simulation. Paste raw trace files below to pipe them into the asynchronous queue system.
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <IncidentForm />
      </div>
    </main>
  );
}