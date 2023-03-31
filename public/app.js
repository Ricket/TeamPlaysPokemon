(function () {
    const messages = document.querySelector('#messages');
    const wsButton = document.querySelector('#wsButton');
    const wsSendButton = document.querySelector('#wsSendButton');
    const logout = document.querySelector('#logout');
    const login = document.querySelector('#login');
    const load = document.querySelector('#load');
    const name = document.querySelector('#name');

    name.addEventListener('change', (event) => {
        console.log('change name to ' + name.value);
        fetch('/name', {
            method: 'POST', credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'name': name.value
            })
        }).then((response) => response.json())
            .then((json) => console.log(json))
            .catch(function (err) {
                showMessage(err.message);
            });

    });
    name.addEventListener('keydown', (event) => {
        if (event.keyCode === 13 /* enter */) {
            name.blur();
        }
    });

    function fetchSession() {
        fetch('/session', { method: 'GET', credentials: 'same-origin' })
            .then((response) => response.json())
            .then((json) => console.log(json))
            .catch(function (err) {
                showMessage(err.message);
            });
    }
    fetchSession();
    load.onclick = function () { fetchSession(); };


    function showMessage(message) {
        messages.textContent += `\n${message}`;
        messages.scrollTop = messages.scrollHeight;
    }

    function handleResponse(response) {
        return response.ok
            ? response.json().then((data) => JSON.stringify(data, null, 2))
            : Promise.reject(new Error('Unexpected response'));
    }

    login.onclick = function () {
        fetch('/login', { method: 'POST', credentials: 'same-origin' })
            .then(handleResponse)
            .then(showMessage)
            .catch(function (err) {
                showMessage(err.message);
            });
    };

    logout.onclick = function () {
        fetch('/logout', { method: 'DELETE', credentials: 'same-origin' })
            .then(handleResponse)
            .then(showMessage)
            .catch(function (err) {
                showMessage(err.message);
            });
    };

    let ws;

    wsButton.onclick = function () {
        if (ws) {
            ws.onerror = ws.onopen = ws.onclose = null;
            ws.close();
        }

        ws = new WebSocket(`ws://${location.host}`);
        ws.onerror = function () {
            showMessage('WebSocket error');
        };
        ws.onopen = function () {
            showMessage('WebSocket connection established');
        };
        ws.onclose = function () {
            showMessage('WebSocket connection closed');
            ws = null;
        };
        ws.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);
                if (data.action === 'btn') {
                    const name = data.name || 'Anonymous';
                    showMessage(`${name} pressed ${data.button}`);
                }
            } catch (e) {
                console.error('Caught exception onmessage', e);
            }
        }
    };

    wsSendButton.onclick = function () {
        if (!ws) {
            showMessage('No WebSocket connection');
            return;
        }

        ws.send('Hello World!');
        showMessage('Sent "Hello World!"');
    };

    const buttons = ['left', 'up', 'right', 'down', 'a', 'b', 'start', 'select'];
    for (const buttonName of buttons) {
        const elem = document.getElementById(buttonName);
        elem.addEventListener('click', (event) => {
            event.preventDefault();
            if (ws) {
                ws.send(JSON.stringify({action: 'btn', button: buttonName}));
            }
        });
    }
})();
