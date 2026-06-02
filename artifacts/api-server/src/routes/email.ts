import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

router.post("/send-report", async (req, res) => {
  const { to, parentName, studentName, reportHtml, reportText } = req.body as {
    to: string;
    parentName: string;
    studentName: string;
    reportHtml: string;
    reportText: string;
  };

  if (!to || !reportHtml) {
    res.status(400).json({ success: false, message: "Missing required fields: to, reportHtml" });
    return;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    res.status(503).json({
      success: false,
      message: "Email service not configured. Please copy the report and share it manually. To enable emails, add GMAIL_USER and GMAIL_APP_PASSWORD secrets.",
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"Axyomis-X" <${gmailUser}>`,
      to,
      subject: `📚 Daily Learning Report — ${studentName} · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      text: reportText,
      html: reportHtml,
    });

    const reqLog = (req as any).log;
    reqLog?.info({ to, studentName }, "Parent report email sent");
    res.json({ success: true, message: `Report sent to ${to}` });
  } catch (err: any) {
    const reqLog = (req as any).log;
    reqLog?.error({ err }, "Failed to send parent report email");
    res.status(500).json({ success: false, message: `Failed to send: ${err.message}. Try copying the report instead.` });
  }
});

export default router;
