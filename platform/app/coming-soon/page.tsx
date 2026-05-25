"use client";

import { useState } from "react";
import { hu } from "@/messages/hu";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800 text-white px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">
            {hu.comingSoon.title}
          </h1>
          <p className="text-blue-200 text-lg">{hu.comingSoon.subtitle}</p>
        </div>

        {submitted ? (
          <p className="text-green-300 font-medium">{hu.comingSoon.thanks}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={hu.comingSoon.email}
              className="rounded-lg px-4 py-3 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-400 transition-colors rounded-lg px-4 py-3 font-semibold"
            >
              {hu.comingSoon.notify}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
