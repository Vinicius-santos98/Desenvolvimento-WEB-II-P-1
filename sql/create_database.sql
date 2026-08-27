-- Execute este script conectado ao Postgres (psql ou pgAdmin) para criar
-- o banco de dados usado pela API, equivalente ao que foi feito na aula.
--
-- Via linha de comando (conectando ao banco padrão "postgres"):
--   psql -U postgres -h localhost -c "CREATE DATABASE node_api WITH ENCODING 'UTF8';"

CREATE DATABASE node_api
  WITH ENCODING 'UTF8';
