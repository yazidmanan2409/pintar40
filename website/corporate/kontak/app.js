import { el } from "../shared/dom.js";
import { mountChrome } from "../shared/chrome.js";
import { withLang } from "../shared/lang.js";
import { HEADER, NEXT, FORM, CONFIRM } from "./content.js";

const lang = mountChrome("kontak");
const t = (pair) => pair[lang];
document.title = lang === "id" ? "Kontak PINTAR" : "Contact PINTAR";

const header = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap", style: "max-width:40em" }, [
    el("span", { class: "label label--accent", text: t(HEADER.eyebrow) }),
    el("h1", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(HEADER.headline) }),
    el("p", { class: "lede mt-4", text: t(HEADER.lede) }),
  ]),
]);

function field(labelPair, inputAttrs) {
  const id = `f-${inputAttrs.name}`;
  const tag = inputAttrs.tag || "input";
  const attrs = { ...inputAttrs, id };
  delete attrs.tag;
  return el("div", { class: "form-field" }, [
    el("label", { for: id, text: t(labelPair) }),
    el(tag, attrs),
  ]);
}

function selectField(labelPair, name, options) {
  const id = `f-${name}`;
  return el("div", { class: "form-field" }, [
    el("label", { for: id, text: t(labelPair) }),
    el("select", { id, name, required: true }, [
      el("option", { value: "", text: lang === "id" ? "Pilih salah satu" : "Choose one" }),
      ...options.map((o) => el("option", { value: t(o), text: t(o) })),
    ]),
  ]);
}

function renderForm() {
  const form = el("form", { class: "confirm-panel" }, [
    field(FORM.name, { name: "name", type: "text", required: true }),
    field(FORM.org, { name: "org", type: "text", required: true }),
    selectField(FORM.role, "role", FORM.roleOptions),
    field(FORM.email, { name: "email", type: "email", required: true }),
    field(FORM.phone, { name: "phone", type: "tel" }),
    field(FORM.message, { name: "message", tag: "textarea" }),
    el("button", { type: "submit", class: "btn btn--primary", text: t(FORM.submit) }),
    el("p", { class: "form-note", text: t(FORM.note) }),
  ]);
  // Inert by design (see the note above): submitting swaps the form panel
  // for a confirmation, and sends nothing anywhere.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("form-mount").replaceChildren(renderConfirm());
  });
  return form;
}

function renderConfirm() {
  return el("div", { class: "confirm-panel center", style: "max-width:32em; margin:0 auto" }, [
    el("h2", { style: "font-size:var(--fs-h2)", text: t(CONFIRM.headline) }),
    el("p", { class: "lede mt-3", style: "margin-left:auto; margin-right:auto", text: t(CONFIRM.body) }),
    el("a", { class: "btn btn--outline mt-6", href: withLang("/mini-pintar/", lang), text: t(CONFIRM.cta) }),
  ]);
}

const formSection = el("section", {}, [
  el("div", { class: "wrap grid-asym--rev" }, [
    el("div", { id: "form-mount" }, [renderForm()]),
    el("div", {}, [
      el("span", { class: "label label--accent", text: t(NEXT.label) }),
      el("ol", { class: "steps-list" }, NEXT.items.map((i) => el("li", { text: t(i) }))),
    ]),
  ]),
]);

const view = document.getElementById("view");
view.replaceChildren(header, formSection);
