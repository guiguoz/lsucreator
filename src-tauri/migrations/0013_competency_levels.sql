-- Ajout d'une colonne "levels" pour filtrer les compétences par niveau scolaire
ALTER TABLE competencies ADD COLUMN levels TEXT NOT NULL DEFAULT 'CE1,CE2';

-- Les compétences actuelles sont toutes cycle 2 (CE1/CE2)
-- Quand des compétences CM1/CM2 (cycle 3) seront ajoutées, elles auront levels = 'CM1,CM2'
