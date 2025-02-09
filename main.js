document.addEventListener('DOMContentLoaded', function() {
    // Initialize the chess board
    initializeChessBoard();

    // Add smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add animation classes on scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeIn');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach((section) => {
        observer.observe(section);
    });

    // Initialize game controls
    document.getElementById('newGame').addEventListener('click', startNewGame);
    document.getElementById('undo').addEventListener('click', undoMove);
});
