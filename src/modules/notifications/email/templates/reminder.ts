export interface ReminderTemplateData {
  title: string;
  startFormatted: string;
  endFormatted: string;
  htmlLink?: string;
  attendeeName: string;
  minutesUntil: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderReminder(data: ReminderTemplateData): { html: string; text: string } {
  const mins = data.minutesUntil;
  const timeNote = mins >= 60 ? `${Math.floor(mins / 60)} hour(s)` : `${mins} minute(s)`;

  const linkSection = data.htmlLink
    ? `<p><a href="${escapeHtml(data.htmlLink)}">View in Google Calendar</a></p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h2>Reminder: ${escapeHtml(data.title)}</h2>
  <p>Hi ${escapeHtml(data.attendeeName)},</p>
  <p>This is a reminder that your event starts in ${timeNote}.</p>
  <p><strong>Start:</strong> ${escapeHtml(data.startFormatted)}</p>
  <p><strong>End:</strong> ${escapeHtml(data.endFormatted)}</p>
  ${linkSection}
</body>
</html>`;

  const text = [
    `Reminder: ${data.title}`,
    `Hi ${data.attendeeName},`,
    `Your event starts in ${timeNote}.`,
    `Start: ${data.startFormatted}`,
    `End: ${data.endFormatted}`,
    data.htmlLink ? `View: ${data.htmlLink}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}
