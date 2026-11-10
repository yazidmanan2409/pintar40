// Kontak / Contact: one form for every kind of message, including demo
// requests. «Minta Demo» anywhere on the site lands here with the subject
// already chosen. The form posts to api/kontak.php, which validates on the
// server and delivers the message by email; without JavaScript the same
// form still works, and the server answers with a page instead of JSON.

import { label, rel, photo, COMPANY, NAV_LABEL } from "../core.mjs";

export const SUBJECTS = [
  ["umum", "Pertanyaan umum", "General inquiry"],
  ["demo", "Minta demo", "Request a demo"],
  ["kemitraan", "Kemitraan", "Partnership"],
  ["dukungan", "Dukungan", "Support"],
  ["lainnya", "Lainnya", "Other"],
];

export default function contact(c) {
  const t = c.t;
  const action = rel(c.path, "api/kontak.php");
  const field = (name, lab, input, { optional = false, hint = "" } = {}) => `<div class="field">
      <label for="f-${name}">${lab}${optional ? ` <span class="opt">(${t("opsional", "optional")})</span>` : ""}</label>
      ${hint ? `<p class="field__hint" id="hint-${name}">${hint}</p>` : ""}
      ${input}
      <p class="field__err" id="err-${name}" hidden></p>
    </div>`;
  const describe = (name, hint) => `aria-describedby="${hint ? `hint-${name} ` : ""}err-${name}"`;

  const body = `
<section class="page-hero" aria-labelledby="contact-h" style="padding-bottom: var(--s-8)">
  <div class="wrap" data-reveal-group>
    ${label("", NAV_LABEL.contact[c.lang])}
    <h1 class="h1" id="contact-h" data-reveal>${t("Mari berbicara tentang <em>institusi Anda.</em>", "Let’s talk about <em>your institution.</em>")}</h1>
    <div class="page-hero__aside" data-reveal>
      <p class="lead">${t("Untuk demo, kemitraan, dukungan, atau pertanyaan apa pun. Kami membalas melalui email.", "For a demonstration, a partnership, support or any question at all. We reply by email.")}</p>
      ${photo(c, "P8")}
    </div>
  </div>
</section>

<section class="section section--rule" style="padding-top: var(--s-8)" aria-label="${t("Formulir kontak", "Contact form")}">
  <div class="wrap contact-grid">
    <aside class="contact-aside" data-reveal>
      <div>
        <h2>${t("Email langsung", "Email us directly")}</h2>
        <a class="contact-email" href="mailto:${COMPANY.email}">${COMPANY.email}</a>
      </div>
      <div>
        <h2>${t("Bagaimana demo berjalan", "How a demonstration works")}</h2>
        <ol class="steps">
          <li><span>${t("Pilih «Minta demo» dan ceritakan peran serta institusi Anda.", "Choose «Request a demo» and tell us your role and institution.")}</span></li>
          <li><span>${t("Kami membalas untuk menyepakati waktu.", "We reply to agree a time.")}</span></li>
          <li><span>${t("Tim kami memandu Anda melalui PINTAR dari sudut pandang peran Anda, dengan data contoh, lalu menjawab pertanyaan Anda.", "Our team guides you through PINTAR from the point of view of your role, using sample data, then answers your questions.")}</span></li>
        </ol>
      </div>
      <div>
        <h2>${t("Perusahaan", "Company")}</h2>
        <p class="small">${COMPANY.name} (${COMPANY.short})</p>
      </div>
    </aside>

    <div id="formulir">
      <form class="form" data-contact action="${action}" method="post" accept-charset="UTF-8">
        <div class="form__summary" tabindex="-1" role="group" aria-labelledby="sum-h" hidden><h2 id="sum-h">${t("Ada yang perlu diperbaiki:", "Please correct the following:")}</h2><ul></ul></div>
        <input type="hidden" name="lang" value="${c.lang}">
        <input type="hidden" name="started" value="">
        <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <div class="form__row">
          ${field("name", t("Nama", "Name"), `<input id="f-name" name="name" type="text" required maxlength="120" autocomplete="name" ${describe("name")}>`)}
          ${field("email", t("Alamat email", "Email address"), `<input id="f-email" name="email" type="email" required maxlength="254" autocomplete="email" inputmode="email" ${describe("email")}>`)}
        </div>
        <div class="form__row">
          ${field("institution", t("Institusi atau organisasi", "Institution or organisation"), `<input id="f-institution" name="institution" type="text" maxlength="160" autocomplete="organization" ${describe("institution")}>`, { optional: true })}
          ${field("subject", t("Subjek", "Subject"), `<select id="f-subject" name="subject" required ${describe("subject")}>${SUBJECTS.map(([v, id, en]) => `<option value="${v}">${t(id, en)}</option>`).join("")}</select>`)}
        </div>
        ${field("message", t("Pesan", "Message"), `<textarea id="f-message" name="message" required minlength="10" maxlength="5000" rows="7" ${describe("message", true)}></textarea>`,
          { hint: t("Untuk demo, sebutkan peran Anda dan apa yang ingin Anda lihat.", "For a demonstration, tell us your role and what you would like to see.") })}
        <div class="field">
          <div class="check"><input id="f-consent" name="consent" type="checkbox" value="yes" required aria-describedby="err-consent">
            <label for="f-consent">${t(`Saya setuju ${COMPANY.name} memproses data yang saya kirimkan untuk menanggapi pesan ini, sebagaimana dijelaskan dalam <a href="${c.href("privacy")}">Kebijakan Privasi</a>.`, `I agree that ${COMPANY.name} may process the information I send in order to respond to this message, as described in the <a href="${c.href("privacy")}">Privacy Policy</a>.`)}</label></div>
          <p class="field__err" id="err-consent" hidden></p>
        </div>
        <div class="form__foot">
          <button class="btn" type="submit">${t("Kirim pesan", "Send message")}</button>
          <p class="small" data-status role="status" aria-live="polite"></p>
        </div>
        <p class="caption">${t(`Pesan Anda dikirim sebagai email ke ${COMPANY.email} dan disimpan di kotak surat itu untuk ditindaklanjuti. Formulir di situs ini sendiri tidak menyimpan salinan isi pesan, dan situs ini tidak memakai cookie. Rinciannya, termasuk catatan keamanan yang disimpan, ada di <a href="${c.href("privacy")}">Kebijakan Privasi</a>.`, `Your message is sent as an email to ${COMPANY.email} and kept in that mailbox so that we can follow it up. The form on this website keeps no copy of what you write, and the website uses no cookies. The details, including the security records it keeps, are in the <a href="${c.href("privacy")}">Privacy Policy</a>.`)}</p>
      </form>
      <div class="form__done" id="form-done" tabindex="-1" hidden>
        <h2>${t("Terima kasih. Pesan Anda sudah terkirim.", "Thank you. Your message has been sent.")}</h2>
        <p class="body">${t("Kami akan membalas ke alamat email yang Anda berikan. Bila Anda perlu menambahkan sesuatu, kirim email ke", "We will reply to the email address you gave. If you need to add anything, write to")} <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>.</p>
      </div>
    </div>
  </div>
</section>
`;
  return {
    title: t("Kontak — PINTAR", "Contact — PINTAR"),
    description: t(`Hubungi tim PINTAR untuk demo, kemitraan, dukungan, atau pertanyaan umum. Email: ${COMPANY.email}.`, `Contact the PINTAR team for a demonstration, partnership, support or general questions. Email: ${COMPANY.email}.`),
    body,
  };
}
