DELETE FROM "cities"
WHERE LOWER("name") = 'lima'
   OR LOWER("slug") = 'lima';
