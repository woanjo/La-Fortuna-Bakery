// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Keep the layout intact if the photo isn't in /images yet
document.querySelectorAll(".about__photo img").forEach((img) => {
  img.addEventListener("error", () => { img.removeAttribute("src"); img.style.minHeight = "320px"; });
});
