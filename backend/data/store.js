const users = [
  {
    id: "usr_admin_1",
    matricula: "ADM-1001",
    password: "admin123",
    role: "administrador",
    name: "Valeria Hinojosa",
    email: "valeria@vhvgroup.com",
    position: "Directora de Talento",
    company: "VHV Group",
  },
  {
    id: "usr_novato_1",
    matricula: "NOV-2401",
    password: "novato123",
    role: "novato",
    name: "Daniela Nava",
    email: "daniela.temp@vhvgroup.com",
    position: "Candidata en induccion",
    company: "Ingreso temporal",
  },
  {
    id: "usr_user_1",
    matricula: "USR-7788",
    password: "usuario123",
    role: "usuario",
    name: "Carlos Mejia",
    email: "carlos@vhvgroup.com",
    position: "Supervisor operativo",
    company: "VHV Group",
  },
];

const candidates = [
  {
    id: "cand_1",
    name: "Andrea Ponce",
    email: "andrea@example.com",
    role: "Asesora de operaciones",
    stage: "Nuevo",
    score: 61,
    tags: ["CV recibido", "Whatsapp", "Respuesta rapida"],
    notes: "Buen trato, falta validar experiencia en rutas.",
  },
  {
    id: "cand_2",
    name: "Luis Becerra",
    email: "luis@example.com",
    role: "Ejecutivo comercial",
    stage: "Filtro IA",
    score: 88,
    tags: ["Alta coincidencia", "Disponibilidad inmediata"],
    notes: "La IA detecta fit fuerte en cierre y seguimiento comercial.",
  },
  {
    id: "cand_3",
    name: "Diana Ibarra",
    email: "diana@example.com",
    role: "Coordinadora de capacitacion",
    stage: "Entrevista",
    score: 91,
    tags: ["Entrevista tecnica", "Excelente comunicacion"],
    notes: "Pasar a entrevista final con talento y direccion.",
  },
  {
    id: "cand_4",
    name: "Rafael Soto",
    email: "rafael@example.com",
    role: "Asesor de operaciones",
    stage: "Descartado",
    score: 48,
    tags: ["Sin experiencia clave", "No se presento"],
    notes: "Descartado por inasistencia y brecha en requerimientos.",
  },
];

const courses = [
  {
    id: "course_1",
    title: "Induccion VHV",
    level: "novato",
    accessCode: "IND-410",
    format: "Video + quiz",
    summary: "Historia, cultura, reglas y primeros pasos dentro de la empresa.",
  },
  {
    id: "course_2",
    title: "Atencion al cliente profesional",
    level: "novato",
    accessCode: "CLI-220",
    format: "Taller en vivo",
    summary: "Practicas de comunicacion, tono y solucion de incidencias.",
  },
  {
    id: "course_3",
    title: "Actualizacion operativa trimestral",
    level: "usuario",
    accessCode: "UPD-900",
    format: "Archivo + examen",
    summary: "Cambios de procesos, KPIs y documentacion interna.",
  },
];

const notices = [
  {
    id: "notice_1",
    type: "Aviso",
    title: "Semana de integracion profesional",
    summary: "Todos los novatos tendran acceso a talleres de cultura, procesos y seguridad laboral.",
  },
  {
    id: "notice_2",
    type: "Blog",
    title: "Como destacar en entrevistas internas",
    summary: "Guia breve con recomendaciones de presentacion profesional y comunicacion.",
  },
];

module.exports = {
  users,
  candidates,
  courses,
  notices,
};
