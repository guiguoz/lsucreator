use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{
  sqlite::{SqliteConnectOptions, SqlitePoolOptions},
  Row, SqlitePool,
};
use std::path::PathBuf;
use tauri::{path::BaseDirectory, Manager, State};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
  db: SqlitePool,
}

fn now() -> String {
  Utc::now().to_rfc3339()
}

// ── Students ──────────────────────────────────────────────

#[derive(Serialize)]
struct Student {
  id: String,
  last_name: String,
  first_name: String,
  level: String,
}

#[derive(Deserialize)]
struct CreateStudentInput {
  last_name: String,
  first_name: String,
  level: String,
}

#[derive(Deserialize)]
struct UpdateStudentInput {
  id: String,
  last_name: String,
  first_name: String,
  level: String,
}

#[tauri::command]
async fn create_student(
  state: State<'_, AppState>,
  input: CreateStudentInput,
) -> Result<Student, String> {
  let id = Uuid::new_v4().to_string();
  sqlx::query("INSERT INTO students (id, last_name, first_name, level, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(&id)
    .bind(&input.last_name)
    .bind(&input.first_name)
    .bind(&input.level)
    .bind(now())
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;
  Ok(Student { id, last_name: input.last_name, first_name: input.first_name, level: input.level })
}

#[tauri::command]
async fn update_student(
  state: State<'_, AppState>,
  input: UpdateStudentInput,
) -> Result<Student, String> {
  sqlx::query("UPDATE students SET last_name = ?, first_name = ?, level = ? WHERE id = ?")
    .bind(&input.last_name)
    .bind(&input.first_name)
    .bind(&input.level)
    .bind(&input.id)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;
  Ok(Student { id: input.id, last_name: input.last_name, first_name: input.first_name, level: input.level })
}

#[tauri::command]
async fn list_students(state: State<'_, AppState>) -> Result<Vec<Student>, String> {
  let rows = sqlx::query("SELECT id, last_name, first_name, level FROM students ORDER BY last_name, first_name")
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;
  Ok(rows.into_iter().map(|r| Student {
    id: r.get("id"), last_name: r.get("last_name"), first_name: r.get("first_name"), level: r.get("level"),
  }).collect())
}

#[tauri::command]
async fn delete_student(state: State<'_, AppState>, id: String) -> Result<(), String> {
  sqlx::query("DELETE FROM students WHERE id = ?")
    .bind(&id).execute(&state.db).await.map_err(|e| e.to_string())?;
  Ok(())
}

// ── Competencies ──────────────────────────────────────────

#[derive(Serialize, Clone)]
struct Competency {
  id: String,
  domain: String,
  subdomain: String,
  label: String,
  keywords: String,
}

#[derive(Deserialize)]
struct CreateCustomCompetencyInput {
  domain: String,
  subdomain: String,
  label: String,
  levels: String,
  query: Option<String>,
}

fn generate_keywords(label: &str, query: Option<&str>) -> String {
  let stopwords = ["les","des","de","la","le","du","en","et","ou","un","une","au","aux","par","sur","dans","pour","qui","que","d","l","j","s","y"];
  let mut seen = std::collections::HashSet::new();
  let mut words = Vec::new();
  let combined = format!("{} {}", label, query.unwrap_or(""));
  for raw_word in combined.split_whitespace() {
    let w: String = raw_word.chars()
      .filter(|c: &char| c.is_alphabetic())
      .collect::<String>()
      .to_lowercase();
    if w.len() >= 3 && !stopwords.contains(&w.as_str()) && seen.insert(w.clone()) {
      words.push(w);
    }
  }
  words.join("|")
}

#[tauri::command]
async fn create_custom_competency(
  state: State<'_, AppState>,
  input: CreateCustomCompetencyInput,
) -> Result<Competency, String> {
  let id = format!("custom-{}", Uuid::new_v4());
  sqlx::query(
    "INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES (?, ?, ?, ?, ?, ?)"
  )
  .bind(&id)
  .bind(&input.domain)
  .bind(&input.subdomain)
  .bind(&input.label)
  .bind(generate_keywords(&input.label, input.query.as_deref()))
  .bind(&input.levels)
  .execute(&state.db)
  .await
  .map_err(|e| e.to_string())?;

  Ok(Competency {
    id,
    domain: input.domain,
    subdomain: input.subdomain,
    keywords: generate_keywords(&input.label, input.query.as_deref()),
    label: input.label,
  })
}

#[tauri::command]
async fn list_competencies(state: State<'_, AppState>) -> Result<Vec<Competency>, String> {
  let rows = sqlx::query(
    "SELECT id, domain, subdomain, label, keywords FROM competencies ORDER BY domain, subdomain, label"
  ).fetch_all(&state.db).await.map_err(|e| e.to_string())?;
  Ok(rows.into_iter().map(|r| Competency {
    id: r.get("id"), domain: r.get("domain"), subdomain: r.get("subdomain"),
    label: r.get("label"), keywords: r.get("keywords"),
  }).collect())
}

/// Search competencies by free text — scores each competency and returns best matches
#[tauri::command]
async fn match_competency(
  state: State<'_, AppState>,
  query: String,
  level: Option<String>,
) -> Result<Vec<Competency>, String> {
  // Fetch all competencies and score them locally for better fuzzy matching
  let rows = sqlx::query(
    "SELECT id, domain, subdomain, label, keywords, levels FROM competencies"
  ).fetch_all(&state.db).await.map_err(|e| e.to_string())?;

  let query_lower = query.trim().to_lowercase();
  let query_words: Vec<&str> = query_lower.split_whitespace().collect();

  let mut scored: Vec<(i32, Competency)> = rows.into_iter().filter_map(|r| {
    // Filter by level if specified
    if let Some(ref lvl) = level {
      let levels_str: String = r.get("levels");
      if !levels_str.split(',').any(|l| l.trim() == lvl.as_str()) {
        return None;
      }
    }

    let comp = Competency {
      id: r.get("id"), domain: r.get("domain"), subdomain: r.get("subdomain"),
      label: r.get("label"), keywords: r.get("keywords"),
    };

    let label_lower = comp.label.to_lowercase();
    let keywords_lower = comp.keywords.to_lowercase();
    let subdomain_lower = comp.subdomain.to_lowercase();
    let all_text = format!("{} {} {} {}", label_lower, keywords_lower, subdomain_lower, comp.domain.to_lowercase());

    let mut score: i32 = 0;

    // Exact substring match in label: highest priority
    if label_lower.contains(&query_lower) {
      score += 100;
    }

    // Keyword match
    for kw in keywords_lower.split('|') {
      let kw = kw.trim();
      if !kw.is_empty() && query_lower.contains(kw) {
        score += 20;
      }
      if !kw.is_empty() && kw.contains(&query_lower) {
        score += 15;
      }
    }

    // Word-by-word matching
    for word in &query_words {
      if word.len() < 2 { continue; }
      if all_text.contains(word) {
        score += 10;
      }
    }

    if score > 0 { Some((score, comp)) } else { None }
  }).collect();

  scored.sort_by(|a, b| b.0.cmp(&a.0));
  scored.truncate(10);

  Ok(scored.into_iter().map(|(_, c)| c).collect())
}

// ── Evaluations ───────────────────────────────────────────

#[derive(Serialize)]
struct Evaluation {
  id: String,
  title: String,
  competency_id: String,
  date: String,
  period: String,
}

#[derive(Deserialize)]
struct CreateEvaluationInput {
  title: String,
  competency_id: String,
  date: String,
  period: String,
}

#[tauri::command]
async fn create_evaluation(
  state: State<'_, AppState>,
  input: CreateEvaluationInput,
) -> Result<Evaluation, String> {
  let id = Uuid::new_v4().to_string();
  sqlx::query(
    "INSERT INTO evaluations (id, title, competency_id, date, period, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
  .bind(&id).bind(&input.title).bind(&input.competency_id)
  .bind(&input.date).bind(&input.period).bind(now())
  .execute(&state.db).await.map_err(|e| e.to_string())?;
  Ok(Evaluation {
    id, title: input.title, competency_id: input.competency_id,
    date: input.date, period: input.period,
  })
}

#[derive(Serialize)]
struct EvaluationWithComp {
  id: String,
  title: String,
  competency_id: String,
  competency_label: String,
  domain: String,
  subdomain: String,
  date: String,
  period: String,
}

#[tauri::command]
async fn list_evaluations(
  state: State<'_, AppState>,
  period: String,
) -> Result<Vec<EvaluationWithComp>, String> {
  let rows = sqlx::query(
    "SELECT e.id, e.title, e.competency_id, e.date, e.period, \
            c.label AS competency_label, c.domain, c.subdomain \
     FROM evaluations e JOIN competencies c ON c.id = e.competency_id \
     WHERE e.period = ? ORDER BY e.date DESC"
  ).bind(&period).fetch_all(&state.db).await.map_err(|e| e.to_string())?;
  Ok(rows.into_iter().map(|r| EvaluationWithComp {
    id: r.get("id"), title: r.get("title"),
    competency_id: r.get("competency_id"),
    competency_label: r.get("competency_label"),
    domain: r.get("domain"), subdomain: r.get("subdomain"),
    date: r.get("date"), period: r.get("period"),
  }).collect())
}

#[tauri::command]
async fn delete_evaluation(state: State<'_, AppState>, id: String) -> Result<(), String> {
  sqlx::query("DELETE FROM evaluations WHERE id = ?")
    .bind(&id).execute(&state.db).await.map_err(|e| e.to_string())?;
  Ok(())
}

// ── Results ───────────────────────────────────────────────

#[derive(Serialize, Deserialize)]
struct ResultEntry {
  id: String,
  student_id: String,
  evaluation_id: String,
  level: String,
}

#[derive(Deserialize)]
struct SaveResultInput {
  student_id: String,
  evaluation_id: String,
  level: String,
}

#[tauri::command]
async fn save_result(
  state: State<'_, AppState>,
  input: SaveResultInput,
) -> Result<ResultEntry, String> {
  let id = Uuid::new_v4().to_string();
  sqlx::query(
    "INSERT INTO results (id, student_id, evaluation_id, level, created_at) \
     VALUES (?, ?, ?, ?, ?) \
     ON CONFLICT(student_id, evaluation_id) DO UPDATE SET level = excluded.level"
  )
  .bind(&id).bind(&input.student_id).bind(&input.evaluation_id)
  .bind(&input.level).bind(now())
  .execute(&state.db).await.map_err(|e| e.to_string())?;
  Ok(ResultEntry {
    id, student_id: input.student_id,
    evaluation_id: input.evaluation_id, level: input.level,
  })
}

#[tauri::command]
async fn list_results_for_evaluation(
  state: State<'_, AppState>,
  evaluation_id: String,
) -> Result<Vec<ResultEntry>, String> {
  let rows = sqlx::query(
    "SELECT id, student_id, evaluation_id, level FROM results WHERE evaluation_id = ?"
  ).bind(&evaluation_id).fetch_all(&state.db).await.map_err(|e| e.to_string())?;
  Ok(rows.into_iter().map(|r| ResultEntry {
    id: r.get("id"), student_id: r.get("student_id"),
    evaluation_id: r.get("evaluation_id"), level: r.get("level"),
  }).collect())
}

// ── Synthesis ─────────────────────────────────────────────

#[derive(Serialize)]
struct SynthesisEntry {
  domain: String,
  subdomain: String,
  competency_label: String,
  competency_id: String,
  results: Vec<String>,
  synthesis: String,    // internal: A, AR, ECA, NA
  lsu_level: String,    // LSU official: A, ECA, NA
}

#[derive(Serialize)]
struct StudentSynthesis {
  student: Student,
  entries: Vec<SynthesisEntry>,
}

/// Internal score: A=4, AR=3, ECA=2, NA=1
fn level_score(level: &str) -> f64 {
  match level {
    "A" => 4.0,
    "AR" => 3.0,
    "ECA" => 2.0,
    "NA" => 1.0,
    _ => 0.0,
  }
}

/// Synthesize multiple results into one internal level
fn synthesize_internal(levels: &[String]) -> String {
  let evaluated: Vec<_> = levels.iter().filter(|l| l.as_str() != "NE").collect();
  if evaluated.is_empty() { return "NE".into(); }
  let avg: f64 = evaluated.iter().map(|l| level_score(l)).sum::<f64>() / evaluated.len() as f64;
  if avg >= 3.5 { "A".into() }
  else if avg >= 2.5 { "AR".into() }
  else if avg >= 1.5 { "ECA".into() }
  else { "NA".into() }
}

/// Convert internal level to LSU level (3 levels only: A, ECA, NA)
/// AR → if leaning toward A (score >= 3.0) → A, otherwise → ECA
fn to_lsu_level(levels: &[String]) -> String {
  let evaluated: Vec<_> = levels.iter().filter(|l| l.as_str() != "NE").collect();
  if evaluated.is_empty() { return "NE".into(); }
  let avg: f64 = evaluated.iter().map(|l| level_score(l)).sum::<f64>() / evaluated.len() as f64;
  if avg >= 3.0 { "A".into() }
  else if avg >= 1.5 { "ECA".into() }
  else { "NA".into() }
}

#[tauri::command]
async fn get_student_synthesis(
  state: State<'_, AppState>,
  student_id: String,
  period: String,
) -> Result<StudentSynthesis, String> {
  let srow = sqlx::query("SELECT id, last_name, first_name, level FROM students WHERE id = ?")
    .bind(&student_id).fetch_one(&state.db).await.map_err(|e| e.to_string())?;
  let student = Student {
    id: srow.get("id"), last_name: srow.get("last_name"), first_name: srow.get("first_name"), level: srow.get("level"),
  };

  let rows = sqlx::query(
    "SELECT c.id AS cid, c.domain, c.subdomain, c.label, r.level \
     FROM results r \
     JOIN evaluations e ON e.id = r.evaluation_id \
     JOIN competencies c ON c.id = e.competency_id \
     WHERE r.student_id = ? AND e.period = ? \
     ORDER BY c.domain, c.subdomain, c.label"
  ).bind(&student_id).bind(&period)
  .fetch_all(&state.db).await.map_err(|e| e.to_string())?;

  let mut map: indexmap::IndexMap<String, SynthesisEntry> = indexmap::IndexMap::new();
  for r in rows {
    let cid: String = r.get("cid");
    let entry = map.entry(cid.clone()).or_insert_with(|| SynthesisEntry {
      domain: r.get("domain"), subdomain: r.get("subdomain"),
      competency_label: r.get("label"), competency_id: cid,
      results: Vec::new(), synthesis: String::new(), lsu_level: String::new(),
    });
    entry.results.push(r.get("level"));
  }

  for entry in map.values_mut() {
    entry.synthesis = synthesize_internal(&entry.results);
    entry.lsu_level = to_lsu_level(&entry.results);
  }

  Ok(StudentSynthesis { student, entries: map.into_values().collect() })
}

// ── AI Appreciation Generation ────────────────────────────

#[derive(Deserialize)]
struct GenerateBilanInput {
  student_id: String,
  student_name: String,
  level: String,
  period: String,
  entries: Vec<BilanDomainEntry>,
  teacher_notes: Option<String>,
}

#[derive(Deserialize)]
struct BilanDomainEntry {
  domain: String,
  subdomain: String,
  competency: String,
  synthesis: String,
  lsu_level: String,
}

#[derive(Serialize)]
struct GenerateBilanOutput {
  appreciations: std::collections::HashMap<String, String>,
}

#[tauri::command]
async fn generate_bilan(
  state: State<'_, AppState>,
  input: GenerateBilanInput,
) -> Result<GenerateBilanOutput, String> {
  let model: String = sqlx::query("SELECT value FROM settings WHERE key = ?")
    .bind("ollama_model")
    .fetch_optional(&state.db).await.map_err(|e| e.to_string())?
    .map(|r| r.get("value"))
    .unwrap_or_else(|| "qwen3:8b".into());

  let ollama_url: String = sqlx::query("SELECT value FROM settings WHERE key = ?")
    .bind("ollama_url")
    .fetch_optional(&state.db).await.map_err(|e| e.to_string())?
    .map(|r| r.get("value"))
    .unwrap_or_else(|| "http://localhost:11434/v1/chat/completions".into());

  // Group by domain, excluding NE (non évalué)
  let mut by_domain: indexmap::IndexMap<String, Vec<&BilanDomainEntry>> = indexmap::IndexMap::new();
  for e in &input.entries {
    if e.lsu_level == "NE" || e.synthesis == "NE" { continue; }
    by_domain.entry(e.domain.clone()).or_default().push(e);
  }

  // If S2, fetch the S1 global appreciation for context
  let s1_appreciation = if input.period.starts_with("S2") {
    // Extract school year from period (e.g. "S2-2025-2026" -> "S1-2025-2026")
    let s1_period = format!("S1{}", &input.period[2..]);
    sqlx::query("SELECT text FROM appreciations WHERE student_id = ? AND period = ? AND domain = '_global'")
      .bind(input.student_id)
      .bind(&s1_period)
      .fetch_optional(&state.db).await.map_err(|e| e.to_string())?
      .map(|r| r.get::<String, _>("text"))
  } else {
    None
  };

  let mut details = String::new();
  for (domain, entries) in &by_domain {
    let maitrise: Vec<&str> = entries.iter()
      .filter(|e| e.synthesis == "A")
      .take(3)
      .map(|e| e.competency.as_str())
      .collect();
    let bonne_voie: Vec<&str> = entries.iter()
      .filter(|e| e.synthesis == "AR")
      .take(2)
      .map(|e| e.competency.as_str())
      .collect();
    let a_consolider: Vec<&str> = entries.iter()
      .filter(|e| e.synthesis == "ECA" || e.synthesis == "NA")
      .take(2)
      .map(|e| e.competency.as_str())
      .collect();
    details.push_str(&format!("\n{domain}\n", domain = domain));
    if !maitrise.is_empty() {
      details.push_str(&format!("  Maîtrise : {}\n", maitrise.join(", ")));
    }
    if !bonne_voie.is_empty() {
      details.push_str(&format!("  En bonne voie : {}\n", bonne_voie.join(", ")));
    }
    if !a_consolider.is_empty() {
      details.push_str(&format!("  À consolider : {}\n", a_consolider.join(", ")));
    }
  }

  let prompt = format!(
    "Rédige l'appréciation LSU de l'élève suivant.\n\n\
     Élève : {name} — Niveau : {level}\n\n\
     Les données ci-dessous sont des constats d'observation. Ne les interprète pas. \
     Ne cherche pas à expliquer les causes des progrès ou des difficultés. \
     Ne crée aucun lien logique entre deux compétences si ce lien n'est pas explicitement fourni.\n\
     {details}\n\
     {teacher_obs}\
     {s1_context}\
     {closing}",
    level = input.level, name = input.student_name,
    details = details,
    teacher_obs = match &input.teacher_notes {
      Some(notes) if !notes.trim().is_empty() => format!(
        "Observations de l'enseignant sur cet élève (à intégrer naturellement et avec bienveillance dans l'appréciation) :\n{}\n\n",
        notes.trim()
      ),
      _ => String::new(),
    },
    s1_context = match &s1_appreciation {
      Some(text) if !text.trim().is_empty() => format!(
        "Voici l'appréciation du 1er semestre de cette même année scolaire pour cet élève :\n« {} »\n\
         Tiens-en compte subtilement dans ta rédaction : montre l'évolution de l'élève entre le S1 et le S2 \
         (progrès réalisés, points qui restent à travailler, etc.) sans recopier le texte du S1.\n\n",
        text.trim()
      ),
      _ => String::new(),
    },
    closing = if input.period.starts_with("S1") {
      "- C'est le bilan du 1er semestre : termine l'appréciation par une ou deux phrases exprimant clairement \
         les attentes de progrès pour le 2nd semestre (domaines à consolider, attitudes à faire évoluer, etc.), \
         toujours à la troisième personne et sans t'adresser directement à l'élève."
        .to_string()
    } else {
      let next_level = match input.level.as_str() {
        "CE1" => "CE2",
        "CE2" => "CM1",
        "CM1" => "CM2",
        "CM2" => "6ème",
        _ => "la classe supérieure",
      };
      format!(
        "- C'est le bilan du 2nd semestre (fin d'année) : fais d'abord un bilan du semestre écoulé, \
         puis un petit bilan de l'année scolaire dans son ensemble, en mettant en évidence à la fois les progrès \
         réalisés et les difficultés qui subsistent. \
         Termine OBLIGATOIREMENT par la phrase exacte : « Passage en {next}. Bonnes vacances ! »",
        next = next_level
      )
    },
  );

  let body = serde_json::json!({
    "model": model,
    "temperature": 0.65,
    "messages": [
      { "role": "system", "content": "Tu es un enseignant de primaire expérimenté en France. Tu rédiges des appréciations de LSU destinées aux familles.\n\nOBJECTIF — Tu ne transformes pas des compétences en phrases.\nTu rédiges un diagnostic global d'enseignant, à partir des informations fournies.\nLes compétences sont un support de réflexion interne, pas un plan à suivre.\nLe texte final doit pouvoir avoir été écrit directement par un enseignant, sans aucun signe de génération automatique.\n\nSTYLE :\n- Phrases simples et directes. Ce n'est pas un texte littéraire.\n- L'enseignant parle à la première personne : « j'encourage », « je l'en félicite », « je compte sur toi », « je suis convaincu ».\n- Ton bienveillant mais authentique — ni froid, ni artificiel.\n- Varie les débuts selon le profil. N'utilise pas systématiquement « X a... » ou « Cette année... ».\n- Aucune phrase ne dépasse 30 mots.\n\nCONTENU :\n- 3 à 4 idées importantes. Ne mentionne pas tout. Un enseignant fait un tri.\n- Chaque phrase apporte une information nouvelle. Jamais de reformulation.\n- N'invente aucun comportement, attitude ou progression absent des données.\n- Si des observations de l'enseignant sont fournies, elles sont prioritaires.\n- Résultats contrastés : commence par les réussites, nuance sans être négatif.\n\nTRANSFORMATION — structure nominale directe (sans verbe = sans dérive) :\nCopie (Acquis) → « copie maîtrisée » ou « copie correcte »\nCalcul mental (À consolider) → « calcul mental à consolider »\nCompréhension (En bonne voie) → « compréhension en progrès »\nConjugaison (Acquis) → « conjugaison acquise »\nLecture (À consolider) → « lecture à renforcer »\nNe jamais transformer une compétence en comportement ou stratégie mentale.\n\nSTRUCTURE (adapter selon le profil) :\nBilan général → ce qui va bien → ce qui reste à travailler → encouragement.\nToutes les parties ne sont pas obligatoires : un excellent élève n'a pas forcément de points faibles significatifs.\n\nEXEMPLES :\n\nÉlève excellent :\n« Durant ce premier semestre, l'élève a obtenu d'excellents résultats et a montré une très bonne participation orale, enrichissant les échanges en classe. Cependant, un léger manque de confiance a parfois limité son expression. En continuant à travailler sur ce point, elle pourra libérer tout son potentiel. Bravo pour ce très bon travail, continue ainsi — avec un peu plus de confiance, tu pourras aller encore plus loin au second semestre ! »\n\nÉlève en progrès :\n« Au début de l'année, cet élève avait tendance à se précipiter, ce qui lui causait quelques erreurs. Fort heureusement, cette habitude semble aujourd'hui disparue. Il fait preuve de plus de rigueur, participe activement en classe et est appliqué dans son travail. Il est important qu'il continue sur cette dynamique au second semestre pour consolider ses progrès et aller encore plus loin. Je compte sur toi ! »\n\nÉlève en difficulté :\n« Les efforts fournis durant ce semestre sont à souligner. Malgré des difficultés notables en français, une volonté de progresser est présente. Cependant, la compréhension des consignes reste un point essentiel à améliorer : il est important de prendre le temps de bien les lire avant de commencer. Pour le second semestre, des efforts sont attendus. Courage et persévérance sont les clés ; je compte sur toi ! »\n\nRELECTURE avant de répondre — Vérifie que :\n- chaque phrase apporte une information nouvelle ;\n- aucune formulation vague ou artificielle n'est utilisée ;\n- seules les informations fournies sont exploitées (ne rien inventer) ;\n- l'appréciation reste fluide et naturelle à lire ;\n- seules les informations les plus importantes ont été retenues.\n\nLongueur : 5 à 7 phrases. Appréciation unique, sans titre ni introduction. Respecter strictement les consignes de clôture selon le semestre.\nRépondre uniquement avec le texte de l'appréciation." },
      { "role": "user", "content": format!("/no_think\n{}", prompt) }
    ]
  });

  let client = reqwest::Client::new();
  let res = client
    .post(&ollama_url)
    .bearer_auth("ollama")
    .header("content-type", "application/json")
    .json(&body)
    .send().await.map_err(|e| e.to_string())?;

  let status = res.status();
  let text = res.text().await.map_err(|e| e.to_string())?;

  if !status.is_success() {
    return Err(format!("Ollama HTTP {}: {}", status, text));
  }

  let json: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
  let content = json["choices"][0]["message"]["content"]
    .as_str()
    .ok_or("Réponse Ollama invalide")?;

  let mut appreciations = std::collections::HashMap::new();
  appreciations.insert("_global".to_string(), content.trim().to_string());

  Ok(GenerateBilanOutput { appreciations })
}

// ── Appreciations ─────────────────────────────────────────

#[derive(Deserialize)]
struct SaveAppreciationInput {
  student_id: String,
  period: String,
  domain: String,
  text: String,
}

#[tauri::command]
async fn save_appreciation(
  state: State<'_, AppState>,
  input: SaveAppreciationInput,
) -> Result<(), String> {
  sqlx::query(
    "INSERT INTO appreciations (student_id, period, domain, text, updated_at) \
     VALUES (?, ?, ?, ?, ?) \
     ON CONFLICT(student_id, period, domain) DO UPDATE SET text = excluded.text, updated_at = excluded.updated_at"
  )
  .bind(&input.student_id).bind(&input.period).bind(&input.domain)
  .bind(&input.text).bind(now())
  .execute(&state.db).await.map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
async fn list_appreciations(
  state: State<'_, AppState>,
  student_id: String,
  period: String,
) -> Result<std::collections::HashMap<String, String>, String> {
  let rows = sqlx::query(
    "SELECT domain, text FROM appreciations WHERE student_id = ? AND period = ?"
  ).bind(&student_id).bind(&period)
  .fetch_all(&state.db).await.map_err(|e| e.to_string())?;
  Ok(rows.into_iter().map(|r| (r.get::<String, _>("domain"), r.get::<String, _>("text"))).collect())
}

// ── Settings ──────────────────────────────────────────────

#[derive(Deserialize)]
struct SetSettingInput {
  key: String,
  value: String,
}

#[tauri::command]
async fn set_setting(state: State<'_, AppState>, input: SetSettingInput) -> Result<(), String> {
  sqlx::query(
    "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(input.key).bind(input.value)
  .execute(&state.db).await.map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
async fn get_setting(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
  let row = sqlx::query("SELECT value FROM settings WHERE key = ?")
    .bind(key).fetch_optional(&state.db).await.map_err(|e| e.to_string())?;
  Ok(row.map(|r| r.get("value")))
}

// ── Test Ollama ───────────────────────────────────────────

#[derive(Deserialize)]
struct TestGroqInput {
  model: String,
  url: String,
}

#[derive(Serialize)]
struct TestGroqOutput {
  ok: bool,
  message: String,
}

#[tauri::command]
async fn test_groq(input: TestGroqInput) -> Result<TestGroqOutput, String> {
  let body = serde_json::json!({
    "model": input.model,
    "messages": [{ "role": "user", "content": "Dis OK" }]
  });

  let client = reqwest::Client::new();
  let res = client
    .post(&input.url)
    .bearer_auth("ollama")
    .header("content-type", "application/json")
    .json(&body)
    .send().await.map_err(|e| e.to_string())?;

  let status = res.status();
  let text = res.text().await.map_err(|e| e.to_string())?;

  if !status.is_success() {
    return Ok(TestGroqOutput {
      ok: false, message: format!("HTTP {}: {}", status, text),
    });
  }

  Ok(TestGroqOutput { ok: true, message: "Connexion Ollama OK".into() })
}

// ── Ollama auto-start ─────────────────────────────────────

fn find_ollama_exe() -> Option<PathBuf> {
  #[cfg(windows)]
  {
    if let Ok(out) = std::process::Command::new("where").arg("ollama").output() {
      if out.status.success() {
        let s = String::from_utf8_lossy(&out.stdout);
        let first = s.lines().next().unwrap_or("").trim().to_string();
        if !first.is_empty() {
          return Some(PathBuf::from(first));
        }
      }
    }
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
      let p = PathBuf::from(local).join("Programs").join("Ollama").join("ollama.exe");
      if p.exists() { return Some(p); }
    }
  }
  #[cfg(not(windows))]
  {
    for candidate in &["/usr/local/bin/ollama", "/usr/bin/ollama"] {
      let p = PathBuf::from(candidate);
      if p.exists() { return Some(p); }
    }
  }
  None
}

async fn ensure_ollama_running() {
  let client = reqwest::Client::new();
  let alive = client
    .get("http://localhost:11434")
    .timeout(std::time::Duration::from_secs(2))
    .send().await.is_ok();
  if alive { return; }

  if let Some(exe) = find_ollama_exe() {
    let mut cmd = std::process::Command::new(&exe);
    cmd.arg("serve");
    #[cfg(windows)]
    {
      use std::os::windows::process::CommandExt;
      cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    let _ = cmd.spawn();

    for _ in 0..20 {
      tokio::time::sleep(std::time::Duration::from_millis(500)).await;
      if client
        .get("http://localhost:11434")
        .timeout(std::time::Duration::from_secs(1))
        .send().await.is_ok()
      {
        break;
      }
    }
  }
}

// ── App bootstrap ─────────────────────────────────────────

fn resolve_db_path(app: &tauri::App) -> Result<PathBuf, String> {
  app.path().resolve("lsu_assistant.db", BaseDirectory::AppData).map_err(|e| e.to_string())
}

pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let db_path = resolve_db_path(app)?;
      if let Some(dir) = db_path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
      }
      println!("SQLite path: {}", db_path.to_string_lossy());

      let db = tauri::async_runtime::block_on(async {
        let options = SqliteConnectOptions::new()
          .filename(&db_path)
          .create_if_missing(true)
          .foreign_keys(true);
        SqlitePoolOptions::new()
          .max_connections(5)
          .connect_with(options).await
          .map_err(|e| e.to_string())
      })?;

      tauri::async_runtime::block_on(async {
        sqlx::migrate!("./migrations").run(&db).await.map_err(|e| e.to_string())
      })?;

      app.manage(AppState { db });
      tauri::async_runtime::spawn(ensure_ollama_running());
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      create_student, list_students, delete_student, update_student,
      list_competencies, match_competency,
      create_evaluation, list_evaluations, delete_evaluation,
      save_result, list_results_for_evaluation,
      get_student_synthesis, generate_bilan,
      save_appreciation, list_appreciations,
      set_setting, get_setting, test_groq,
      create_custom_competency,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
