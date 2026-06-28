-- Référentiel des compétences LSU Cycle 2
CREATE TABLE IF NOT EXISTS competencies (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,         -- ex: "Français", "Mathématiques"
  subdomain TEXT NOT NULL,      -- ex: "Langage oral", "Nombres et calcul"
  label TEXT NOT NULL,          -- ex: "Écouter pour comprendre des messages oraux"
  keywords TEXT NOT NULL DEFAULT ''  -- mots-clés pour le matching, séparés par |
);

-- Évaluations : une compétence évaluée à une date donnée
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,           -- ce que l'enseignant a tapé (ex: "dictée de mots invariables")
  competency_id TEXT NOT NULL REFERENCES competencies(id),
  date TEXT NOT NULL,
  period TEXT NOT NULL,          -- ex: "S1-2025-2026"
  created_at TEXT NOT NULL
);

-- Résultats : un élève × une évaluation → un niveau
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK(level IN ('A', 'AR', 'ECA', 'NA')),
  created_at TEXT NOT NULL,
  UNIQUE(student_id, evaluation_id)
);

-- ═══════════════════════════════════════════════════════════
-- Seed: compétences LSU Cycle 2
-- ═══════════════════════════════════════════════════════════

-- FRANÇAIS — Langage oral
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-lo-1', 'Français', 'Langage oral', 'Écouter pour comprendre des messages oraux ou des textes lus par un adulte', 'écouter|compréhension orale|écoute|message oral|consigne'),
('fr-lo-2', 'Français', 'Langage oral', 'Dire pour être entendu et compris', 'dire|parler|s''exprimer|oral|réciter|poésie|exposé'),
('fr-lo-3', 'Français', 'Langage oral', 'Participer à des échanges dans des situations diversifiées', 'participer|échanges|débat|discussion|dialogue'),
('fr-lo-4', 'Français', 'Langage oral', 'Adopter une distance critique par rapport au langage produit', 'distance critique|langage|réflexion');

-- FRANÇAIS — Lecture et compréhension de l'écrit
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-lc-1', 'Français', 'Lecture et compréhension de l''écrit', 'Identifier des mots de manière de plus en plus aisée', 'identifier|mots|décodage|lecture|déchiffrer|syllabes'),
('fr-lc-2', 'Français', 'Lecture et compréhension de l''écrit', 'Comprendre un texte', 'comprendre|texte|compréhension|lecture|questions|histoire'),
('fr-lc-3', 'Français', 'Lecture et compréhension de l''écrit', 'Pratiquer différentes formes de lecture', 'lecture|lire|formes de lecture|documentaire|album'),
('fr-lc-4', 'Français', 'Lecture et compréhension de l''écrit', 'Lire à voix haute', 'lire|voix haute|fluence|lecture orale|fluidité'),
('fr-lc-5', 'Français', 'Lecture et compréhension de l''écrit', 'Contrôler sa compréhension', 'contrôler|compréhension|vérifier|relire');

-- FRANÇAIS — Écriture
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-ec-1', 'Français', 'Écriture', 'Copier de manière experte', 'copier|copie|écriture|recopier|calligraphie'),
('fr-ec-2', 'Français', 'Écriture', 'Produire des écrits', 'produire|écrits|rédaction|écrire|production d''écrits|rédiger|texte libre'),
('fr-ec-3', 'Français', 'Écriture', 'Réviser et améliorer l''écrit qu''on a produit', 'réviser|améliorer|relecture|corriger|réécriture');

-- FRANÇAIS — Étude de la langue
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-el-1', 'Français', 'Étude de la langue', 'Maîtriser les relations entre l''oral et l''écrit', 'oral|écrit|correspondance|phonème|graphème|son|lettre'),
('fr-el-2', 'Français', 'Étude de la langue', 'Mémoriser et se remémorer l''orthographe de mots fréquents et irréguliers', 'orthographe|mots|mémoriser|dictée|mots invariables|mots fréquents'),
('fr-el-3', 'Français', 'Étude de la langue', 'Identifier les principaux éléments d''une phrase simple', 'phrase|sujet|verbe|grammaire|phrase simple|groupe nominal|déterminant|nom|adjectif'),
('fr-el-4', 'Français', 'Étude de la langue', 'Raisonner pour résoudre des problèmes orthographiques', 'orthographe|accord|raisonner|accords|pluriel|féminin|genre|nombre'),
('fr-el-5', 'Français', 'Étude de la langue', 'Comprendre comment se forment les verbes et orthographier les formes verbales', 'verbe|conjugaison|formes verbales|temps|présent|imparfait|futur|passé composé|infinitif'),
('fr-el-6', 'Français', 'Étude de la langue', 'Identifier des relations entre les mots et leur contexte d''utilisation', 'vocabulaire|mots|relations|synonymes|contraires|antonymes|familles de mots'),
('fr-el-7', 'Français', 'Étude de la langue', 'Enrichir son répertoire de mots, les mémoriser et les réutiliser', 'vocabulaire|lexique|mots|enrichir|définition');

