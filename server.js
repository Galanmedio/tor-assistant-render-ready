const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "state.json");
const port = Number(process.env.PORT || 8080);
const appPin = process.env.TOR_APP_PIN || "";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(
        {
          current: {
            title: "",
            agency: "",
            budget: "",
            deadline: "",
            category: "เทคโนโลยีสารสนเทศ",
            torText: "",
            analysis: null,
          },
          pipeline: [],
          documents: [],
        },
        null,
        2
      ),
      "utf8"
    );
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const cleanPath = decodeURIComponent(requestUrl.pathname);
  const filePath = cleanPath === "/" ? path.join(publicDir, "index.html") : path.join(publicDir, cleanPath);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(path.resolve(publicDir))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=300",
    });
    res.end(content);
  });
}

async function handleApi(req, res) {
  ensureDataFile();

  if (req.url === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.url === "/api/state" && req.method === "GET") {
    const raw = fs.readFileSync(dataFile, "utf8");
    sendJson(res, 200, JSON.parse(raw));
    return;
  }

  if (req.url === "/api/state" && req.method === "PUT") {
    if (appPin && req.headers["x-tor-pin"] !== appPin) {
      sendJson(res, 401, { error: "Invalid PIN" });
      return;
    }

    try {
      const nextState = await readJsonBody(req);
      fs.writeFileSync(dataFile, JSON.stringify(nextState, null, 2), "utf8");
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 400, { error: "Invalid state data" });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`TOR Assistant Online is running on http://localhost:${port}`);
  });
}

module.exports = { server };
