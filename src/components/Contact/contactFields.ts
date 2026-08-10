// Client behaviour for <ContactFields>: the searchable country dropdown, plus
// Zod validation and submit. Shared by the two-step form and the single-step
// form. Idempotent per form element.
//
// When the fields live inside a `[data-contact]` wrapper (the two-step form),
// the ticked "señales" from step 1 are included in the payload (as their text,
// matching the `signals text[]` column); otherwise the signals array is empty.
import { contactSchema } from "./schema";

export function initContactFields(fieldsEl: HTMLFormElement) {
  if (fieldsEl.dataset.init) return;
  fieldsEl.dataset.init = "1";

  initCountryDropdown(fieldsEl);

  const fields = Array.from(fieldsEl.querySelectorAll<HTMLElement>(".field"));
  const submitBtn = fieldsEl.querySelector<HTMLButtonElement>("[data-submit]");
  const clearErrors = () => fields.forEach((f) => f.classList.remove("has-error"));

  // Let the host (e.g. the two-step slider) react to height changes.
  const emitLayout = () =>
    fieldsEl.dispatchEvent(new CustomEvent("contactfields:layout", { bubbles: true }));

  const signalsRoot = fieldsEl.closest<HTMLElement>("[data-contact]");
  const getSignals = () =>
    signalsRoot
      ? Array.from(signalsRoot.querySelectorAll<HTMLInputElement>("[data-signal]:checked")).map(
          (s) => s.value,
        )
      : [];

  // In-flight: spinner in the button + button disabled. Guarded by a flag too,
  // since a disabled button can still be bypassed (Enter in a text input).
  let sending = false;
  const setSending = (on: boolean) => {
    sending = on;
    fieldsEl.classList.toggle("is-sending", on);
    if (submitBtn) {
      submitBtn.disabled = on;
      submitBtn.setAttribute("aria-busy", String(on));
    }
  };

  fieldsEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    clearErrors();
    fieldsEl.classList.remove("is-error");

    const fd = new FormData(fieldsEl);
    const data = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phoneCountry: String(fd.get("phoneCountry") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      company: String(fd.get("company") ?? ""),
      signals: getSignals(),
    };

    const result = contactSchema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        fieldsEl.querySelector(`.field[data-field="${field}"]`)?.classList.add("has-error");
      }
      emitLayout();
      fieldsEl.querySelector<HTMLElement>(".field.has-error .input")?.focus();
      return;
    }

    const action = fieldsEl.dataset.action || "/api/contact";
    setSending(true);

    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSending(false);
      fieldsEl.classList.add("is-sent");
      if (submitBtn) submitBtn.disabled = true; // stays disabled: submitted
    } catch {
      setSending(false); // let them retry
      fieldsEl.classList.add("is-error");
    }

    emitLayout();
  });
}

// Custom, searchable country dropdown with SVG flags.
function initCountryDropdown(root: HTMLElement) {
  const wrap = root.querySelector<HTMLElement>("[data-country]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-country-toggle]");
  const pop = root.querySelector<HTMLElement>("[data-country-pop]");
  const search = root.querySelector<HTMLInputElement>("[data-country-search]");
  const list = root.querySelector<HTMLElement>("[data-country-list]");
  const valueInput = root.querySelector<HTMLInputElement>("[data-country-value]");
  const flagEl = root.querySelector<HTMLElement>("[data-country-flag]");
  const codeEl = root.querySelector<HTMLElement>("[data-country-code]");
  if (!wrap || !toggle || !pop || !search || !list || !valueInput || !flagEl || !codeEl) return;

  // Move the popover to <body> so it escapes any transformed / overflow-hidden
  // ancestor (the two-step slider), which would otherwise trap a fixed element.
  document.body.appendChild(pop);

  const opts = Array.from(pop.querySelectorAll<HTMLElement>("[data-country-opt]"));
  let open = false;
  let visible = opts;
  let activeIndex = -1;

  const position = () => {
    const r = toggle.getBoundingClientRect();
    pop.style.width = `${Math.max(r.width, 260)}px`;
    pop.style.left = `${r.left}px`;
    const below = r.bottom + 6;
    // Flip above the toggle if it would overflow the viewport bottom.
    if (below + pop.offsetHeight > window.innerHeight) {
      pop.style.top = `${Math.max(8, r.top - 6 - pop.offsetHeight)}px`;
    } else {
      pop.style.top = `${below}px`;
    }
  };

  const setActive = (i: number) => {
    visible.forEach((o) => o.classList.remove("is-active"));
    activeIndex = i;
    const el = visible[i];
    if (el) {
      el.classList.add("is-active");
      el.scrollIntoView({ block: "nearest" });
    }
  };

  const filter = () => {
    const q = search.value.trim().toLowerCase();
    visible = opts.filter((o) => {
      const match = !q || (o.dataset.search ?? "").includes(q);
      o.hidden = !match;
      return match;
    });
    setActive(visible.length ? 0 : -1);
  };

  const openPop = () => {
    open = true;
    pop.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    search.value = "";
    filter();
    const selected = visible.findIndex((o) => o.getAttribute("aria-selected") === "true");
    setActive(selected >= 0 ? selected : visible.length ? 0 : -1);
    position();
    search.focus();
  };

  const closePop = (focusToggle = false) => {
    open = false;
    pop.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (focusToggle) toggle.focus();
  };

  const select = (opt: HTMLElement) => {
    opts.forEach((o) => o.setAttribute("aria-selected", "false"));
    opt.setAttribute("aria-selected", "true");
    flagEl.className = `fi fi-${opt.dataset.iso}`;
    codeEl.textContent = opt.dataset.dial ?? "";
    valueInput.value = opt.dataset.dial ?? "";
    closePop(true);
  };

  toggle.addEventListener("click", () => (open ? closePop() : openPop()));
  search.addEventListener("input", filter);
  list.addEventListener("click", (e) => {
    const opt = (e.target as HTMLElement).closest<HTMLElement>("[data-country-opt]");
    if (opt) select(opt);
  });

  pop.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visible[activeIndex]) select(visible[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePop(true);
    }
  });

  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    if (open && !wrap.contains(target) && !pop.contains(target)) closePop();
  });

  window.addEventListener("scroll", () => open && position(), true);
  window.addEventListener("resize", () => open && position());
}
