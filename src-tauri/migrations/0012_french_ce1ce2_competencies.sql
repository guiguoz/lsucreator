-- Remplacement des compétences Français par celles du BO (ensel135_annexe3)
-- CE1 et CE2 uniquement — suppression de tout ce qui est spécifique CP

-- ═══ Suppression des compétences Français obsolètes ═══
-- (celles qui n'existent pas dans le programme CE1/CE2)
-- Nettoyer d'abord les résultats et évaluations liés (FK constraint)
DELETE FROM results WHERE evaluation_id IN (
  SELECT id FROM evaluations WHERE competency_id IN (
    'fr-lo-4', 'fr-lc-3', 'fr-lc-5', 'fr-ec-3', 'fr-el-1', 'fr-el-2', 'fr-el-4'
  )
);
DELETE FROM evaluations WHERE competency_id IN (
  'fr-lo-4', 'fr-lc-3', 'fr-lc-5', 'fr-ec-3', 'fr-el-1', 'fr-el-2', 'fr-el-4'
);
DELETE FROM competencies WHERE id IN (
  'fr-lo-4',  -- Adopter une distance critique (pas en CE1/CE2)
  'fr-lc-3',  -- Pratiquer différentes formes de lecture
  'fr-lc-5',  -- Contrôler sa compréhension
  'fr-ec-3',  -- Réviser et améliorer l'écrit
  'fr-el-1',  -- Maîtriser les relations oral/écrit (CP)
  'fr-el-2',  -- Mémoriser orthographe mots fréquents (fusionné dans Vocabulaire)
  'fr-el-4'   -- Raisonner pour résoudre des problèmes orthographiques
);

-- ═══ Mise à jour des compétences Français existantes ═══

-- Oral
UPDATE competencies SET label = 'Écouter pour comprendre',
  keywords = 'écouter|comprendre|compréhension orale|écoute|consigne|message oral'
  WHERE id = 'fr-lo-1';

UPDATE competencies SET label = 'Dire pour être compris',
  keywords = 'dire|parler|s''exprimer|oral|réciter|poésie|exposé|présenter'
  WHERE id = 'fr-lo-2';

UPDATE competencies SET label = 'Participer à des échanges',
  keywords = 'participer|échanges|débat|discussion|dialogue|argumentation'
  WHERE id = 'fr-lo-3';

-- Lecture
-- fr-lc-1 (Identifier des mots) et fr-lc-2 (Comprendre un texte) : labels OK
-- fr-lc-4 (Lire à voix haute) : label OK

-- Écriture
UPDATE competencies SET label = 'Copier et acquérir des stratégies de copie',
  keywords = 'copier|copie|écriture|recopier|calligraphie|stratégies de copie'
  WHERE id = 'fr-ec-1';
-- fr-ec-2 (Produire des écrits) : label OK

-- Grammaire et orthographe (fusion des anciens sous-domaines Grammaire + Orthographe)
UPDATE competencies SET subdomain = 'Grammaire et orthographe',
  label = 'Se repérer dans la phrase simple',
  keywords = 'phrase|sujet|verbe|grammaire|phrase simple|groupe nominal|déterminant|nom|adjectif|nature des mots'
  WHERE id = 'fr-el-3';

UPDATE competencies SET subdomain = 'Grammaire et orthographe',
  label = 'Découvrir, comprendre et mettre en œuvre l''orthographe grammaticale',
  keywords = 'orthographe|accord|accords|pluriel|féminin|genre|nombre|conjugaison|verbe|temps|présent|imparfait|futur'
  WHERE id = 'fr-el-5';

-- Vocabulaire
UPDATE competencies SET label = 'Enrichir son vocabulaire dans toutes les disciplines',
  keywords = 'vocabulaire|lexique|mots|enrichir|définition|disciplines'
  WHERE id = 'fr-el-7';

UPDATE competencies SET label = 'Établir des relations entre les mots',
  keywords = 'vocabulaire|mots|relations|synonymes|contraires|antonymes|familles de mots|préfixes|suffixes'
  WHERE id = 'fr-el-6';

-- ═══ Ajout des nouvelles compétences CE1/CE2 ═══

-- Lecture : Devenir lecteur
INSERT INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-lc-6', 'Français', 'Lecture', 'Devenir lecteur',
  'lecteur|lire|plaisir de lire|littérature|album|roman|bibliothèque|lecture autonome');

-- Écriture : Apprendre à écrire en écriture cursive
INSERT INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-ec-4', 'Français', 'Écriture', 'Apprendre à écrire en écriture cursive',
  'cursive|écriture|lettres|graphisme|majuscules|minuscules|tracé|geste d''écriture');

-- Écriture : Encoder puis écrire sous dictée
INSERT INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-ec-5', 'Français', 'Écriture', 'Encoder puis écrire sous dictée',
  'dictée|encoder|écrire|orthographe|mots|phrases|dictée de mots|dictée de phrases');

-- Vocabulaire : Réemployer le vocabulaire étudié
INSERT INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-el-8', 'Français', 'Vocabulaire', 'Réemployer le vocabulaire étudié',
  'vocabulaire|réemployer|réutiliser|employer|mots appris|contexte');

-- Vocabulaire : Mémoriser l'orthographe des mots
INSERT INTO competencies (id, domain, subdomain, label, keywords) VALUES
('fr-el-9', 'Français', 'Vocabulaire', 'Mémoriser l''orthographe des mots',
  'orthographe|mémoriser|mots invariables|mots fréquents|dictée de mots|orthographe lexicale');
