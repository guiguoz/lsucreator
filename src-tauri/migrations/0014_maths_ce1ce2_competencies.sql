-- Remplacement des compétences Mathématiques par celles du BO (ensel135_annexe4)
-- CE1 et CE2 uniquement

-- ═══ Suppression des compétences Maths obsolètes ═══
-- Nettoyer d'abord les résultats et évaluations liés (FK constraint)
DELETE FROM results WHERE evaluation_id IN (
  SELECT id FROM evaluations WHERE competency_id = 'ma-eg-4'
);
DELETE FROM evaluations WHERE competency_id = 'ma-eg-4';
DELETE FROM competencies WHERE id IN (
  'ma-eg-4'   -- Reconnaître et utiliser les notions d'alignement... (trop détaillé, intégré dans Géométrie plane)
);

-- ═══ Mise à jour des compétences existantes ═══

-- Nombres, calcul et résolution de problèmes
UPDATE competencies SET
  label = 'Les nombres entiers',
  keywords = 'nombres|entiers|dénombrer|ordonner|comparer|numération|ranger|centaines|dizaines|milliers|lire|écrire|nommer|représenter|chiffres'
  WHERE id = 'ma-nc-1';

UPDATE competencies SET
  label = 'Les fractions',
  keywords = 'fractions|demi|quart|tiers|partage|fraction|moitié|double|parts égales'
  WHERE id = 'ma-nc-2';

UPDATE competencies SET
  label = 'Les quatre opérations',
  keywords = 'opérations|addition|soustraction|multiplication|division|calcul posé|technique opératoire|additionner|soustraire|multiplier|diviser'
  WHERE id = 'ma-nc-3';

UPDATE competencies SET
  label = 'La résolution de problèmes',
  keywords = 'problèmes|résoudre|raisonnement|énoncé|modéliser|schéma|solution'
  WHERE id = 'ma-nc-4';

-- Grandeurs et mesures
UPDATE competencies SET
  label = 'Les longueurs',
  keywords = 'longueurs|mesurer|cm|m|km|mm|règle graduée|comparer|estimer|longueur|périmètre'
  WHERE id = 'ma-gm-1';

UPDATE competencies SET
  label = 'Les masses',
  keywords = 'masses|peser|kg|g|balance|masse|lourd|léger|gramme|kilogramme'
  WHERE id = 'ma-gm-2';

UPDATE competencies SET
  label = 'La monnaie',
  keywords = 'monnaie|euros|centimes|pièces|billets|prix|rendre la monnaie|payer|acheter'
  WHERE id = 'ma-gm-3';

-- Espace et géométrie
UPDATE competencies SET
  label = 'Le repérage dans l''espace',
  keywords = 'espace|repérer|déplacer|plan|quadrillage|droite|gauche|dessus|dessous|codage|parcours'
  WHERE id = 'ma-eg-1';

UPDATE competencies SET
  label = 'Les solides',
  keywords = 'solides|cube|pavé|pyramide|boule|cylindre|3D|faces|arêtes|sommets|patron'
  WHERE id = 'ma-eg-2';

UPDATE competencies SET
  label = 'La géométrie plane',
  keywords = 'figures|carré|rectangle|triangle|cercle|géométrie|tracer|construire|angle droit|symétrie|alignement|équerre|règle|compas'
  WHERE id = 'ma-eg-3';

-- ═══ Ajout des nouvelles compétences ═══

-- Le calcul mental (Nombres, calcul et résolution de problèmes)
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('ma-nc-5', 'Mathématiques', 'Nombres, calcul et résolution de problèmes',
  'Le calcul mental',
  'calcul mental|mémoriser|faits numériques|tables|compléments|doubles|moitiés|calculer mentalement|procédures|automatismes',
  'CE1,CE2');

-- Les contenances (Grandeurs et mesures — CE2 uniquement)
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('ma-gm-4', 'Mathématiques', 'Grandeurs et mesures',
  'Les contenances',
  'contenances|litre|mL|cL|dL|capacité|contenance|récipient|verser|remplir',
  'CE2');

-- Le repérage dans le temps et les durées (Grandeurs et mesures)
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('ma-gm-5', 'Mathématiques', 'Grandeurs et mesures',
  'Le repérage dans le temps et les durées',
  'temps|durées|heure|minute|seconde|horloge|calendrier|mois|semaine|jour|chronomètre|avant|après',
  'CE1,CE2');

-- Organisation et gestion de données
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('ma-od-1', 'Mathématiques', 'Organisation et gestion de données',
  'Organisation et gestion de données',
  'données|tableau|graphique|organiser|trier|classer|diagramme|informations|lire un tableau|lire un graphique',
  'CE1,CE2');
