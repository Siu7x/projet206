document.addEventListener('DOMContentLoaded', () => {
    const burger = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.site-links');

    if (burger && navLinks) {
        // Fonction dédiée pour basculer l'état du menu
        const toggleMenu = () => {
            const isActive = burger.classList.contains('is-active');
            
            burger.classList.toggle('is-active');
            navLinks.classList.toggle('is-active');
            
            // Accessibilité : informer les lecteurs d'écran de l'état du menu
            burger.setAttribute('aria-expanded', !isActive);

            // Empêche le scroll du body quand le menu est ouvert
            if (!isActive) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };

        // Ouverture au clic
        burger.addEventListener('click', toggleMenu);

        // Support du clavier (Entrée ou Espace)
        burger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
            }
        });

        // Optionnel : Ferme le menu si on clique sur un lien
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('is-active');
                navLinks.classList.remove('is-active');
                burger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Effet Grain lié à la souris sur ordinateur ---
    const grain = document.querySelector('.grain-overlay');
    let mouseTimer;
    
    if (grain) {
        // Sur ordinateur, on met l'animation en pause par défaut
        if (window.innerWidth > 768) {
            grain.style.animationPlayState = 'paused';
        }
        
        document.addEventListener('mousemove', () => {
            if (window.innerWidth <= 768) return; // Reste actif tout le temps sur mobile
            
            grain.style.animationPlayState = 'running';
            clearTimeout(mouseTimer);
            mouseTimer = setTimeout(() => {
                grain.style.animationPlayState = 'paused';
            }, 120); // Se remet en pause 120ms après l'arrêt de la souris
        });
    }
});