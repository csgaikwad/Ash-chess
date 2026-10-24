
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Pencil, Plus, Search, Trash2, X } from "lucide-react";

export default function PhrasesPage() {
  const [phrases, setPhrases] = useState([]);
  const [ready, setReady] = useState(false);
  const [english, setEnglish] = useState("");
  const [bulgarian, setBulgarian] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  async function refreshPhrases() {
    const response = await fetch("/api/phrases", {
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Failed to load phrases");

    const data = await response.json();
    setPhrases(data);
  }

  useEffect(() => {
    refreshPhrases()
      .catch(() => setNotice("Could not load phrases"))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!notice) return;

    const t = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(t);
  }, [notice]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...phrases].sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    if (!q) return list;

    return list.filter(
      (p) =>
        p.english.toLowerCase().includes(q) ||
        p.bulgarian.toLowerCase().includes(q)
    );
  }, [phrases, query]);

  function resetForm() {
    setEnglish("");
    setBulgarian("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const en = english.trim();
    const bg = bulgarian.trim();

    if (!en || !bg) return;

    try {
      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `/api/phrases/${editingId}`
          : "/api/phrases",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            english: en,
            bulgarian: bg,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not save phrase");
      }

      await refreshPhrases();

      setNotice(isEditing ? "Phrase updated" : "Phrase saved");
      resetForm();
    } catch (error) {
      setNotice(error.message || "Could not save phrase");
    }
  }

  function startEditing(phrase) {
    setEditingId(phrase.id);
    setEnglish(phrase.english);
    setBulgarian(phrase.bulgarian);
    setPendingDelete(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deletePhrase(id) {
    try {
      const response = await fetch(`/api/phrases/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete phrase");
      }

      setPhrases((prev) => prev.filter((p) => p.id !== id));

      if (editingId === id) resetForm();

      setPendingDelete(null);
      setNotice("Phrase deleted");
    } catch (error) {
      setPendingDelete(null);
      setNotice(error.message || "Could not delete phrase");
    }
  }

  async function copyPhrase(phrase) {
    try {
      await navigator.clipboard.writeText(
        `${phrase.english}\n${phrase.bulgarian}`
      );
      setNotice("Copied");
    } catch {
      setNotice("Could not copy");
    }
  }

  return (
    <main className="min-h-screen bg-[#0c0e12] px-4 py-6 text-[#ece8e1] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-[#e6a15a] uppercase">
              Notebook
            </p>
            <h1 className="mt-1 font-serif text-3xl leading-none tracking-tight sm:text-4xl">
              Bulgarian phrases
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#9a9388]">
              Pair an English sentence with its Bulgarian line. Everything stays on this device.
            </p>
          </div>

          <div className="hidden shrink-0 rounded-full border border-[#2a3038] px-3 py-1 text-xs text-[#9a9388] sm:block">
            {phrases.length} saved
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#2a3038] bg-[#171b22] p-4 sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {editingId ? "Edit phrase" : "New phrase"}
            </h2>
            {editingId && (
              <span className="text-xs text-[#e6a15a]">Editing</span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#9a9388]">
                English
                <span className="tabular-nums text-[#6d675f]">
                  {english.length}/1000
                </span>
              </span>
              <textarea
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                maxLength={1000}
                required
                rows={3}
                placeholder="Good morning everyone"
                className="w-full resize-y rounded-xl border border-[#2a3038] bg-[#101318] px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#e6a15a]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#9a9388]">
                Bulgarian
                <span className="tabular-nums text-[#6d675f]">
                  {bulgarian.length}/1000
                </span>
              </span>
              <textarea
                value={bulgarian}
                onChange={(e) => setBulgarian(e.target.value)}
                maxLength={1000}
                required
                rows={3}
                placeholder="Добро утро на всички"
                className="w-full resize-y rounded-xl border border-[#2a3038] bg-[#101318] px-3 py-2.5 font-serif text-base leading-relaxed outline-none focus:border-[#e6a15a]"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#e6a15a] px-4 text-sm font-semibold text-[#0c0e12] hover:bg-[#c4843a]"
            >
              {editingId ? (
                <Check className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {editingId ? "Update phrase" : "Add phrase"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2a3038] px-4 text-sm font-medium text-[#9a9388]"
              >
                <X className="size-4" />
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="mt-6">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6d675f]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phrases"
              className="h-11 w-full rounded-xl border border-[#2a3038] bg-[#171b22] pr-3 pl-9 text-sm outline-none placeholder:text-[#6d675f] focus:border-[#e6a15a]"
            />
          </div>

          {!ready ? (
            <p className="py-10 text-center text-sm text-[#9a9388]">
              Loading phrases…
            </p>
          ) : phrases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2a3038] px-4 py-12 text-center">
              <p className="font-serif text-lg">Nothing saved yet</p>
              <p className="mt-1 text-sm text-[#9a9388]">
                Add your first pair above.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#9a9388]">
              No matches for “{query.trim()}”.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((phrase) => (
                <li
                  key={phrase.id}
                  className={`rounded-2xl border bg-[#171b22] p-3.5 sm:p-4 ${
                    editingId === phrase.id
                      ? "border-[#e6a15a]"
                      : "border-[#2a3038]"
                  }`}
                >
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
                    <div>
                      <p className="text-[11px] font-medium tracking-wider text-[#6d675f] uppercase">
                        English
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">
                        {phrase.english}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium tracking-wider text-[#6d675f] uppercase">
                        Bulgarian
                      </p>
                      <p className="mt-1 font-serif text-base leading-relaxed">
                        {phrase.bulgarian}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-[#2a3038] pt-2.5">
                    <button
                      type="button"
                      onClick={() => startEditing(phrase)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#e6a15a]"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => copyPhrase(phrase)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#9a9388]"
                    >
                      <Copy className="size-3.5" />
                      Copy
                    </button>

                    {pendingDelete === phrase.id ? (
                      <span className="ml-auto flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => deletePhrase(phrase.id)}
                          className="inline-flex min-h-10 items-center rounded-lg px-2.5 text-xs font-medium text-[#e07a6a]"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(null)}
                          className="inline-flex min-h-10 items-center rounded-lg px-2.5 text-xs font-medium text-[#9a9388]"
                        >
                          Keep
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(phrase.id)}
                        className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#e07a6a]"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center px-4">
          <p className="rounded-full border border-[#2a3038] bg-[#171b22] px-4 py-2 text-sm shadow-lg">
            {notice}
          </p>
        </div>
      )}
    </main>
  );
}
