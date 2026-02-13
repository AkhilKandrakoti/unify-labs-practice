// Button Interaction
document.getElementById("ctaBtn").addEventListener("click", function() {
    alert("Welcome Akhil 🚀 Let's build something amazing!");
});

// Navbar scroll effect
window.addEventListener("scroll", function() {
    const nav = document.querySelector("nav");
    if (window.scrollY > 50) {
        nav.style.background = "rgba(0,0,0,0.6)";
    } else {
        nav.style.background = "rgba(255,255,255,0.05)";
    }
});