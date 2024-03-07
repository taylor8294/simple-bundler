// Util functions

async function waitForCondition(condition, timeout = 5000, pollingInterval = 100) {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        const poll = async () => {
            if (condition()) {
                return resolve(true);
            }
            if (Date.now() - startTime >= timeout) {
                return reject(timeout+'ms timeout exceeded');
            }
            setTimeout(poll, pollingInterval);
        };
        poll();
    });
}

function normalizePath(path) {
    // Remove trailing slashes and 'index.html' if present
    return path.replace(/\/index\.html$/, '/').replace(/^\/public?/, '').toLowerCase();
}

function getBasename(path) {
    return normalizePath(path).split('/').pop();
}

function isFileInPage(filePath) {
    // Check if the file path is included in any of the elements
    const elements = document.querySelectorAll('link[href], img[src], script[src]');
    for (let i = 0; i < elements.length; i++) {
        const elementPath = elements[i].getAttribute('href') || elements[i].getAttribute('src');
        if (getBasename(elementPath) === getBasename(filePath)) {
            return true;
        }
    }
    // If the file is not found
    return false;
}

// Check if the browser supports Service Workers
if (false){ //'serviceWorker' in navigator) {

    // Register the Service Worker
    navigator.serviceWorker.register('/ws-service-worker.js')
        .then(registration => {
            console.log('Service Worker registered:', registration);

            // Listen for messages from the Service Worker
            navigator.serviceWorker.addEventListener('message', event => {
                console.log('Received from Service Worker:', event);
                if (event.data.type === 'reload') {
                    if(normalizePath(window.location.pathname) === normalizePath(event.data.file) || isFileInPage(event.data.file))
                        window.location.reload();
                }
            });

            // Wait for controller
            return waitForCondition(() => navigator.serviceWorker.controller)
        })
        .then(()=>{
            // Send connect message
            navigator.serviceWorker.controller.postMessage({ type: 'connect', url: `ws://${window.location.host}/reload` });
            console.log('Sent connect message')
        })
        .catch(error => {
            console.error('Service Worker registration failed:', error);
            window.location.reload();
        });
} else {
    const socket = new WebSocket(`ws://${window.location.host}/reload`);
    socket.addEventListener('message', function (event) {
        console.log('Received from websocket',event);
        window.location.reload();
    });
}