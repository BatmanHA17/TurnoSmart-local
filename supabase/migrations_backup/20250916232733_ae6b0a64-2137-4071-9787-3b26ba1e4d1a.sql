-- Limpiar colaboradores exceptuando Batman
DELETE FROM colaborador_roles WHERE colaborador_id != 'eafcf14c-598c-48ab-b4e5-ab4cf79c58c7';
DELETE FROM compensatory_time_off WHERE colaborador_id != 'eafcf14c-598c-48ab-b4e5-ab4cf79c58c7';
DELETE FROM compensatory_time_history WHERE colaborador_id != 'eafcf14c-598c-48ab-b4e5-ab4cf79c58c7';
DELETE FROM contract_history WHERE colaborador_id != 'eafcf14c-598c-48ab-b4e5-ab4cf79c58c7';
DELETE FROM colaboradores WHERE id != 'eafcf14c-598c-48ab-b4e5-ab4cf79c58c7';