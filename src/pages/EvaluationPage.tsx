import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Student, Competency, Level } from "../types";
import { LEVELS, LEVEL_LABELS, LEVEL_COLORS } from "../types";

interface EvalWithComp {
  id: string;
  title: string;
  competency_id: string;
  competency_label: string;
  domain: string;
  subdomain: string;
  date: string;
  period: string;
}

interface ResultEntry {
  id: string;
  student_id: string;
  evaluation_id: string;
  level: string;
}

type Step = "input" | "match" | "results" | "browse";

export default function EvaluationPage() {
  const [period, setPeriod] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<EvalWithComp[]>([]);
  const [levelFilter, setLevelFilter] = useState("");

  const [step, setStep] = useState<Step>("input");

  // Step 1: input
  const [compText, setCompText] = useState("");
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Step 2: match
  const [matches, setMatches] = useState<Competency[]>([]);
  const [searching, setSearching] = useState(false);

  // Custom competency creation
  const [customDomain, setCustomDomain] = useState("Autre");
  const [customSubdomain, setCustomSubdomain] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  // Step 3: results
  const [currentEval, setCurrentEval] = useState<EvalWithComp | null>(null);
  const [results, setResults] = useState<ResultEntry[]>([]);

  const [status, setStatus] = useState("");

  const loadEvaluations = useCallback(async (per: string) => {
    const evals = await invoke<EvalWithComp[]>("list_evaluations", { period: per });
    setEvaluations(evals);
  }, []);

  useEffect(() => {
    setCustomLabel(compText);
  }, [compText]);

  async function handleCreateCustom() {
    if (!customLabel.trim() || !customDomain.trim() || !customSubdomain.trim()) return;
    try {
      const comp = await invoke<Competency>("create_custom_competency", {
        input: {
          domain: customDomain,
          subdomain: customSubdomain,
          label: customLabel.trim(),
          levels: levelFilter || "CE1,CE2", // Default to both if none selected
          query: compText,
        },
      });
      await selectCompetency(comp);
    } catch (e) {
      setStatus("✗ " + String(e));
    }
  }

  useEffect(() => {
    (async () => {
      const p = await invoke<string | null>("get_setting", { key: "current_period" });
      const per = p || "S1-2025-2026";
      setPeriod(per);
      const s = await invoke<Student[]>("list_students");
      setStudents(s);
      await loadEvaluations(per);
    })().catch((e) => setStatus(String(e)));
  }, [loadEvaluations]);

  // Step 1 → 2: search for matching competencies
  async function searchCompetency() {
    if (!compText.trim()) return;
    setSearching(true);
    try {
      const results = await invoke<Competency[]>("match_competency", {
        query: compText.trim(),
        level: levelFilter || null,
      });
      setMatches(results);
      if (results.length > 0) {
        setStep("match");
      } else {
        setStatus("Aucune compétence trouvée. Essayez d'autres mots-clés.");
        setTimeout(() => setStatus(""), 2000);
      }
    } catch (e) {
      setStatus("✗ " + String(e));
    } finally {
      setSearching(false);
    }
  }

  // Step 2 → 3: user picks a competency, create evaluation
  async function selectCompetency(comp: Competency) {
    try {
      const ev = await invoke<{ id: string; title: string; competency_id: string; date: string; period: string }>(
        "create_evaluation",
        {
          input: {
            title: compText.trim(),
            competency_id: comp.id,
            date: evalDate,
            period,
          },
        }
      );
      const evalWithComp: EvalWithComp = {
        ...ev,
        competency_label: comp.label,
        domain: comp.domain,
        subdomain: comp.subdomain,
      };
      setCurrentEval(evalWithComp);
      setResults([]);
      setStep("results");
      await loadEvaluations(period);
    } catch (e) {
      setStatus("✗ " + String(e));
    }
  }

  // Load results for an existing evaluation (browse mode)
  async function openEvaluation(ev: EvalWithComp) {
    setCurrentEval(ev);
    const res = await invoke<ResultEntry[]>("list_results_for_evaluation", {
      evaluationId: ev.id,
    });
    setResults(res);
    setStep("results");
  }

  async function setResult(studentId: string, level: Level) {
    if (!currentEval) return;
    try {
      const saved = await invoke<ResultEntry>("save_result", {
        input: {
          student_id: studentId,
          evaluation_id: currentEval.id,
          level,
        },
      });
      setResults((prev) => {
        const filtered = prev.filter((r) => r.student_id !== studentId);
        return [...filtered, saved];
      });
    } catch (e) {
      setStatus("✗ " + String(e));
    }
  }

  async function setAllResults(level: Level) {
    if (!currentEval) return;
    try {
      const saved: ResultEntry[] = [];
      for (const s of filteredStudents) {
        const r = await invoke<ResultEntry>("save_result", {
          input: { student_id: s.id, evaluation_id: currentEval.id, level },
        });
        saved.push(r);
      }
      setResults((prev) => {
        const otherIds = new Set(filteredStudents.map((s) => s.id));
        const kept = prev.filter((r) => !otherIds.has(r.student_id));
        return [...kept, ...saved];
      });
    } catch (e) {
      setStatus("✗ " + String(e));
    }
  }

  async function deleteEval(id: string) {
    if (!window.confirm("Supprimer cette évaluation et tous ses résultats ?")) return;
    await invoke("delete_evaluation", { id });
    setEvaluations((prev) => prev.filter((e) => e.id !== id));
    if (currentEval?.id === id) {
      setCurrentEval(null);
      setStep("input");
    }
  }

  function getResult(studentId: string): Level | "" {
    const r = results.find((r) => r.student_id === studentId);
    return r ? (r.level as Level) : "";
  }

  function reset() {
    setStep("input");
    setCompText("");
    setMatches([]);
    setCurrentEval(null);
    setResults([]);
  }

  const levels = [...new Set(students.map((s) => s.level))].sort();
  const filteredStudents = levelFilter ? students.filter((s) => s.level === levelFilter) : students;
  const filledCount = results.filter((r) => filteredStudents.some((s) => s.id === r.student_id)).length;
  const totalCount = filteredStudents.length;

  return (
    <section style={{ width: "100%", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Évaluations — {period}</h2>
        {step !== "input" && (
          <button onClick={reset} style={{ fontSize: "0.85em" }}>
            ← Nouvelle évaluation
          </button>
        )}
      </div>

      {/* ── STEP 1: Saisie libre ── */}
      {step === "input" && (
        <>
          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px" }}>Saisir une compétence évaluée</h3>
            <p style={{ fontSize: "0.9em", opacity: 0.7, margin: "0 0 12px" }}>
              Décrivez ce que vous avez évalué et l'app trouvera la compétence LSU correspondante.
            </p>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {levels.length > 1 && (
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.currentTarget.value)}
                  style={{ fontSize: "0.9em", width: 80 }}
                >
                  <option value="">Niveau</option>
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
              <input
                value={compText}
                onChange={(e) => setCompText(e.currentTarget.value)}
                placeholder="ex: dictée de mots invariables, tables de multiplication…"
                style={{ flex: 1, minWidth: 200 }}
                onKeyDown={(e) => e.key === "Enter" && searchCompetency()}
              />
              <input
                type="date"
                value={evalDate}
                onChange={(e) => setEvalDate(e.currentTarget.value)}
                style={{ width: 150 }}
              />
              <button onClick={searchCompetency} disabled={!compText.trim() || searching}>
                {searching ? "Recherche…" : "Associer"}
              </button>
            </div>
          </div>

          {/* Historique */}
          {evaluations.length > 0 && (
            <div>
              <h3>Évaluations du semestre</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Intitulé</th>
                    <th style={thStyle}>Compétence LSU</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev) => (
                    <tr key={ev.id}>
                      <td style={tdStyle}>{ev.date}</td>
                      <td style={tdStyle}>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); openEvaluation(ev); }}
                          style={{ cursor: "pointer" }}
                        >
                          {ev.title}
                        </a>
                      </td>
                      <td style={{ ...tdStyle, fontSize: "0.85em", opacity: 0.7 }}>
                        {ev.domain} › {ev.subdomain}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => deleteEval(ev.id)}
                          style={{ padding: "2px 8px", fontSize: "0.8em" }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── STEP 2: Association compétence ── */}
      {step === "match" && (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: "0 0 4px" }}>
            Associer « {compText} » à une compétence
          </h3>
          <p style={{ fontSize: "0.9em", opacity: 0.7, margin: "0 0 16px" }}>
            Sélectionnez la compétence du LSU qui correspond :
          </p>

          {matches.map((c, i) => (
            <div
              key={c.id}
              onClick={() => selectCompetency(c)}
              style={{
                padding: "10px 14px",
                marginBottom: 6,
                borderRadius: 6,
                cursor: "pointer",
                border: "1px solid #ddd",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(57,108,216,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: "0.8em", opacity: 0.6, marginBottom: 2 }}>
                {i === 0 ? "⭐ " : ""}
                {c.domain} › {c.subdomain}
              </div>
              <div>{c.label}</div>
            </div>
          ))}

          {matches.length === 0 && (
            <p style={{ opacity: 0.6 }}>Aucune compétence trouvée.</p>
          )}

          <div style={{ marginTop: 24, padding: 16, background: "rgba(0,0,0,0.03)", borderRadius: 8, border: "1px dashed #ccc" }}>
            <h4 style={{ margin: "0 0 12px" }}>Créer une compétence personnalisée</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="row" style={{ gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8em", opacity: 0.7, display: "block", marginBottom: 4 }}>Domaine</label>
                  <select
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px" }}
                  >
                    <option value="Français">Français</option>
                    <option value="Mathématiques">Mathématiques</option>
                    <option value="EPS">EPS</option>
                    <option value="Langues vivantes">Langues vivantes</option>
                    <option value="Questionner le monde">Questionner le monde</option>
                    <option value="Enseignements artistiques">Enseignements artistiques</option>
                    <option value="EMC">EMC</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8em", opacity: 0.7, display: "block", marginBottom: 4 }}>Sous-domaine</label>
                  <input
                    value={customSubdomain}
                    onChange={(e) => setCustomSubdomain(e.target.value)}
                    placeholder="ex: Géométrie, Conjugaison..."
                    style={{ width: "100%", padding: "6px 8px" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8em", opacity: 0.7, display: "block", marginBottom: 4 }}>Intitulé de la compétence</label>
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="ex: Savoir poser une division..."
                  style={{ width: "100%", padding: "6px 8px" }}
                />
              </div>
              <button
                onClick={handleCreateCustom}
                disabled={!customLabel.trim() || !customDomain.trim() || !customSubdomain.trim()}
                style={{ alignSelf: "flex-end" }}
              >
                Créer et évaluer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Saisie des résultats ── */}
      {step === "results" && currentEval && (
        <>
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(57,108,216,0.08)",
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: "bold" }}>{currentEval.title}</div>
            <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
              {currentEval.date} — {currentEval.domain} › {currentEval.subdomain} › {currentEval.competency_label}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Résultats par élève</h3>
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              {levels.length > 1 && (
                <select value={levelFilter} onChange={(e) => setLevelFilter(e.currentTarget.value)} style={{ fontSize: "0.85em" }}>
                  <option value="">Tous les niveaux</option>
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
              <span style={{ fontSize: "0.85em", opacity: 0.7 }}>
                {filledCount}/{totalCount} saisis
              </span>
            </div>
          </div>

          {students.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Ajoutez des élèves dans l'onglet « Élèves ».</p>
          ) : (
            <>
              <div className="row" style={{ gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85em", opacity: 0.7 }}>Tout le monde →</span>
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setAllResults(l)}
                    title={`Attribuer ${LEVEL_LABELS[l]} à tous les élèves affichés`}
                    style={{
                      padding: "4px 12px",
                      fontSize: "0.85em",
                      border: `1px solid ${LEVEL_COLORS[l]}`,
                      background: "transparent",
                      color: LEVEL_COLORS[l],
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Élève</th>
                    {LEVELS.map((l) => (
                      <th key={l} style={{ ...thStyle, textAlign: "center", width: 70 }} title={LEVEL_LABELS[l]}>
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const current = getResult(s.id);
                    return (
                      <tr key={s.id}>
                        <td style={tdStyle}>
                          {s.last_name} {s.first_name}{" "}
                          <span style={{ opacity: 0.5, fontSize: "0.85em" }}>({s.level})</span>
                        </td>
                        {LEVELS.map((l) => (
                          <td key={l} style={{ ...tdStyle, textAlign: "center" }}>
                            <button
                              onClick={() => setResult(s.id, l)}
                              style={{
                                padding: "4px 10px",
                                fontWeight: current === l ? "bold" : "normal",
                                background: current === l ? LEVEL_COLORS[l] : "transparent",
                                color: current === l ? "#fff" : "inherit",
                                border: current === l ? "none" : "1px solid #ccc",
                                borderRadius: 4,
                                cursor: "pointer",
                                minWidth: 36,
                              }}
                            >
                              {l}
                            </button>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </>
      )}

      <p style={{ marginTop: 8, minHeight: 24 }}>{status}</p>
    </section>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "2px solid #ccc",
  padding: "6px 8px",
};

const tdStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: "1px solid #eee",
};
