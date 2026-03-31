const http = require("http");
const { URL } = require("url");
const { users, candidates, courses, notices } = require("./data/store");

const PORT = Number(process.env.PORT || 4000);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function chatbotReply(message) {
  const content = String(message || "").toLowerCase();

  if (content.includes("entrevista")) {
    return "Tu proceso muestra avance a entrevista. El sistema deja tu caso listo y un administrador puede confirmar fecha y hora.";
  }

  if (content.includes("taller") || content.includes("clase")) {
    return "Tu siguiente clase esta disponible en el modulo LMS. Revisa la clave de acceso asignada a tu nivel.";
  }

  if (content.includes("administrador") || content.includes("reclutador")) {
    return "Puedo registrar tu mensaje primero y enviarlo al administrador o reclutador correcto con contexto.";
  }

  return "Puedo ayudarte con vacantes, entrevistas, talleres, clases, perfiles de administradores y seguimiento de candidatos.";
}

function candidateScore(query, candidate) {
  const haystack = `${candidate.role} ${candidate.tags.join(" ")} ${candidate.notes}`.toLowerCase();
  let score = candidate.score;

  String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      if (haystack.includes(word)) {
        score += 4;
      }
    });

  return Math.min(score, 99);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true, service: "vhv-backend", port: PORT });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admins") {
    sendJson(
      res,
      200,
      users.filter((user) => user.role === "administrador"),
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/courses") {
    sendJson(res, 200, courses);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/notices") {
    sendJson(res, 200, notices);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/candidates") {
    sendJson(res, 200, candidates);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    try {
      const body = await readBody(req);
      const matricula = String(body.matricula || "").trim().toUpperCase();
      const password = String(body.password || "");
      const user = users.find(
        (item) => item.matricula === matricula && item.password === password,
      );

      if (!user) {
        sendJson(res, 401, { error: "Matricula o contrasena incorrecta." });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        token: `${user.role}:${user.matricula}`,
        user: {
          id: user.id,
          matricula: user.matricula,
          role: user.role,
          name: user.name,
          email: user.email,
          position: user.position,
          company: user.company,
        },
      });
      return;
    } catch (error) {
      sendJson(res, 400, { error: "Solicitud invalida.", detail: String(error) });
      return;
    }
  }

  if (req.method === "POST" && url.pathname === "/api/ai/chatbot") {
    try {
      const body = await readBody(req);
      sendJson(res, 200, { reply: chatbotReply(body.message) });
      return;
    } catch (error) {
      sendJson(res, 400, { error: "Solicitud invalida.", detail: String(error) });
      return;
    }
  }

  if (req.method === "POST" && url.pathname === "/api/candidates/filter") {
    try {
      const body = await readBody(req);
      const query = String(body.query || "");
      const result = candidates
        .map((candidate) => {
          const aiScore = candidateScore(query, candidate);
          return {
            ...candidate,
            aiScore,
            decision:
              aiScore >= 85
                ? "Avanzar a entrevista"
                : aiScore >= 65
                  ? "Revisar por reclutador"
                  : "Posible descarte",
          };
        })
        .sort((a, b) => b.aiScore - a.aiScore);

      sendJson(res, 200, { query, result });
      return;
    } catch (error) {
      sendJson(res, 400, { error: "Solicitud invalida.", detail: String(error) });
      return;
    }
  }

  sendJson(res, 404, { error: "Ruta no encontrada." });
});

server.listen(PORT, () => {
  console.log(`VHV backend listening on http://localhost:${PORT}`);
});
