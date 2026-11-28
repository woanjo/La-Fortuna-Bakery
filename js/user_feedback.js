document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:5000";
  const form = document.getElementById("feedbackForm");
  const submitButton = document.getElementById("feedbackSubmit");
  const errorBox = document.getElementById("feedbackError");
  const messageInput = document.getElementById("feedbackMessage");
  const messageCount = document.getElementById("messageCount");
  const formView = document.getElementById("feedbackFormView");
  const successView = document.getElementById("feedbackSuccess");
  const successText = document.getElementById("feedbackSuccessText");
  const sendAnotherButton = document.getElementById("sendAnotherFeedback");

  document.getElementById("feedbackYear").textContent = new Date().getFullYear();

  messageInput.addEventListener("input", () => {
    messageCount.textContent = messageInput.value.length;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    errorBox.textContent = "";

    if (!form.reportValidity()) return;

    const payload = {
      name: document.getElementById("feedbackName").value.trim(),
      email: document.getElementById("feedbackEmail").value.trim(),
      category: document.getElementById("feedbackCategory").value,
      subject: document.getElementById("feedbackSubject").value.trim(),
      message: messageInput.value.trim(),
      website: document.getElementById("feedbackWebsite").value
    };

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Your message could not be sent.");
      }

      successText.textContent = `${result.message} Your reference number is #${result.submission.id}.`;
      formView.hidden = true;
      successView.hidden = false;
      successView.querySelector("button").focus();

    } catch (error) {
      errorBox.textContent = error.message || "Unable to connect to the bakery server. Please try again.";
      errorBox.hidden = false;

    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Send Message <span aria-hidden="true">→</span>';
    }
  });

  sendAnotherButton.addEventListener("click", () => {
    form.reset();
    messageCount.textContent = "0";
    errorBox.hidden = true;
    successView.hidden = true;
    formView.hidden = false;
    document.getElementById("feedbackName").focus();
  });
});
