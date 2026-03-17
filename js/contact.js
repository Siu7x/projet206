const form = document.getElementById('form');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    formData.append("access_key", "82d3062d-ce69-43b0-bf91-a0202d378032");

    const originalText = submitBtn.textContent;

    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert("Success! Your message has been sent.");
            form.reset();
        } else {
            alert("Error: " + data.message);
        }

    } catch (error) {
        alert("Something went wrong. Please try again.");
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// --- animation and scroll effects (inspired by index.js) ---
document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // Fade in main heading immediately
    gsap.from("main h1", {
        opacity: 0,
        y: 20,
        duration: 1,
        ease: "power2.out"
    });

    // Cards reveal on scroll
    gsap.from(".card", {
        opacity: 0,
        y: 30,
        stagger: 0.2,
        scrollTrigger: {
            trigger: ".card",
            start: "top 85%",
            end: "bottom 60%",
            scrub: false
        }
    });
});