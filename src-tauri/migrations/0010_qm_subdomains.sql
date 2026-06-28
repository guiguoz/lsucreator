-- Vivant, matière, objets : qm-1 (matière), qm-2, qm-3 (vivant), qm-4, qm-5 (objets), qm-8
UPDATE competencies SET subdomain = 'Vivant, matière, objets'
  WHERE id IN ('qm-1', 'qm-2', 'qm-3', 'qm-4', 'qm-5', 'qm-8');

-- Espace, temps : qm-6, qm-7
UPDATE competencies SET subdomain = 'Espace, temps'
  WHERE id IN ('qm-6', 'qm-7');
