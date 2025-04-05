    const iframe = document.querySelector('iframe');
    const fullscreenBtn = document.getElementById('fullscreen-button');

    function goFullscreen() {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.mozRequestFullScreen) { // Firefox
            iframe.mozRequestFullScreen();
        } else if (iframe.webkitRequestFullscreen) { // Chrome, Safari, Opera
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) { // IE/Edge
            iframe.msRequestFullscreen();
        } else {
            alert("Fullscreen is not supported by this browser.");
        }
    }

    fullscreenBtn.addEventListener('click', function() {
        goFullscreen();
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'f' || event.key === 'F') {
            goFullscreen();
        }
    });
document.addEventListener('keydown', function(event) {
    if (event.key === '[') {
        window.location.href = '../index.html';
    }
});