-- MATHÉMATIQUES — Nombres et calcul
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('ma-nc-1', 'Mathématiques', 'Nombres et calcul', 'Comprendre et utiliser des nombres entiers pour dénombrer, ordonner, repérer, comparer', 'nombres|dénombrer|ordonner|comparer|numération|ranger|classer'),
('ma-nc-2', 'Mathématiques', 'Nombres et calcul', 'Nommer, lire, écrire, représenter des nombres entiers', 'nombres|lire|écrire|nommer|représenter|chiffres|dizaines|centaines'),
('ma-nc-3', 'Mathématiques', 'Nombres et calcul', 'Calculer avec des nombres entiers', 'calculer|calcul|addition|soustraction|multiplication|opérations|calcul mental|calcul posé|tables'),
('ma-nc-4', 'Mathématiques', 'Nombres et calcul', 'Résoudre des problèmes en utilisant des nombres entiers et le calcul', 'problèmes|résoudre|calcul|raisonnement|énoncé');

-- MATHÉMATIQUES — Espace et géométrie
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('ma-eg-1', 'Mathématiques', 'Espace et géométrie', 'Se repérer et se déplacer dans l''espace en utilisant ou en élaborant des représentations', 'espace|repérer|déplacer|plan|représentation|quadrillage'),
('ma-eg-2', 'Mathématiques', 'Espace et géométrie', 'Reconnaître, nommer, décrire, reproduire quelques solides', 'solides|cube|pavé|géométrie|3D|pyramide|boule|cylindre'),
('ma-eg-3', 'Mathématiques', 'Espace et géométrie', 'Reconnaître, nommer, décrire, reproduire, construire quelques figures géométriques', 'figures|carré|rectangle|triangle|cercle|géométrie|tracer|construire'),
('ma-eg-4', 'Mathématiques', 'Espace et géométrie', 'Reconnaître et utiliser les notions d''alignement, d''angle droit, d''égalité de longueurs, de milieu, de symétrie', 'alignement|angle droit|symétrie|milieu|longueurs|équerre|règle');

-- MATHÉMATIQUES — Grandeurs et mesures
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('ma-gm-1', 'Mathématiques', 'Grandeurs et mesures', 'Comparer, estimer, mesurer des longueurs, des masses, des contenances, des durées', 'mesurer|longueurs|masses|contenances|durées|mesure|peser|heure'),
('ma-gm-2', 'Mathématiques', 'Grandeurs et mesures', 'Utiliser le lexique, les unités, les instruments de mesures spécifiques', 'unités|instruments|mesure|cm|m|kg|g|litre|mL|règle graduée|balance'),
('ma-gm-3', 'Mathématiques', 'Grandeurs et mesures', 'Résoudre des problèmes impliquant des longueurs, des masses, des contenances, des durées, des prix', 'problèmes|mesures|prix|longueurs|durées|monnaie|euros');

-- EPS
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('eps-1', 'EPS', 'Produire une performance', 'Courir, sauter, lancer à des intensités et des durées variables', 'courir|sauter|lancer|athlétisme|performance|course|endurance'),
('eps-2', 'EPS', 'Adapter ses déplacements', 'Réaliser un parcours en adaptant ses déplacements à un environnement inhabituel', 'parcours|natation|escalade|orientation|déplacements|piscine|nager|vélo|roller'),
('eps-3', 'EPS', 'S''exprimer par une prestation artistique', 'Mémoriser et reproduire avec son corps une séquence simple d''actions', 'danse|gymnique|cirque|expression|artistique|acrosport|chorégraphie'),
('eps-4', 'EPS', 'Conduire un affrontement', 'S''engager dans un affrontement individuel ou collectif en respectant les règles du jeu', 'jeux|collectif|combat|raquettes|règles|ballon|sport collectif|handball|basket');

-- LANGUES VIVANTES
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('lv-1', 'Langues vivantes', 'Comprendre l''oral', 'Comprendre des mots familiers et des expressions très courantes', 'comprendre|oral|anglais|écouter|langue|listening'),
('lv-2', 'Langues vivantes', 'S''exprimer oralement', 'Utiliser des expressions et des phrases simples pour se décrire', 'parler|s''exprimer|oral|anglais|décrire|speaking|se présenter'),
('lv-3', 'Langues vivantes', 'Prendre part à une conversation', 'Poser des questions simples sur des sujets familiers et y répondre', 'conversation|questions|dialogue|anglais|interaction|pair work'),
('lv-4', 'Langues vivantes', 'Découvrir des aspects culturels', 'Identifier quelques grands repères culturels', 'culture|repères|pays|anglais|civilisation|traditions|fêtes');

