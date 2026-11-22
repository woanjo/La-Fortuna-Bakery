const idInput = document.getElementById("identifier");
const pwInput = document.getElementById("password");
const toggle = document.getElementById("togglePw");

// Show / hide password
toggle.addEventListener("click", () => {
  const show = pwInput.type === "password";
  pwInput.type = show ? "text" : "password";
  toggle.setAttribute("aria-pressed", String(show));
  toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
});

function setError(input, errorId, message) {
  document.getElementById(errorId).textContent = message;
  input.closest(".field__box").classList.toggle("is-invalid", Boolean(message));
  return !message;
}

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("formError").textContent = "";
  const idOk = setError(idInput, "identifierError", idInput.value.trim() ? "" : "Enter your email address or username.");
  const pwOk = setError(pwInput, "passwordError", pwInput.value ? "" : "Enter your password.");
  if (!idOk || !pwOk) return;

  // TODO: replace with a real request to your backend.
  console.log("Sign-in", { identifier: idInput.value.trim(), remember: document.getElementById("remember").checked });
  window.location.href = "index.html";
});

[idInput, pwInput].forEach((el) => el.addEventListener("input", () => setError(el, el.id + "Error", "")));
document.getElementById("forgot").addEventListener("click", (e) => {
  e.preventDefault();
  alert("Password reset isn't connected yet.");
});
