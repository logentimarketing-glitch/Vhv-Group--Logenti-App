export const accessCards = [
  {
    tag: "Rol 01",
    title: "Administradores",
    description:
      "Gestionan vacantes, reclutadores, panel de IA, novedades, marketing y seguimiento completo del talento.",
    features: [
      "Dashboard con etapas y filtros inteligentes",
      "Etiquetas y observaciones sobre candidatos",
      "Conexion con reclutadores y redes sociales",
    ],
    href: "/dashboard",
  },
  {
    tag: "Rol 02",
    title: "En proceso de vacante",
    description:
      "Novatos con acceso temporal a capacitaciones, chatbot inicial, talleres y contacto con administradores.",
    features: [
      "Acceso por matricula y contrasena",
      "Clases con clave de acceso",
      "Seguimiento de avance hacia entrevistas",
    ],
    href: "/lms",
  },
  {
    tag: "Rol 03",
    title: "Ya trabajando",
    description:
      "Usuarios activos con actualizaciones, clases, comunidad, novedades y perfil profesional enriquecido.",
    features: [
      "Contenido profesional y multimedia",
      "Busqueda de administradores",
      "Asignaciones y materiales tipo Teams",
    ],
    href: "/community",
  },
];

export const roleDirectory = [
  { name: "Valeria Hinojosa", position: "Directora de Talento", email: "valeria@vhvgroup.com", role: "administrador" },
  { name: "Sergio Leon", position: "Reclutador Senior", email: "sergio@vhvgroup.com", role: "administrador" },
  { name: "Mariana Cruz", position: "Lider de Capacitacion", email: "mariana@vhvgroup.com", role: "administrador" },
];

export const announcements = [
  { type: "Aviso", title: "Semana de integracion profesional", summary: "Todos los novatos tendran acceso a talleres de cultura, procesos y seguridad laboral." },
  { type: "Blog", title: "Como destacar en entrevistas internas", summary: "Guia breve con recomendaciones de presentacion profesional y comunicacion." },
  { type: "Video", title: "Recorrido por la plataforma", summary: "Explicacion interactiva del dashboard, clases, tareas y mensajeria automatizada." },
];

export const adminSummary = [
  { label: "Vacantes abiertas", value: "18", helper: "5 requieren cobertura inmediata" },
  { label: "Candidatos priorizados por IA", value: "42", helper: "Puntaje alto para entrevista" },
  { label: "Novatos en capacitacion", value: "67", helper: "Con acceso temporal activo" },
  { label: "Usuarios con cursos pendientes", value: "24", helper: "Pendientes de actualizacion" },
];

export const vacancies = [
  { title: "Asesor de operaciones", area: "Logistica", location: "Monterrey", stage: "Busqueda activa", candidates: 14 },
  { title: "Ejecutivo comercial", area: "Ventas", location: "CDMX", stage: "Entrevistas", candidates: 9 },
  { title: "Coordinador de capacitacion", area: "Talento", location: "Remoto", stage: "Evaluacion IA", candidates: 11 },
];

export const recruiters = [
  {
    name: "Sergio Leon",
    email: "sergio@vhvgroup.com",
    position: "Reclutador Senior",
    manages: ["Operaciones", "Ventas", "Filtro inicial"],
  },
  {
    name: "Karen Morales",
    email: "karen@vhvgroup.com",
    position: "Recruiter Tech",
    manages: ["Perfiles digitales", "Entrevistas", "Reportes IA"],
  },
  {
    name: "Fernanda Ruiz",
    email: "fernanda@vhvgroup.com",
    position: "Coordinadora de talento",
    manages: ["Onboarding", "Capacitacion", "Feedback"],
  },
];

export const chatbotMessages = [
  { from: "user", text: "Quiero saber si ya avance a entrevista y hablar con administracion." },
  { from: "bot", text: "Claro. Primero reviso tu matricula, tu etapa y te comparto estatus. Si hace falta, escalo tu caso a un administrador." },
  { from: "user", text: "Tambien quiero entrar a mi taller de induccion." },
  { from: "bot", text: "Tu taller esta habilitado para nivel novato. La clave actual es IND-410 y ya tengo lista la liga del aula." },
];

export const stages = ["Nuevo", "Filtro IA", "Entrevista", "Descartado"];

