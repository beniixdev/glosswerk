import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    "Hiányzó Supabase-beállítás. Másold le a .env.example fájlt .env néven, majd töltsd ki az értékeket."
  );
  process.exit(1);
}

function isPublicSupabaseKey(key) {
  if (key.startsWith("sb_publishable_")) return true;

  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString("utf8")
      );
      return payload.role === "anon";
    } catch {
      return false;
    }
  }

  return false;
}

if (isPublicSupabaseKey(supabaseSecretKey)) {
  console.error(
    "A SUPABASE_SECRET_KEY publikus/anon kulcsot tartalmaz. A backendhez a Supabase secret key vagy a régi service_role kulcs szükséges."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-origin" }
  })
);
app.use(express.json({ limit: "20kb" }));

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Túl sok kérés érkezett. Próbáld újra néhány perc múlva." }
});

const services = new Set([
  "kulso-mosas",
  "belso-detailing",
  "gepi-polirozas",
  "keramia-bevonat"
]);

const serviceLabels = {
  "kulso-mosas": "Külső mosás",
  "belso-detailing": "Belső detailing",
  "gepi-polirozas": "Gépi polírozás",
  "keramia-bevonat": "Kerámia bevonat"
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function dateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validateBooking(body) {
  const booking = {
    name: normalizeText(body?.name),
    email: normalizeText(body?.email).toLowerCase(),
    phone: normalizeText(body?.phone),
    car: normalizeText(body?.car),
    service: normalizeText(body?.service),
    requested_date: normalizeText(body?.date),
    message: normalizeText(body?.message)
  };

  const errors = [];
  if (booking.name.length < 3 || booking.name.length > 50) {
    errors.push("A név 3–50 karakter hosszú legyen.");
  }
  if (
    booking.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)
  ) {
    errors.push("Adj meg egy érvényes e-mail-címet.");
  }
  if (!/^[0-9+() /-]{9,20}$/.test(booking.phone)) {
    errors.push("Adj meg egy érvényes telefonszámot.");
  }
  if (booking.car.length < 2 || booking.car.length > 50) {
    errors.push("Az autó típusa 2–50 karakter hosszú legyen.");
  }
  if (!services.has(booking.service)) {
    errors.push("Válassz érvényes szolgáltatást.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.requested_date)) {
    errors.push("Adj meg egy érvényes dátumot.");
  } else {
    const today = new Date();
    const latestDate = new Date();
    latestDate.setDate(latestDate.getDate() + 90);
    if (
      booking.requested_date < dateOnly(today) ||
      booking.requested_date > dateOnly(latestDate)
    ) {
      errors.push("A dátum a mai naptól számított 90 napon belül legyen.");
    }
  }
  if (booking.message.length < 10 || booking.message.length > 500) {
    errors.push("A megjegyzés 10–500 karakter hosszú legyen.");
  }

  return { booking, errors };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toPublicBooking(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    car: row.car,
    service: serviceLabels[row.service] ?? row.service,
    date: row.requested_date,
    message: row.message,
    status: row.status,
    createdAt: row.created_at
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.post("/api/bookings", bookingLimiter, async (request, response) => {
  const { booking, errors } = validateBooking(request.body);
  if (errors.length > 0) {
    return response.status(400).json({ error: errors[0], errors });
  }

  const accessToken = crypto.randomBytes(32).toString("hex");
  const { data, error } = await supabase
    .from("bookings")
    .insert({ ...booking, access_token_hash: hashToken(accessToken) })
    .select(
      "id,name,email,phone,car,service,requested_date,message,status,created_at"
    )
    .single();

  if (error) {
    console.error("Foglalás mentési hiba:", error.message);
    return response.status(500).json({
      error: "A foglalást most nem sikerült elmenteni. Próbáld újra később."
    });
  }

  return response.status(201).json({
    booking: toPublicBooking(data),
    accessToken
  });
});

app.get("/api/bookings/:id", bookingLimiter, async (request, response) => {
  const { id } = request.params;
  const accessToken = request.get("x-booking-token") ?? "";

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
    !/^[0-9a-f]{64}$/i.test(accessToken)
  ) {
    return response.status(404).json({ error: "A foglalás nem található." });
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,name,email,phone,car,service,requested_date,message,status,created_at"
    )
    .eq("id", id)
    .eq("access_token_hash", hashToken(accessToken))
    .maybeSingle();

  if (error) {
    console.error("Foglalás lekérési hiba:", error.message);
    return response.status(500).json({ error: "A foglalás most nem tölthető be." });
  }
  if (!data) {
    return response.status(404).json({ error: "A foglalás nem található." });
  }

  return response.json({ booking: toPublicBooking(data) });
});

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.get("/style.css", (_request, response) => response.sendFile(path.join(__dirname, "style.css")));
app.get("/style2.css", (_request, response) => response.sendFile(path.join(__dirname, "style2.css")));
app.get("/script.js", (_request, response) => response.sendFile(path.join(__dirname, "script.js")));

const pages = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/form.html", "form.html"],
  ["/results.html", "results.html"]
]);

app.get([...pages.keys()], (request, response) => {
  response.sendFile(path.join(__dirname, pages.get(request.path)));
});

app.use((_request, response) => {
  response.status(404).send("Az oldal nem található.");
});

app.use((error, _request, response, _next) => {
  console.error("Váratlan szerverhiba:", error);
  response.status(500).json({ error: "Váratlan szerverhiba történt." });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`GlossWerk elindult: http://localhost:${port}`);
});
