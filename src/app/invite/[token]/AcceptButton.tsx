"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/home-copy";
import { say } from "@/lib/desk-copy";

export default function AcceptButton({ token, label, lang }: { token: string; label: string; lang: Lang }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div style={{ marginTop: 16 }}>
      <button
        className="btn"
        onClick={async () => {
          const res = await fetch(`/api/invite/${token}`, { method: "POST" });
          const json = await res.json();
          if (!res.ok) return setError(say(lang, json.error || "Could not accept"));
          router.push("/dashboard");
        }}
      >
        {label}
      </button>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
