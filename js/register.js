const form = document.getElementById("registerForm");
const $ = (id) => document.getElementById(id);
const hint = $("pwHint");

// Show / hide password buttons
document.querySelectorAll("[data-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.toggle);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});

const passwordOk = (v) => v.length >= 8 && /\d/.test(v) && /[^A-Za-z0-9\s]/.test(v);

const validators = {
  firstName: (v) => (v.trim() ? "" : "Enter your first name."),
  lastName: (v) => (v.trim() ? "" : "Enter your last name."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address."),
  birthdate: (v) => {
    if (!v) return "Select your birthdate.";
    const d = new Date(v), now = new Date();
    if (d > now) return "Birthdate can't be in the future.";
    let age = now.getFullYear() - d.getFullYear();
    if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
    return age >= 13 ? "" : "You must be at least 13 years old to register.";
  },
  username: (v) => (/^[A-Za-z0-9_.]{3,}$/.test(v) ? "" : "Use at least 3 letters, numbers, underscores, or periods."),
  password: (v) => (passwordOk(v) ? "" : "Password doesn't meet the requirements below."),
  confirm: (v) => (v && v === $("password").value ? "" : "Passwords don't match."),
};

function show(id, message) {
  document.querySelector(`[data-for="${id}"]`).textContent = message;
  const box = $(id).closest(".field__box");
  if (box) box.classList.toggle("is-invalid", Boolean(message));
  return !message;
}

Object.keys(validators).forEach((id) => {
  $(id).addEventListener("blur", () => show(id, validators[id]($(id).value)));
  $(id).addEventListener("input", () => {
    if (document.querySelector(`[data-for="${id}"]`).textContent) show(id, validators[id]($(id).value));
  });
});

// Live password hint
$("password").addEventListener("input", (e) => {
  const v = e.target.value;
  hint.classList.toggle("is-ok", passwordOk(v));
  hint.classList.toggle("is-bad", v.length > 0 && !passwordOk(v));
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let ok = true;
  Object.keys(validators).forEach((id) => { ok = show(id, validators[id]($(id).value)) && ok; });
  ok = show("terms", $("terms").checked ? "" : "Agree to the terms to create your account.") && ok;
  if (!ok) return form.querySelector(".is-invalid input, #terms:not(:checked)")?.focus();

  // TODO: replace with a real request to your backend.
  console.log("Register", {
    firstName: $("firstName").value.trim(), lastName: $("lastName").value.trim(),
    email: $("email").value.trim(), birthdate: $("birthdate").value,
    username: $("username").value.trim(), notify: $("notify").checked,
  });
  window.location.href = "login.html";
});
