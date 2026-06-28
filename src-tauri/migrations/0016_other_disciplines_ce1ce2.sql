-- Remplacement des compétences EPS, Langues vivantes, Enseignements artistiques,
-- Questionner le monde par celles du BO (ensel714_annexe1)
-- CE1 et CE2 uniquement

-- ═══════════════════════════════════════════════════════
-- EPS
-- ═══════════════════════════════════════════════════════

-- Mise à jour des compétences existantes
UPDATE competencies SET
  subdomain = 'Produire une performance optimale, mesurable à une échéance donnée',
  label = 'Produire une performance optimale',
  keywords = 'courir|sauter|lancer|athlétisme|performance|course|endurance|vitesse|relais|longueur|hauteur|mesurer'
  WHERE id = 'eps-1';

UPDATE competencies SET
  subdomain = 'Adapter ses déplacements à des environnements variés',
  label = 'Adapter ses déplacements à un environnement',
  keywords = 'natation|escalade|orientation|parcours|piscine|nager|vélo|roller|environnement|eau|déplacements|sécurité'
  WHERE id = 'eps-2';

UPDATE competencies SET
  subdomain = 'S''exprimer devant les autres par une prestation artistique et/ou acrobatique',
  label = 'S''exprimer devant les autres par une prestation artistique et/ou acrobatique',
  keywords = 'danse|gymnique|cirque|expression|artistique|acrosport|chorégraphie|prestation|création|mouvement|rythme'
  WHERE id = 'eps-3';

UPDATE competencies SET
  subdomain = 'Conduire et maîtriser un affrontement collectif ou interindividuel',
  label = 'Conduire et maîtriser un affrontement collectif ou interindividuel',
  keywords = 'jeux|collectif|combat|raquettes|règles|ballon|sport collectif|handball|basket|opposition|coopération|stratégie'
  WHERE id = 'eps-4';

-- Nouvelles compétences transversales EPS (BO)
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('eps-5', 'EPS', 'Compétences transversales EPS',
  'S''approprier seul ou à plusieurs par la pratique les méthodes et outils pour apprendre',
  'apprendre|pratique|méthodes|observer|répéter|essayer|améliorer|s''entraîner|auto-évaluation',
  'CE1,CE2');

INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('eps-6', 'EPS', 'Compétences transversales EPS',
  'Partager des règles, assumer des rôles et des responsabilités',
  'règles|rôles|responsabilités|arbitre|observateur|juge|fair-play|respect|équipe|partenaire',
  'CE1,CE2');

INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('eps-7', 'EPS', 'Compétences transversales EPS',
  'Apprendre à entretenir sa santé par une activité physique régulière',
  'santé|activité physique|bien-être|hygiène|effort|échauffement|récupération|corps',
  'CE1,CE2');

INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('eps-8', 'EPS', 'Compétences transversales EPS',
  'S''approprier une culture physique sportive et artistique',
  'culture|sportive|artistique|vocabulaire|spectateur|jeux olympiques|histoire du sport|patrimoine',
  'CE1,CE2');

-- ═══════════════════════════════════════════════════════
-- LANGUES VIVANTES
-- ═══════════════════════════════════════════════════════

UPDATE competencies SET
  label = 'Comprendre l''oral',
  subdomain = 'Comprendre l''oral',
  keywords = 'comprendre|oral|anglais|écouter|langue|listening|consignes|mots familiers|expressions courantes|histoire'
  WHERE id = 'lv-1';

UPDATE competencies SET
  label = 'S''exprimer oralement en continu',
  subdomain = 'S''exprimer oralement en continu',
  keywords = 'parler|s''exprimer|oral|anglais|speaking|se présenter|décrire|réciter|comptine|chanson|phrases simples'
  WHERE id = 'lv-2';

UPDATE competencies SET
  label = 'Prendre part à une conversation',
  subdomain = 'Prendre part à une conversation',
  keywords = 'conversation|questions|dialogue|anglais|interaction|pair work|demander|répondre|échanger'
  WHERE id = 'lv-3';

UPDATE competencies SET
  label = 'Découvrir quelques aspects culturels d''une langue vivante étrangère',
  subdomain = 'Découvrir quelques aspects culturels',
  keywords = 'culture|repères|pays|anglais|civilisation|traditions|fêtes|coutumes|comparaison|mode de vie'
  WHERE id = 'lv-4';

-- ═══════════════════════════════════════════════════════
-- ENSEIGNEMENTS ARTISTIQUES — Arts plastiques
-- ═══════════════════════════════════════════════════════

UPDATE competencies SET
  label = 'Expérimenter, produire, créer',
  keywords = 'arts plastiques|créer|produire|dessin|peinture|collage|modelage|expérimenter|geste|outil|matériau|couleur|forme'
  WHERE id = 'art-1';

UPDATE competencies SET
  label = 'Mettre en œuvre un projet artistique',
  keywords = 'projet|artistique|collectif|création|œuvre|individuel|démarche|planifier|réaliser|présenter'
  WHERE id = 'art-2';

UPDATE competencies SET
  label = 'S''exprimer, analyser sa pratique, celle de ses pairs',
  keywords = 'analyser|exprimer|arts|regard|décrire|comparer|vocabulaire|justifier|avis|opinion|pratique'
  WHERE id = 'art-3';

