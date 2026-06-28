-- Renommage des sous-domaines français
UPDATE competencies SET subdomain = 'Oral'
  WHERE domain = 'Français' AND subdomain = 'Langage oral';

UPDATE competencies SET subdomain = 'Lecture'
  WHERE domain = 'Français' AND subdomain = 'Lecture et compréhension de l''écrit';

-- Éclatement de "Étude de la langue" en 3 sous-domaines
UPDATE competencies SET subdomain = 'Orthographe'
  WHERE id IN ('fr-el-1', 'fr-el-2', 'fr-el-4');

UPDATE competencies SET subdomain = 'Grammaire'
  WHERE id IN ('fr-el-3', 'fr-el-5');

UPDATE competencies SET subdomain = 'Vocabulaire'
  WHERE id IN ('fr-el-6', 'fr-el-7');
