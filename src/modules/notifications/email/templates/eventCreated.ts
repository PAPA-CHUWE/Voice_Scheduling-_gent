export interface EventCreatedTemplateData {
  title: string;
  description?: string;
  startFormatted: string;
  endFormatted: string;
  htmlLink?: string;
  attendeeName: string;
}

export function renderEventCreated(data: EventCreatedTemplateData): { html: string; text: string } {
  const startFormatted = data.startFormatted;
  const endFormatted = data.endFormatted;
  const desc = data.description?.trim() ? `<p>${escapeHtml(data.description)}</p>` : "";
  const linkSection = data.htmlLink
    ? `<p><a href="${escapeHtml(data.htmlLink)}">View in Google Calendar</a></p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h2>Event confirmed</h2>
  <p>Hi ${escapeHtml(data.attendeeName)},</p>
  <p>Your event has been scheduled.</p>
  <p><strong>${escapeHtml(data.title)}</strong></p>
  ${desc}
  <p><strong>Start:</strong> ${escapeHtml(startFormatted)}</p>
  <p><strong>End:</strong> ${escapeHtml(endFormatted)}</p>
  ${linkSection}
  <p><em>If this looks wrong, reply to this email or contact support.</em></p>
</body>
</html>`;

  const text = [
    `Event confirmed`,
    `Hi ${data.attendeeName},`,
    `Your event has been scheduled: ${data.title}`,
    data.description?.trim() ? `Description: ${data.description}` : "",
    `Start: ${startFormatted}`,
    `End: ${endFormatted}`,
    data.htmlLink ? `View in Google Calendar: ${data.htmlLink}` : "",
    `If this looks wrong, reply to this email or contact support.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
