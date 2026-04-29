
const mask = document.querySelector('.visible-mask');
const name = document.getElementById('hero-name');

document.addEventListener('mousemove', (e) => {
    // Désactiver l'effet de masque "souris" sur mobile pour éviter les bugs
    if (window.innerWidth <= 768) return;

    const x = e.clientX;
    const y = e.clientY;

    if (mask) {
        const maskStyle = `radial-gradient(circle 750px at ${x}px ${y}px, transparent 0%, black 20%)`;
        
        mask.style.webkitMaskImage = maskStyle;
        mask.style.maskImage = maskStyle;
    }
});

// Parallaxe simple
window.addEventListener('scroll', () => {
    if (name) {
        name.style.transform = `translateY(${window.scrollY * -0.4}px)`;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Découpage du texte en mots
    const descText = new SplitType('.description', { types: 'words' });

    // 2. Animation de révélation
    gsap.fromTo(descText.words, 
        {
            color: "#1a1a1a", // Couleur de départ (sombre)
        },
        {
            color: "#ffffff", // Couleur d'arrivée (blanc éclatant)
            stagger: 0.1,
            scrollTrigger: {
                trigger: ".description",
                start: "top 60%", // L'animation commence quand le texte est à 70% du bas
                end: "top 40%",   // Elle se termine quand il est presque en haut
                scrub: true,      // Suit le mouvement du scroll
                markers: false
            }
        }
    );
});
