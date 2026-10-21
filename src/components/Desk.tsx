"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NumberRow = {
  id: string;
  label: string;
  phoneE164: string;
  weight: number;
  isActive: boolean;
  dailyCap: number;
  hourStart: number | null;
  hourEnd: number | null;
  startsCount: number;
};

type LinkRow = {
  id: string;
  slug: string;
  name: string;
  strategy: "ROUND_ROBIN" | "WEIGHTED";
  prefill: string;
  isActive: boolean;
  stickyDays: number;
  numbers: NumberRow[];
  _count: { events: number };
};

type EventRow = {
  id: string;
  createdAt: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  note: string;
  number: { label: string; phoneE164: string };
  link: { name: string; slug: string };
};

type Workspace = { id: string; name: string; plan: "FREE" | "KLIK"; timezone: string };

export default function Desk({ email }: { email: string }) {
  const router = useRouter();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"links" | "log">("links");
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "" });

  async function load() {
    const [linksRes, eventsRes] = await Promise.all([fetch("/api/links"), fetch("/api/events")]);
    if (linksRes.status === 401) return router.push("/login");
    const linksJson = await linksRes.json();
    const eventsJson = await eventsRes.json();
    setWorkspace(linksJson.workspace);
    setLinks(linksJson.links ?? []);
    setEvents(eventsJson.events ?? []);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load the desk."));
  }, []);

  async function createLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        slug: String(data.get("slug") || "").toLowerCase(),
        strategy: data.get("strategy"),
        prefill: data.get("prefill") || "",
        stickyDays: Number(data.get("stickyDays") || 0),
      }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Could not create the link");
    e.currentTarget.reset();
    await load();
  }

  async function addNumber(linkId: string, form: HTMLFormElement) {
    setError("");
    const data = new FormData(form);
    const start = String(data.get("hourStart") || "");
    const end = String(data.get("hourEnd") || "");
    const res = await fetch(`/api/links/${linkId}/numbers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: data.get("label"),
        phone: data.get("phone"),
        weight: Number(data.get("weight") || 1),
        dailyCap: Number(data.get("dailyCap") || 0),
        hourStart: start === "" ? null : Number(start),
        hourEnd: end === "" ? null : Number(end),
      }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Could not add the number");
    form.reset();
    await load();
  }

  function publicUrl(slug: string) {
    const origin = window.location.origin;
    const u = new URL(`/r/${slug}`, origin);
    if (utm.source) u.searchParams.set("utm_source", utm.source);
    if (utm.medium) u.searchParams.set("utm_medium", utm.medium);
    if (utm.campaign) u.searchParams.set("utm_campaign", utm.campaign);
    return u.toString();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ae6ff]">Wzk.io — Who Ze Klik</p>
          <h1 className="mt-2 text-3xl font-extrabold">{workspace?.name ?? "Desk"}</h1>
          <p className="mt-1 text-sm text-[#8a8a96]">
            {email} · {workspace?.plan === "KLIK" ? "Klik plan · 10 links" : "Free · 1 link, 3 numbers"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold"
            onClick={async () => {
              await fetch("/api/plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: workspace?.plan === "KLIK" ? "FREE" : "KLIK" }),
              });
              await load();
            }}
          >
            {workspace?.plan === "KLIK" ? "Back to free" : "Use Klik plan"}
          </button>
          <button
            className="rounded-xl border border-white/15 px-3 py-2 text-sm"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {error && <p className="mt-4 text-sm text-[#ff8ab0]">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button className={`rounded-full px-4 py-2 text-sm font-bold ${tab === "links" ? "bg-[#25d366] text-[#04120a]" : "bg-white/5"}`} onClick={() => setTab("links")}>
          Links
        </button>
        <button className={`rounded-full px-4 py-2 text-sm font-bold ${tab === "log" ? "bg-[#25d366] text-[#04120a]" : "bg-white/5"}`} onClick={() => setTab("log")}>
          Klik log
        </button>
      </div>

      {tab === "links" && (
        <>
          <form onSubmit={createLink} className="mt-6 grid gap-2 rounded-2xl border border-white/10 p-4 sm:grid-cols-2">
            <input name="name" required placeholder="Link name" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <input name="slug" required placeholder="slug" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <select name="strategy" className="rounded-xl border border-white/10 bg-[#16161f] px-3 py-2">
              <option value="ROUND_ROBIN">Round robin</option>
              <option value="WEIGHTED">Weighted</option>
            </select>
            <input name="stickyDays" type="number" min={0} max={30} placeholder="Sticky days (0 = off)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <input name="prefill" placeholder="Prefilled first line (they still press send)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:col-span-2" />
            <button className="rounded-xl bg-[#25d366] py-2 font-bold text-[#04120a] sm:col-span-2">Create klik link</button>
          </form>

          <div className="mt-4 grid gap-2 rounded-2xl border border-[#9ae6ff]/20 bg-[#9ae6ff]/[0.04] p-4 sm:grid-cols-3">
            <input value={utm.source} onChange={(e) => setUtm({ ...utm, source: e.target.value })} placeholder="utm source" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <input value={utm.medium} onChange={(e) => setUtm({ ...utm, medium: e.target.value })} placeholder="utm medium" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <input value={utm.campaign} onChange={(e) => setUtm({ ...utm, campaign: e.target.value })} placeholder="utm campaign" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <p className="text-xs text-[#8a8a96] sm:col-span-3">These fields build an ad URL. A klik only means someone was sent to WhatsApp.</p>
          </div>

          <ul className="mt-6 space-y-4">
            {links.map((link) => (
              <li key={link.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold">{link.name}</h2>
                    <p className="text-sm text-[#8a8a96]">
                      /r/{link.slug} · {link.strategy === "WEIGHTED" ? "Weighted" : "Round robin"} · {link._count.events} kliks
                      {link.stickyDays > 0 ? ` · sticky ${link.stickyDays}d` : ""}
                      {!link.isActive ? " · paused" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg border border-white/15 px-3 py-1 text-xs font-bold"
                      onClick={async () => {
                        await navigator.clipboard.writeText(publicUrl(link.slug));
                      }}
                    >
                      Copy ad link
                    </button>
                    <a className="rounded-lg border border-white/15 px-3 py-1 text-xs font-bold" href={`/api/links/${link.id}/qr`}>
                      QR
                    </a>
                    <button
                      className="rounded-lg border border-white/15 px-3 py-1 text-xs"
                      onClick={async () => {
                        await fetch(`/api/links/${link.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isActive: !link.isActive }),
                        });
                        await load();
                      }}
                    >
                      {link.isActive ? "Pause" : "Resume"}
                    </button>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {link.numbers.map((n) => (
                    <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 text-[#c8c8d0]">
                      <span>
                        {n.label} · {n.phoneE164} · weight {n.weight} · {n.startsCount} kliks
                        {n.dailyCap > 0 ? ` · cap ${n.dailyCap}/day` : ""}
                        {n.hourStart != null && n.hourEnd != null ? ` · ${n.hourStart}:00–${n.hourEnd}:00` : ""}
                        {!n.isActive ? " · paused" : ""}
                      </span>
                      <button
                        className="text-xs text-[#9ae6ff]"
                        onClick={async () => {
                          await fetch(`/api/numbers/${n.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isActive: !n.isActive }),
                          });
                          await load();
                        }}
                      >
                        {n.isActive ? "Pause" : "Resume"}
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-3 grid gap-2 sm:grid-cols-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addNumber(link.id, e.currentTarget);
                  }}
                >
                  <input name="label" required placeholder="Name" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm" />
                  <input name="phone" required placeholder="+972..." className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm sm:col-span-2" />
                  <input name="weight" type="number" min={1} placeholder="Weight" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm" />
                  <input name="dailyCap" type="number" min={0} placeholder="Daily cap" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm" />
                  <button className="rounded-lg bg-white/10 text-sm font-bold">Add</button>
                  <input name="hourStart" type="number" min={0} max={23} placeholder="From hour" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm" />
                  <input name="hourEnd" type="number" min={0} max={23} placeholder="Until hour" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm" />
                </form>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "log" && (
        <ul className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10">
          {events.length === 0 && <li className="p-4 text-sm text-[#8a8a96]">No kliks yet. A klik is a handoff, not a chat.</li>}
          {events.map((event) => (
            <li key={event.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="font-bold">
                  {event.number.label} · {event.link.name}
                </p>
                <p className="text-xs text-[#8a8a96]">
                  {new Date(event.createdAt).toLocaleString()} · opened WhatsApp
                  {event.utmSource ? ` · ${event.utmSource}/${event.utmMedium}/${event.utmCampaign}` : ""}
                </p>
              </div>
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const note = new FormData(e.currentTarget).get("note");
                  await fetch(`/api/events/${event.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ note }),
                  });
                  await load();
                }}
              >
                <input name="note" defaultValue={event.note} placeholder="Note after the chat" className="w-56 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm" />
                <button className="text-xs font-bold text-[#9ae6ff]">Save</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