-- QUESTIONNER LE MONDE
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('qm-1', 'Questionner le monde', 'Qu''est-ce que la matière ?', 'Identifier les trois états de la matière et observer des changements d''états', 'matière|états|solide|liquide|gaz|eau|changement d''état'),
('qm-2', 'Questionner le monde', 'Le monde du vivant', 'Connaître des caractéristiques du monde vivant, ses interactions, sa diversité', 'vivant|animaux|plantes|diversité|écosystème|chaîne alimentaire|reproduction'),
('qm-3', 'Questionner le monde', 'Le monde du vivant', 'Reconnaître des comportements favorables à sa santé', 'santé|hygiène|alimentation|sommeil|corps|dents|sport'),
('qm-4', 'Questionner le monde', 'Les objets techniques', 'Comprendre la fonction et le fonctionnement d''objets fabriqués', 'objets|techniques|fonctionnement|fabriquer|mécanisme|engrenage'),
('qm-5', 'Questionner le monde', 'Les objets techniques', 'Commencer à s''approprier un environnement numérique', 'numérique|ordinateur|tablette|informatique|clavier|souris|programmer'),
('qm-6', 'Questionner le monde', 'Se situer dans l''espace', 'Se repérer dans l''espace et le représenter', 'espace|plan|carte|repérer|géographie|paysage|quartier|ville'),
('qm-7', 'Questionner le monde', 'Se situer dans le temps', 'Se repérer dans le temps et mesurer des durées', 'temps|durées|calendrier|frise|histoire|chronologie|siècle|époque'),
('qm-8', 'Questionner le monde', 'Explorer les organisations du monde', 'Comparer quelques modes de vie des hommes et des femmes', 'modes de vie|monde|paysages|organisation|habitat|ville|campagne');

-- ENSEIGNEMENTS ARTISTIQUES
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('art-1', 'Enseignements artistiques', 'Arts plastiques', 'Expérimenter, produire, créer des productions plastiques de natures diverses', 'arts plastiques|créer|produire|dessin|peinture|collage|modelage'),
('art-2', 'Enseignements artistiques', 'Arts plastiques', 'Mettre en œuvre un projet artistique individuel ou collectif', 'projet|artistique|collectif|création|œuvre'),
('art-3', 'Enseignements artistiques', 'Arts plastiques', 'S''exprimer, analyser sa pratique, celle de ses pairs', 'analyser|exprimer|arts|regard|altérité|décrire|comparer'),
('art-4', 'Enseignements artistiques', 'Éducation musicale', 'Chanter une mélodie simple avec une intonation juste', 'chanter|mélodie|chant|musique|intonation|chorale|comptine'),
('art-5', 'Enseignements artistiques', 'Éducation musicale', 'Écouter, comparer des éléments sonores, des musiques', 'écouter|musique|comparer|sonore|écoute musicale|instruments|orchestre'),
('art-6', 'Enseignements artistiques', 'Éducation musicale', 'Explorer, imaginer des représentations diverses de musiques', 'explorer|imaginer|musique|créer|rythme|percussions'),
('art-7', 'Enseignements artistiques', 'Éducation musicale', 'Échanger, partager ses émotions, exprimer ses préférences', 'émotions|partager|préférences|musique|exprimer|ressentir');

-- EMC
INSERT OR IGNORE INTO competencies (id, domain, subdomain, label, keywords) VALUES
('emc-1', 'EMC', 'Enseignement moral et civique', 'Être capable d''écoute', 'écoute|respect|attention|civisme|comportement'),
('emc-2', 'EMC', 'Enseignement moral et civique', 'Accepter les différences', 'différences|tolérance|respect|accepter|handicap'),
('emc-3', 'EMC', 'Enseignement moral et civique', 'Connaître et respecter les règles de vie de la classe et de l''école', 'règles|classe|école|vie|respect|règlement|vivre ensemble'),
('emc-4', 'EMC', 'Enseignement moral et civique', 'Identifier les symboles de la République présents dans l''école', 'République|symboles|drapeau|Marianne|devise|hymne|liberté|égalité|fraternité'),
('emc-5', 'EMC', 'Enseignement moral et civique', 'Savoir coopérer', 'coopérer|coopération|travail|groupe|équipe|entraide'),
('emc-6', 'EMC', 'Enseignement moral et civique', 'Prendre des responsabilités dans la classe et dans l''école', 'responsabilités|métiers|classe|engagement|autonomie');
