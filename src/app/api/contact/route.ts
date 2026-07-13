import nodemailer from "nodemailer";

export const runtime = "nodejs";

type ContactPayload = {
  name: string;
  email: string;
  message: string;
  website: string;
};

type SmtpErrorDiagnostic = {
  name?: string;
  message?: string;
  code?: string | number;
  command?: string;
  responseCode?: number;
  errno?: string | number;
  syscall?: string;
  hostname?: string;
};

const SUCCESS_RESPONSE = {
  success: true,
  message: "Your message has been sent successfully.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validationError(message: string): Response {
  return Response.json({ success: false, message }, { status: 400 });
}

function getSmtpErrorDiagnostic(error: unknown): SmtpErrorDiagnostic {
  if (typeof error !== "object" || error === null) return {};

  const source = error as Record<string, unknown>;
  const diagnostic: SmtpErrorDiagnostic = {};

  if (typeof source.name === "string") diagnostic.name = source.name;
  if (typeof source.message === "string") diagnostic.message = source.message;
  if (typeof source.code === "string" || typeof source.code === "number") {
    diagnostic.code = source.code;
  }
  if (typeof source.command === "string") diagnostic.command = source.command;
  if (typeof source.responseCode === "number" && Number.isFinite(source.responseCode)) {
    diagnostic.responseCode = source.responseCode;
  }
  if (typeof source.errno === "string" || typeof source.errno === "number") {
    diagnostic.errno = source.errno;
  }
  if (typeof source.syscall === "string") diagnostic.syscall = source.syscall;
  if (typeof source.hostname === "string") diagnostic.hostname = source.hostname;

  return diagnostic;
}

function validatePayload(body: Record<string, unknown>):
  | { payload: ContactPayload }
  | { response: Response } {
  const { name, email, message, website = "" } = body;

  if (typeof name !== "string") {
    return { response: validationError("Name must be a string.") };
  }
  if (typeof email !== "string") {
    return { response: validationError("Email must be a string.") };
  }
  if (typeof message !== "string") {
    return { response: validationError("Message must be a string.") };
  }
  if (typeof website !== "string") {
    return { response: validationError("Website must be a string.") };
  }

  const payload = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    website: website.trim(),
  };

  if (payload.website) {
    return { payload };
  }

  if (!payload.name) {
    return { response: validationError("Name is required.") };
  }
  if (payload.name.length > 100) {
    return { response: validationError("Name must be 100 characters or fewer.") };
  }
  if (!payload.email) {
    return { response: validationError("Email is required.") };
  }
  if (payload.email.length > 254 || !EMAIL_PATTERN.test(payload.email)) {
    return { response: validationError("Please provide a valid email address.") };
  }
  if (!payload.message) {
    return { response: validationError("Message is required.") };
  }
  if (payload.message.length < 10) {
    return { response: validationError("Message must be at least 10 characters.") };
  }
  if (payload.message.length > 5000) {
    return { response: validationError("Message must be 5000 characters or fewer.") };
  }

  return { payload };
}

function getRequiredEnvironment(): {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
} {
  const requiredNames = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "CONTACT_TO",
  ] as const;

  const values = Object.fromEntries(
    requiredNames.map((name) => {
      const value = process.env[name];
      if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
      }
      return [name, value];
    }),
  ) as Record<(typeof requiredNames)[number], string>;

  const portText = values.SMTP_PORT.trim();
  if (!/^\d+$/.test(portText)) {
    throw new Error("SMTP_PORT must be an integer.");
  }

  const port = Number(portText);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be between 1 and 65535.");
  }

  return {
    host: values.SMTP_HOST,
    port,
    user: values.SMTP_USER,
    pass: values.SMTP_PASS,
    from: values.SMTP_FROM,
    to: values.CONTACT_TO,
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return validationError("Invalid JSON payload.");
  }

  if (!isPlainObject(body)) {
    return validationError("Request body must be a JSON object.");
  }

  const validation = validatePayload(body);
  if ("response" in validation) return validation.response;

  const { name, email, message, website } = validation.payload;

  if (website) {
    return Response.json(SUCCESS_RESPONSE);
  }

  try {
    const smtp = getRequiredEnvironment();
    const allowSelfSignedCertificate =
      process.env.NODE_ENV !== "production" &&
      process.env.SMTP_ALLOW_SELF_SIGNED === "true";

    if (allowSelfSignedCertificate) {
      console.warn("[contact] Development-only self-signed SMTP certificate allowance is active.");
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
      tls: {
        rejectUnauthorized: !allowSelfSignedCertificate,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });

    const subjectName = name.replace(/[\r\n]+/g, " ").trim();

    await transporter.sendMail({
      from: `"Gienah Website" <${smtp.from}>`,
      to: smtp.to,
      replyTo: email,
      subject: `New project inquiry — ${subjectName}`,
      text: [
        "A new project inquiry was submitted through the Gienah website.",
        "",
        `Visitor name: ${name}`,
        `Visitor email: ${email}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });

    return Response.json(SUCCESS_RESPONSE);
  } catch (error) {
    const diagnostic = getSmtpErrorDiagnostic(error);
    console.error("[contact] Unable to send contact email", diagnostic);

    return Response.json(
      {
        success: false,
        message: "Unable to send your message. Please try again.",
      },
      { status: 500 },
    );
  }
}
