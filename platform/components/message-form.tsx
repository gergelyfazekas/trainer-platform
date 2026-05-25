"use client";

import { useState } from "react";
import { hu } from "@/messages/hu";

export function MessageForm({ trainerId }: { trainerId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trainer_id: trainerId,
        sender_name: name,
        sender_email: email,
        message_body: body,
        honeypot,
      }),
    });

    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return <p className="text-green-700 font-medium">{hu.contact.success}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-semibold text-gray-900">{hu.contact.title}</h3>

      {/* honeypot — hidden from real users */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{hu.contact.name}</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{hu.contact.email}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{hu.contact.message}</label>
        <textarea
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={inputClass}
        />
      </div>

      {status === "error" && <p className="text-red-600 text-sm">{hu.contact.error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
      >
        {status === "sending" ? "…" : hu.contact.submit}
      </button>
    </form>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
