import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";
import type { Student, StudentSynthesis, SynthesisEntry } from "../types";

type LsuLevel = "A" | "ECA" | "NA" | "NE";

const DOMAIN_ORDER = [
  "Français",
  "Mathématiques",
  "EPS",
  "Langues vivantes",
  "Questionner le monde",
  "Enseignements artistiques",
  "EMC",
];

// LSU positioning columns (left to right like the real LSU)
const LSU_COLUMNS: { key: LsuLevel; label: string; color: string }[] = [
  { key: "NA",  label: "Non atteints",           color: "#c62828" },
  { key: "ECA", label: "Partiellement atteints",  color: "#e65100" },
  { key: "A",   label: "Atteints",                color: "#2e7d32" },
  { key: "NE",  label: "Non évalué",              color: "#9e9e9e" },
];

function sortDomains(domains: string[]): string[] {
  return [...domains].sort((a, b) => {
    const ia = DOMAIN_ORDER.indexOf(a);
    const ib = DOMAIN_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function groupByDomain(entries: SynthesisEntry[]) {
  const map: Record<string, { subdomains: Record<string, SynthesisEntry[]> }> = {};
  for (const e of entries) {
    if (!map[e.domain]) map[e.domain] = { subdomains: {} };
    if (!map[e.domain].subdomains[e.subdomain]) map[e.domain].subdomains[e.subdomain] = [];
    map[e.domain].subdomains[e.subdomain].push(e);
  }
  return map;
}

export default function BilanPage() {
  const [period, setPeriod] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [synthesis, setSynthesis] = useState<StudentSynthesis | null>(null);
  const [appreciation, setAppreciation] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      const p = await invoke<string | null>("get_setting", { key: "current_period" });
      const per = p || "S1-2025-2026";
      setPeriod(per);
      const s = await invoke<Student[]>("list_students");
      setStudents(s);
      if (s.length > 0) setSelectedId(s[0].id);
    })().catch((e) => setStatus(String(e)));
  }, []);

  useEffect(() => {
    if (!selectedId || !period) return;
    setSynthesis(null);
    setAppreciation("");
    setTeacherNotes("");
    invoke<StudentSynthesis>("get_student_synthesis", { studentId: selectedId, period })
      .then(setSynthesis)
      .catch((e) => setStatus(String(e)));
    invoke<Record<string, string>>("list_appreciations", { studentId: selectedId, period })
      .then((map) => {
        setAppreciation(map["_global"] ?? "");
        setTeacherNotes(map["_notes"] ?? "");
      })
      .catch(() => {});
  }, [selectedId, period]);

  async function handleAppreciationBlur(text: string) {
    if (!selectedId) return;
    await invoke("save_appreciation", {
      input: { student_id: selectedId, period, domain: "_global", text },
    }).catch((e) => setStatus("✗ " + String(e)));
  }

  async function handleNotesBlur(text: string) {
    if (!selectedId) return;
    await invoke("save_appreciation", {
      input: { student_id: selectedId, period, domain: "_notes", text },
    }).catch((e) => setStatus("✗ " + String(e)));
  }

  async function generateAppreciations() {
    if (!synthesis || synthesis.entries.length === 0) return;
    setGenerating(true);
    setStatus("Génération des appréciations par l'IA…");
    try {
      const result = await invoke<{ appreciations: Record<string, string> }>(
        "generate_bilan",
        {
          input: {
            student_id: selectedId,
            student_name: synthesis.student.first_name,
            level: synthesis.student.level,
            period,
            entries: synthesis.entries.map((e) => ({
              domain: e.domain,
              subdomain: e.subdomain,
              competency: e.competency_label,
              synthesis: e.synthesis,
              lsu_level: e.lsu_level,
            })),
            teacher_notes: teacherNotes || null,
          },
        }
      );
      const globalText = result.appreciations["_global"] ?? Object.values(result.appreciations).join(" ");
      setAppreciation(globalText);
      await invoke("save_appreciation", {
        input: { student_id: selectedId, period, domain: "_global", text: globalText },
      });
      setStatus("✓ Appréciation générée et sauvegardée");
    } catch (e) {
      setStatus("✗ " + String(e));
    } finally {
      setGenerating(false);
      setTimeout(() => setStatus(""), 3000);
    }
  }

  function copyToClipboard() {
    if (!appreciation) return;
    navigator.clipboard.writeText(appreciation);
    setStatus("✓ Appréciation copiée dans le presse-papier");
    setTimeout(() => setStatus(""), 1500);
  }

  const grouped = synthesis ? groupByDomain(synthesis.entries) : {};
  const domains = sortDomains(Object.keys(grouped));

  // Count total competency rows for the table
  function countRows(subdomains: Record<string, SynthesisEntry[]>) {
    return Object.values(subdomains).reduce((sum, entries) => sum + entries.length, 0);
  }

  return (
    <section style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
      {/* ── Fil d'Ariane ── */}
      <nav aria-label="Fil d'Ariane" style={{ fontSize: "0.9em", opacity: 0.8, marginBottom: 8 }}>
        <span>
          <Link to="/students" style={{ textDecoration: "none" }}>Élèves</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span>{students.find((s) => s.id === selectedId)?.last_name} {students.find((s) => s.id === selectedId)?.first_name}</span>
          <span style={{ margin: "0 6px" }}>›</span>
          <span>Bilan</span>
        </span>
      </nav>

      <h2 style={{ marginTop: 0 }}>Bilan</h2>

      {/* ── Sélecteur élève ── */}
      <div className="row" style={{ gap: 12, marginBottom: 16, alignItems: "center" }}>
        <label>Élève :</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.currentTarget.value)}>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.last_name} {s.first_name} ({s.level})
            </option>
          ))}
        </select>
      </div>

      {students.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Ajoutez des élèves d'abord.</p>
      ) : synthesis && synthesis.entries.length === 0 ? (
        <p style={{ opacity: 0.6 }}>
          Aucune évaluation saisie pour cet élève sur cette période.
          <br />
          Allez dans l'onglet « Évaluations » pour commencer.
        </p>
      ) : domains.length > 0 ? (
        <>
          {/* ── En-tête LSU ── */}
          <div style={{
            background: "#f5f5f5",
            border: "1px solid #999",
            borderBottom: "none",
            padding: "10px 14px",
          }}>
            <div style={{ fontWeight: "bold", fontSize: "1.05em", marginBottom: 4 }}>
              Suivi des acquis scolaires de l'élève
            </div>
            <div style={{ fontSize: "0.85em", opacity: 0.8 }}>
              {synthesis?.student.last_name} {synthesis?.student.first_name} — {synthesis?.student.level} — {period}
            </div>
          </div>

          {/* ── Tableau principal LSU ── */}
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #999",
            fontSize: "0.85em",
          }}>
            {/* En-tête colonnes */}
            <thead>
              <tr>
                <th style={thDomain}>Domaines d'enseignement</th>
                <th style={thComp}>
                  Principaux éléments du programme travaillés durant la période
                </th>
                <th colSpan={LSU_COLUMNS.length} style={{
                  ...thBase,
                  textAlign: "center",
                  padding: "4px 0 0",
                  fontSize: "0.8em",
                }}>
                  Positionnement
                  <div style={{ display: "flex", justifyContent: "center", gap: 0, marginTop: 4 }}>
                    {LSU_COLUMNS.map((col) => (
                      <div
                        key={col.key}
                        title={col.label}
                        style={{
                          width: 40,
                          height: 16,
                          background: col.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "0.7em",
                          fontWeight: "bold",
                        }}
                      >
                        {col.key === "NE" ? "NE" : ""}
                      </div>
                    ))}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {domains.map((domain) => {
                const { subdomains } = grouped[domain];
                const subEntries = Object.entries(subdomains);

                return subEntries.map(([sub, entries], subIdx) =>
                  entries.map((entry, entryIdx) => {
                    const isFirstOfDomain = subIdx === 0 && entryIdx === 0;
                    const isFirstOfSub = entryIdx === 0;
                    const domainRowSpan = countRows(subdomains);

                    return (
                      <tr key={entry.competency_id}>
                        {/* Cellule domaine (fusionnée) */}
                        {isFirstOfDomain && (
                          <td
                            rowSpan={domainRowSpan}
                            style={{
                              ...cellBase,
                              background: "#4a7fc4",
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: "0.9em",
                              width: 120,
                              verticalAlign: "top",
                              padding: "8px 6px",
                              lineHeight: 1.3,
                            }}
                          >
                            {domain}
                          </td>
                        )}

                        {/* Cellule sous-domaine + compétence */}
                        <td style={{
                          ...cellBase,
                          padding: "4px 8px",
                          borderTop: isFirstOfSub ? "1px solid #999" : "1px solid #ddd",
                        }}>
                          {isFirstOfSub && (
                            <div style={{
                              fontWeight: 600,
                              fontSize: "0.85em",
                              color: "#555",
                              marginBottom: 2,
                            }}>
                              {sub}
                            </div>
                          )}
                          <div>{entry.competency_label}</div>
                        </td>

                        {/* Colonnes de positionnement : croix */}
                        {LSU_COLUMNS.map((col) => (
                          <td
                            key={col.key}
                            style={{
                              ...cellBase,
                              width: 40,
                              textAlign: "center",
                              verticalAlign: "middle",
                              borderTop: isFirstOfSub ? "1px solid #999" : "1px solid #ddd",
                              fontWeight: "bold",
                              fontSize: "1em",
                            }}
                          >
                            {entry.lsu_level === col.key ? "✕" : ""}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                );
              })}
            </tbody>
          </table>

          {/* ── Observations enseignant (pour l'IA) ── */}
          <div style={{ marginTop: 16, marginBottom: 12 }}>
            <label style={{ fontWeight: "bold", fontSize: "0.85em", display: "block", marginBottom: 4 }}>
              Observations facultatives pour l'IA (soin, écriture, attitude, bavardage, discipline…)
            </label>
            <textarea
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              onBlur={(e) => handleNotesBlur(e.target.value)}
              placeholder="Laisser vide si rien de particulier à signaler…"
              rows={2}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: "0.9em",
                lineHeight: 1.5,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* ── Appréciation générale ── */}
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #999",
            borderTop: "2px solid #999",
            marginTop: -1,
            fontSize: "0.85em",
          }}>
            <tbody>
              <tr>
                <td style={{
                  ...cellBase,
                  background: "#f5f5f5",
                  fontWeight: "bold",
                  padding: "8px 10px",
                }}>
                  Appréciation générale sur la progression de l'élève
                </td>
              </tr>
              <tr>
                <td style={{ ...cellBase, padding: 0 }}>
                  <textarea
                    value={appreciation}
                    onChange={(e) => setAppreciation(e.target.value)}
                    onBlur={(e) => handleAppreciationBlur(e.target.value)}
                    placeholder="Appréciation générale (sauvegardée automatiquement)…"
                    rows={5}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 10px",
                      border: "none",
                      fontSize: "0.95em",
                      lineHeight: 1.5,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Boutons ── */}
          <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button onClick={generateAppreciations} disabled={generating}>
              {generating ? "Génération en cours…" : "🤖 Générer l'appréciation"}
            </button>
            <button onClick={copyToClipboard}>
              📋 Copier l'appréciation
            </button>
          </div>
        </>
      ) : null}

      <p style={{ marginTop: 8, minHeight: 24 }}>{status}</p>
    </section>
  );
}

// ── Styles ──

const thBase: React.CSSProperties = {
  border: "1px solid #999",
  background: "#f5f5f5",
  padding: "6px 8px",
  fontWeight: "bold",
};

const thDomain: React.CSSProperties = {
  ...thBase,
  width: 120,
  textAlign: "left",
  verticalAlign: "middle",
};

const thComp: React.CSSProperties = {
  ...thBase,
  textAlign: "left",
};

const cellBase: React.CSSProperties = {
  border: "1px solid #999",
  verticalAlign: "top",
};