-- Nouvelle compétence Arts plastiques (BO)
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('art-8', 'Enseignements artistiques', 'Arts plastiques',
  'Se repérer dans les domaines liés aux arts plastiques',
  'repérer|domaines|arts plastiques|œuvres|musée|patrimoine|artiste|culture|histoire des arts|références',
  'CE1,CE2');

-- ═══════════════════════════════════════════════════════
-- ENSEIGNEMENTS ARTISTIQUES — Éducation musicale
-- ═══════════════════════════════════════════════════════

UPDATE competencies SET
  label = 'Chanter',
  keywords = 'chanter|mélodie|chant|musique|intonation|chorale|comptine|voix|justesse|rythme|répertoire'
  WHERE id = 'art-4';

UPDATE competencies SET
  label = 'Écouter, comparer',
  keywords = 'écouter|musique|comparer|sonore|écoute musicale|instruments|orchestre|œuvre|style|caractéristiques'
  WHERE id = 'art-5';

UPDATE competencies SET
  label = 'Explorer et imaginer',
  keywords = 'explorer|imaginer|musique|créer|rythme|percussions|inventer|improviser|paysage sonore|production'
  WHERE id = 'art-6';

-- Suppression de art-7 (Échanger, partager ses émotions) — pas dans le BO cycle 2
-- Supprimer d'abord les résultats et évaluations liés (FK constraint)
DELETE FROM results WHERE evaluation_id IN (
  SELECT id FROM evaluations WHERE competency_id = 'art-7'
);
DELETE FROM evaluations WHERE competency_id = 'art-7';
DELETE FROM competencies WHERE id = 'art-7';

-- ═══════════════════════════════════════════════════════
-- QUESTIONNER LE MONDE
-- ═══════════════════════════════════════════════════════

-- Réorganisation en sous-domaines conformes au BO :
-- 1. Qu'est-ce que la matière ?
-- 2. Comment reconnaître le monde vivant ?
-- 3. Les objets techniques
-- 4. Se situer dans l'espace
-- 5. Se situer dans le temps
-- 6. Explorer les organisations du monde

-- qm-1 : matière → reste dans son sous-domaine
UPDATE competencies SET
  subdomain = 'Qu''est-ce que la matière ?',
  label = 'Identifier les états de la matière et les changements d''états',
  keywords = 'matière|états|solide|liquide|gaz|eau|changement d''état|température|fusion|solidification|ébullition'
  WHERE id = 'qm-1';

-- qm-2 : vivant (caractéristiques)
UPDATE competencies SET
  subdomain = 'Comment reconnaître le monde vivant ?',
  label = 'Connaître des caractéristiques du monde vivant, ses interactions, sa diversité',
  keywords = 'vivant|animaux|plantes|diversité|écosystème|chaîne alimentaire|reproduction|cycle de vie|végétaux|interaction|milieu'
  WHERE id = 'qm-2';

-- qm-3 : vivant (santé)
UPDATE competencies SET
  subdomain = 'Comment reconnaître le monde vivant ?',
  label = 'Reconnaître des comportements favorables à sa santé',
  keywords = 'santé|hygiène|alimentation|sommeil|corps|dents|sport|croissance|activité physique|équilibre alimentaire|propreté'
  WHERE id = 'qm-3';

-- qm-4 : objets techniques (fonction + fonctionnement)
UPDATE competencies SET
  subdomain = 'Les objets techniques',
  label = 'Comprendre la fonction et le fonctionnement d''objets fabriqués',
  keywords = 'objets|techniques|fonctionnement|fabriquer|mécanisme|engrenage|fonction|observer|démonter|montage'
  WHERE id = 'qm-4';

-- qm-5 : objets techniques (numérique)
UPDATE competencies SET
  subdomain = 'Les objets techniques',
  label = 'Commencer à s''approprier un environnement numérique',
  keywords = 'numérique|ordinateur|tablette|informatique|clavier|souris|programmer|traitement de texte|saisie|sauvegarde'
  WHERE id = 'qm-5';

-- qm-6 : espace
UPDATE competencies SET
  subdomain = 'Se situer dans l''espace',
  label = 'Se repérer dans l''espace et le représenter',
  keywords = 'espace|plan|carte|repérer|géographie|paysage|quartier|ville|globe|continent|pays|France|représentation|maquette'
  WHERE id = 'qm-6';

-- qm-7 : temps
UPDATE competencies SET
  subdomain = 'Se situer dans le temps',
  label = 'Se repérer dans le temps et mesurer des durées',
  keywords = 'temps|durées|calendrier|frise|histoire|chronologie|siècle|époque|dates|événements|heure|semaine|mois|année'
  WHERE id = 'qm-7';

-- qm-8 : organisations du monde
UPDATE competencies SET
  subdomain = 'Explorer les organisations du monde',
  label = 'Comparer des modes de vie et comprendre qu''un espace est organisé',
  keywords = 'modes de vie|monde|paysages|organisation|habitat|ville|campagne|littoral|montagne|acteurs|environnement|interactions'
  WHERE id = 'qm-8';

-- Nouvelle compétence : réaliser des objets techniques (circuits, montage)
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('qm-9', 'Questionner le monde', 'Les objets techniques',
  'Réaliser quelques objets et circuits électriques simples',
  'circuit|électrique|pile|ampoule|interrupteur|montage|conducteur|isolant|objet technique|réaliser|sécurité',
  'CE1,CE2');
