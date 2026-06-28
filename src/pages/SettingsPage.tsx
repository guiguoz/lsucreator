import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type ModelId = "llama-3.3-70b-versatile" | "llama-3.1-8b-instant" | "mixtral-8x7b-32768";

async function getSetting(key: string) {
  return invoke<string | null>("get_setting", { key });
}

async function setSetting(key: string, value: string) {
  return invoke("set_setting", { input: { key, value } });
}

function nextPeriod(period: string): string {
  const match = period.match(/^S(\d+)-(\d{4})-(\d{4})$/);
  if (!match) return "";
  const sem = parseInt(match[1]);
  const year1 = parseInt(match[2]);
  const year2 = parseInt(match[3]);
  if (sem === 1) return `S2-${year1}-${year2}`;
  return `S1-${year2}-${year2 + 1}`;
}

export default function SettingsPage() {
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");

  const [_period, setPeriod] = useState("S1-2025-2026");
  const [semester, setSemester] = useState<"S1" | "S2">("S1");
  const [yearStart, setYearStart] = useState<number>(2025);
  const [model, setModel] = useState<ModelId>("llama-3.3-70b-versatile");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getSetting("current_period");
      if (p) {
        setPeriod(p);
        const m = p.match(/^S(1|2)-(\d{4})-(\d{4})$/);
        if (m) {
          setSemester(("S" + m[1]) as "S1" | "S2");
          setYearStart(parseInt(m[2]));
        }
      } else {
        const now = new Date();
        const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
        setYearStart(y);
        setSemester("S1");
        setPeriod(`S1-${y}-${y + 1}`);
      }

      const m = await getSetting("groq_model");
      const validModels: ModelId[] = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
      if (m && validModels.includes(m as ModelId)) setModel(m as ModelId);

      const k = await getSetting("groq_api_key");
      if (k) setApiKey(k);

      setLoaded(true);
    })().catch((e) => setStatus(String(e)));
  }, []);

  async function saveAll() {
    setStatus("Enregistrement...");
    const formatted = `${semester}-${yearStart}-${yearStart + 1}`;
    setPeriod(formatted);
    await setSetting("current_period", formatted);
    await setSetting("groq_model", model);
    await setSetting("groq_api_key", apiKey.trim());
    setStatus("✓ Enregistré");
    setTimeout(() => setStatus(""), 1200);
  }

  async function testKey() {
    setStatus("Test en cours...");
    try {
      const res = await invoke<{ ok: boolean; message: string }>("test_groq", {
        input: { api_key: apiKey, model },
      });
      setStatus(res.ok ? "✓ " + res.message : "✗ " + res.message);
    } catch (e) {
      setStatus("✗ Erreur: " + String(e));
    }
  }

  async function exportSqlite() {
    setStatus("Export SQLite…");
    try {
      const res = await invoke<{ ok?: boolean; path?: string; message?: string }>("export_sqlite");
      if ((res as any)?.ok) {
        setStatus(`✓ Exporté${res.path ? " : " + res.path : ""}`);
      } else {
        setStatus(res?.message ? `✗ ${res.message}` : "✗ Export SQLite indisponible");
      }
    } catch (e) {
      setStatus("✗ Export SQLite indisponible");
    } finally {
      setTimeout(() => setStatus(""), 2000);
    }
  }

  async function exportJson() {
    setStatus("Export JSON…");
    try {
      const res = await invoke<{ ok?: boolean; path?: string; message?: string }>("export_json");
      if ((res as any)?.ok) {
        setStatus(`✓ Exporté${res.path ? " : " + res.path : ""}`);
      } else {
        setStatus(res?.message ? `✗ ${res.message}` : "✗ Export JSON indisponible");
      }
    } catch (e) {
      setStatus("✗ Export JSON indisponible");
    } finally {
      setTimeout(() => setStatus(""), 2000);
    }
  }

  async function switchToNextPeriod() {
    const next = nextPeriod(`${semester}-${yearStart}-${yearStart + 1}`);
    if (!next) {
      setStatus("✗ Format de période non reconnu (attendu : S1-2025-2026)");
      return;
    }
    if (!window.confirm(`Passer au semestre ${next} ?`)) return;
    const m = next.match(/^S(1|2)-(\d{4})-(\d{4})$/);
    if (m) {
      setSemester(("S" + m[1]) as "S1" | "S2");
      setYearStart(parseInt(m[2]));
      setPeriod(next);
      await setSetting("current_period", next);
      setStatus(`✓ Période changée : ${next}`);
      setTimeout(() => setStatus(""), 2000);
    }
  }

  const suggested = nextPeriod(`${semester}-${yearStart}-${yearStart + 1}`);

  return (
    <section style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      <h2>Réglages</h2>

      <label style={{ display: "block", marginTop: 12 }}>Période courante</label>
      <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <label>
            <input
              type="radio"
              name="semester"
              value="S1"
              checked={semester === "S1"}
              onChange={() => setSemester("S1")}
              disabled={!loaded}
            />
            S1
          </label>
          <label>
            <input
              type="radio"
              name="semester"
              value="S2"
              checked={semester === "S2"}
              onChange={() => setSemester("S2")}
              disabled={!loaded}
            />
            S2
          </label>
        </div>
        <div className="row" style={{ gap: 6, alignItems: "center" }}>
          <span>Année scolaire</span>
          <input
            type="number"
            value={yearStart}
            onChange={(e) => setYearStart(parseInt(e.currentTarget.value || String(yearStart)))}
            min={2000}
            max={2100}
            step={1}
            style={{ width: 90 }}
            disabled={!loaded}
          />
          <span>→ {yearStart + 1}</span>
        </div>
        {suggested && (
          <button type="button" onClick={switchToNextPeriod} disabled={!loaded} style={{ whiteSpace: "nowrap" }}>
            → {suggested}
          </button>
        )}
      </div>

      <label style={{ display: "block", marginTop: 12 }}>Modèle Groq</label>
      <select
        value={model}
        onChange={(e) => setModel(e.currentTarget.value as ModelId)}
        disabled={!loaded}
      >
        <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (recommandé)</option>
        <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
        <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (rapide)</option>
      </select>

      <label style={{ display: "block", marginTop: 12 }}>Clé API Groq</label>
      <div className="row">
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.currentTarget.value)}
          placeholder="gsk_..."
          type={showKey ? "text" : "password"}
          disabled={!loaded}
        />
        <button type="button" onClick={() => setShowKey((v) => !v)} disabled={!loaded}>
          {showKey ? "Masquer" : "Afficher"}
        </button>
      </div>

      <label style={{ display: "block", marginTop: 20 }}>Données</label>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={exportSqlite} disabled={!loaded}>Exporter SQLite</button>
        <button type="button" onClick={exportJson} disabled={!loaded}>Exporter JSON</button>
      </div>

      <div className="row" style={{ marginTop: 16, gap: 8 }}>
        <button
          onClick={saveAll}
          disabled={!loaded || apiKey.trim() === ""}
        >
          Enregistrer
        </button>
        <button type="button" onClick={testKey} disabled={!loaded || apiKey.trim() === ""}>
          Tester la clé
        </button>
      </div>

      <p style={{ marginTop: 8, minHeight: 24 }}>{status}</p>
    </section>
  );
}