export const candidates = [
  {
    name: "Andrea Ponce",
    role: "Asesora de operaciones",
    stage: "Nuevo",
    score: 61,
    tags: ["CV recibido", "Whatsapp", "Respuesta rapida"],
    notes: "Buen trato, falta validar experiencia en rutas.",
  },
  {
    name: "Luis Becerra",
    role: "Ejecutivo comercial",
    stage: "Filtro IA",
    score: 88,
    tags: ["Alta coincidencia", "Disponibilidad inmediata"],
    notes: "La IA detecta fit fuerte en cierre y seguimiento comercial.",
  },
  {
    name: "Diana Ibarra",
    role: "Coordinadora de capacitacion",
    stage: "Entrevista",
    score: 91,
    tags: ["Entrevista tecnica", "Excelente comunicacion"],
    notes: "Pasar a entrevista final con talento y direccion.",
  },
  {
    name: "Rafael Soto",
    role: "Asesor de operaciones",
    stage: "Descartado",
    score: 48,
    tags: ["Sin experiencia clave", "No se presento"],
    notes: "Descartado por inasistencia y brecha en requerimientos.",
  },
];

export const studentGroups = [
  { title: "Grupo administrador", description: "Control total sobre reclutamiento, clases, novedades y contenido.", label: "administrador" },
  { title: "Grupo novato", description: "Acceso temporal a induccion, entrenamientos y seguimiento de vacante.", label: "novato" },
  { title: "Grupo usuario", description: "Personal activo con cursos de actualizacion y comunidad interna.", label: "usuario" },
];

export const classes = [
  { title: "Induccion VHV", level: "Novato", code: "IND-410", format: "Video + quiz", summary: "Historia, cultura, reglas y primeros pasos dentro de la empresa." },
  { title: "Atencion al cliente profesional", level: "Novato", code: "CLI-220", format: "Taller en vivo", summary: "Practicas de comunicacion, tono y solucion de incidencias." },
  { title: "Actualizacion operativa trimestral", level: "Usuario", code: "UPD-900", format: "Archivo + examen", summary: "Cambios de procesos, KPIs y documentacion interna." },
];

export const communityPosts = [
  { author: "Carlos Mejia", role: "usuario", content: "Comparti un video corto con buenas practicas de servicio en campo para apoyar a nuevos ingresos.", media: ["video", "foto"] },
  { author: "Daniela Nava", role: "novato", content: "Subi evidencia de mi primera actividad de induccion y una reflexion profesional sobre el taller.", media: ["blog", "archivo"] },
];

export const socialChannels = [
  { name: "Instagram Recruiting", status: "Conectado", owner: "Marketing RH" },
  { name: "LinkedIn Empresa", status: "Conectado", owner: "Direccion" },
  { name: "Facebook Vacantes", status: "Pendiente de revision", owner: "Administracion" },
];

export const marketingQueue = [
  { title: "Convocatoria para asesores de operaciones", summary: "Pieza con requisitos, horarios y beneficios para publicar hoy.", channel: "Facebook", status: "Pendiente" },
  { title: "Historias del equipo", summary: "Video corto con testimonios de usuarios activos para employer branding.", channel: "Instagram", status: "Aprobado" },
  { title: "Blog de crecimiento profesional", summary: "Entrada para LinkedIn sobre capacitacion y trayectoria interna.", channel: "LinkedIn", status: "En revision" },
];

export const profileExamples = [
  {
    name: "Valeria Hinojosa",
    email: "valeria@vhvgroup.com",
    position: "Directora de Talento",
    company: "VHV Group",
    role: "administrador",
    access: "Matricula fija",
    summary: "Gestiona reclutadores, dashboards, publicaciones y grupos de clase.",
  },
  {
    name: "Daniela Nava",
    email: "daniela.temp@vhvgroup.com",
    position: "Candidata en induccion",
    company: "Ingreso temporal",
    role: "novato",
    access: "Matricula temporal",
    summary: "Accede a talleres, tareas y seguimiento de avance hacia contratacion.",
  },
  {
    name: "Carlos Mejia",
    email: "carlos@vhvgroup.com",
    position: "Supervisor operativo",
    company: "VHV Group",
    role: "usuario",
    access: "Matricula fija",
    summary: "Comparte contenido profesional, actualizaciones y evidencia de cursos.",
  },
];
