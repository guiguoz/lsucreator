-- Remplacement des compétences EMC par celles du BO (ensel934_annexe_ok)
-- CE1 : Respecter les autres
-- CE2 : Apprendre ensemble et vivre ensemble

-- ═══ Suppression des compétences EMC redondantes ═══
-- Nettoyer d'abord les résultats et évaluations liés (FK constraint)
DELETE FROM results WHERE evaluation_id IN (
  SELECT id FROM evaluations WHERE competency_id IN ('emc-2', 'emc-5')
);
DELETE FROM evaluations WHERE competency_id IN ('emc-2', 'emc-5');
DELETE FROM competencies WHERE id IN (
  'emc-2',  -- Accepter les différences (fusionné dans Altérité et sociabilité)
  'emc-5'   -- Savoir coopérer (fusionné dans Altérité et sociabilité)
);

-- ═══ Mise à jour des compétences CE1 ═══

-- Altérité et sociabilité
UPDATE competencies SET
  label = 'S''entraider et partager avec les autres',
  subdomain = 'Altérité et sociabilité',
  keywords = 'entraide|partager|empathie|émotions|sentiments|solidarité|diversité|différences|respect|tolérance|coopérer',
  levels = 'CE1'
  WHERE id = 'emc-1';

-- Règles collectives et prise d'initiative
UPDATE competencies SET
  label = 'Connaître et appliquer les règles de vie en collectivité',
  subdomain = 'Règles collectives et prise d''initiative',
  keywords = 'règles|classe|école|vie|respect|règlement|vivre ensemble|civilité|civisme|comportement|dangers',
  levels = 'CE1'
  WHERE id = 'emc-3';

UPDATE competencies SET
  label = 'Prendre des initiatives et assumer des responsabilités',
  subdomain = 'Règles collectives et prise d''initiative',
  keywords = 'responsabilités|initiatives|autonomie|métiers|classe|engagement|choix|justifier|APER|APS',
  levels = 'CE1'
  WHERE id = 'emc-6';

-- Principes et symboles de la République
UPDATE competencies SET
  label = 'Identifier les symboles de la République et aborder la laïcité',
  subdomain = 'Principes et symboles de la République',
  keywords = 'République|symboles|drapeau|Marianne|devise|hymne|Marseillaise|liberté|égalité|fraternité|laïcité|conscience',
  levels = 'CE1'
  WHERE id = 'emc-4';

-- ═══ Ajout des compétences CE2 ═══

-- L'engagement pour le bien commun
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('emc-7', 'EMC', 'L''engagement pour le bien commun',
  'Se sensibiliser au bien commun et à la responsabilité',
  'bien commun|responsabilité|engagement|collectif|intérêt général|environnement|EDD|développement durable|éco-gestes',
  'CE2');

INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('emc-8', 'EMC', 'L''engagement pour le bien commun',
  'Connaître les institutions et services publics',
  'institutions|services publics|associations|police|pompiers|santé|hôpital|école|intérêt général|intérêt particulier',
  'CE2');

-- La République et son fonctionnement
INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('emc-9', 'EMC', 'La République et son fonctionnement',
  'Connaître le fonctionnement de la République',
  'République|fonctionnement|président|maire|élection|commune|vote|démocratie|chef de l''État|collectivité',
  'CE2');

INSERT INTO competencies (id, domain, subdomain, label, keywords, levels) VALUES
('emc-10', 'EMC', 'La République et son fonctionnement',
  'Comprendre la devise Liberté, Égalité, Fraternité',
  'devise|liberté|égalité|fraternité|valeurs|République|droits|principes',
  'CE2');
