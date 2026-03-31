INSERT INTO users (id, matricula, password_hash, role, name, email, position, company)
VALUES
  ('usr_admin_1', 'ADM-1001', 'demo-admin123', 'administrador', 'Valeria Hinojosa', 'valeria@vhvgroup.com', 'Directora de Talento', 'VHV Group'),
  ('usr_novato_1', 'NOV-2401', 'demo-novato123', 'novato', 'Daniela Nava', 'daniela.temp@vhvgroup.com', 'Candidata en induccion', 'Ingreso temporal'),
  ('usr_user_1', 'USR-7788', 'demo-usuario123', 'usuario', 'Carlos Mejia', 'carlos@vhvgroup.com', 'Supervisor operativo', 'VHV Group');

INSERT INTO courses (id, title, level, access_code, format, summary)
VALUES
  ('course_1', 'Induccion VHV', 'novato', 'IND-410', 'Video + quiz', 'Historia, cultura, reglas y primeros pasos dentro de la empresa.'),
  ('course_2', 'Atencion al cliente profesional', 'novato', 'CLI-220', 'Taller en vivo', 'Practicas de comunicacion, tono y solucion de incidencias.'),
  ('course_3', 'Actualizacion operativa trimestral', 'usuario', 'UPD-900', 'Archivo + examen', 'Cambios de procesos, KPIs y documentacion interna.');
