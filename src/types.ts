export interface Student {
  id: string;
  last_name: string;
  first_name: string;
  level: string;
}

export interface Competency {
  id: string;
  domain: string;
  subdomain: string;
  label: string;
  keywords: string;
}

export interface Evaluation {
  id: string;
  title: string,
  competency_id: string;
  date: string;
  period: string;
}

export interface ResultEntry {
  id: string;
  student_id: string;
  evaluation_id: string;
  level: Level;
}

// 4 niveaux internes de l'enseignant + NE (non évalué)
export type Level = "A" | "AR" | "ECA" | "NA" | "NE";

export const LEVEL_LABELS: Record<Level, string> = {
  A: "Acquis",
  AR: "À renforcer",
  ECA: "En cours d'acquisition",
  NA: "Non acquis",
  NE: "Non évalué",
};

export const LEVEL_COLORS: Record<Level, string> = {
  A: "#2e7d32",
  AR: "#f9a825",
  ECA: "#e65100",
  NA: "#c62828",
  NE: "#9e9e9e",
};

export const LEVELS: Level[] = ["A", "AR", "ECA", "NA", "NE"];

// 3 niveaux du LSU officiel + NE
export type LsuLevel = "A" | "ECA" | "NA" | "NE";

export const LSU_LEVEL_LABELS: Record<LsuLevel, string> = {
  A: "Objectifs d'apprentissage atteints",
  ECA: "Objectifs d'apprentissage partiellement atteints",
  NA: "Objectifs d'apprentissage non atteints",
  NE: "Non évalué",
};

export interface SynthesisEntry {
  domain: string;
  subdomain: string;
  competency_label: string;
  competency_id: string;
  results: string[];
  synthesis: string;      // niveau interne (A/AR/ECA/NA)
  lsu_level: string;      // niveau LSU (A/ECA/NA)
}

export interface StudentSynthesis {
  student: Student;
  entries: SynthesisEntry[];
}
