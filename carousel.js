document.addEventListener("DOMContentLoaded", function() {
    let currentIndex = 0;
    const images = document.querySelectorAll('.carousel img');
    const totalImages = images.length;

    function showImage(index) {
        images.forEach((img, i) => {
            img.classList.remove('active');
            if (i === index) {
                img.classList.add('active');
            }
        });
    }

    function nextPhoto() {
        currentIndex = (currentIndex + 1) % totalImages;
        showImage(currentIndex);
    }

    showImage(currentIndex);
    setInterval(nextPhoto, 3000); // Avança a cada 3 segundos
});