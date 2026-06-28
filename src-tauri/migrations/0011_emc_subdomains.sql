UPDATE competencies SET subdomain = 'Altérité et sociabilité'
  WHERE id IN ('emc-1', 'emc-2', 'emc-5');

UPDATE competencies SET subdomain = 'Règles collectives et prise d''initiatives'
  WHERE id IN ('emc-3', 'emc-6');

UPDATE competencies SET subdomain = 'Principes et symboles de la République'
  WHERE id = 'emc-4';
