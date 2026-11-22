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
