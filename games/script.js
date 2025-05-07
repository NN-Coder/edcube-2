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


let iframeExpanded = false;
        
        document.addEventListener('keydown', function (event) {
            if (event.key.toLowerCase() === 't') {
                const iframe = document.querySelector('iframe');
        
                if (!iframeExpanded) {
                    iframe.style.position = 'fixed';
                    iframe.style.top = '0';
                    iframe.style.left = '0';
                    iframe.style.width = '100vw';
                    iframe.style.height = '100vh';
                    iframe.style.zIndex = '9999';
                    iframe.style.border = 'none';
                    document.body.style.overflow = 'hidden';
                    iframeExpanded = true;
                } else {
                    iframe.style.position = '';
                    iframe.style.top = '';
                    iframe.style.left = '';
                    iframe.style.width = '';
                    iframe.style.height = '';
                    iframe.style.zIndex = '';
                    iframe.style.border = '';
                    document.body.style.overflow = 'auto';
                    iframeExpanded = false;
                }
            }
        });

