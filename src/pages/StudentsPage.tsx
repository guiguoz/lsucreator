import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Student } from "../types";

const LEVELS = ["CE1", "CE2", "CM1", "CM2"];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [status, setStatus] = useState("");

  // État pour l'édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLastName, setEditLastName] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLevel, setEditLevel] = useState("");

  async function load() {
    const list = await invoke<Student[]>("list_students");
    setStudents(list);
  }

  useEffect(() => {
    load().catch((e) => setStatus(String(e)));
  }, []);

  async function addStudent() {
    if (!firstName.trim() || !lastName.trim()) return;
    setStatus("Ajout...");
    try {
      await invoke("create_student", {
        input: { last_name: lastName.trim(), first_name: firstName.trim(), level },
      });
      setLastName("");
      setFirstName("");
      await load();
      setStatus("✓ Élève ajouté");
      setTimeout(() => setStatus(""), 1200);
    } catch (e) {
      setStatus("✗ " + String(e));
    }
  }

  async function deleteStudent(id: string) {
    if (!window.confirm("Supprimer cet élève et toutes ses évaluations ?")) return;
    try {
      await invoke("delete_student", { id });
      await load();
    } catch (e) {
      setStatus("✗ " + String(e));
    }
  }

  function startEdit(s: Student) {
    setEditingId(s.id);
    setEditLastName(s.last_name);
    setEditFirstName(s.first_name);
    setEditLevel(s.level);
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      await invoke("update_student", {
        input: {
          id: editingId,
          last_name: editLastName.trim(),
          first_name: editFirstName.trim(),
          level: editLevel,
        },
      });
      setEditingId(null);
      await load();
    } catch (e) {
      setStatus("✗ " + String(e));
    }
  }

  return (
    <section style={{ width: "100%", maxWidth: 700, margin: "0 auto" }}>
      <h2>Élèves</h2>

      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.currentTarget.value)}
          placeholder="Nom"
          onKeyDown={(e) => e.key === "Enter" && addStudent()}
          style={{ flex: 1, minWidth: 140 }}
        />
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.currentTarget.value)}
          placeholder="Prénom"
          onKeyDown={(e) => e.key === "Enter" && addStudent()}
          style={{ flex: 1, minWidth: 140 }}
        />
        <select value={level} onChange={(e) => setLevel(e.currentTarget.value)}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button onClick={addStudent} disabled={!firstName.trim() || !lastName.trim()}>
          Ajouter
        </button>
      </div>

      {students.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Aucun élève enregistré.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Nom Prénom</th>
              <th style={thStyle}>Niveau</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const isEditing = editingId === s.id;
              return (
                <tr key={s.id}>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <input
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          placeholder="Nom"
                          style={{ width: "50%" }}
                        />
                        <input
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          placeholder="Prénom"
                          style={{ width: "50%" }}
                        />
                      </div>
                    ) : (
                      <span>
                        <strong>{s.last_name}</strong> {s.first_name}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)}>
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    ) : (
                      s.level
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} style={{ marginRight: 4 }}>💾</button>
                        <button onClick={() => setEditingId(null)}>✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(s)} style={{ marginRight: 4 }}>✎</button>
                        <button onClick={() => deleteStudent(s.id)}>✕</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
