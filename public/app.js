(function () {
    const messages = document.querySelector('#messages');
    const wsButton = document.querySelector('#wsButton');
    const logout = document.querySelector('#logout');
    const login = document.querySelector('#login');
    const load = document.querySelector('#load');
    const name = document.querySelector('#name');
    const txtInput = document.querySelector('#txtInput');

    function setName() {
        console.log('set name to ' + name.value);
        return fetch('/name', {
            method: 'POST', credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'name': name.value
            })
        })
            .then((response) => response.json())
            .catch(function (err) {
                showMessage(err.message);
            });

    }

    name.addEventListener('keydown', (event) => {
        if (event.keyCode === 13 /* enter */) {
            name.blur();
        }
    });

    txtInput.addEventListener('keydown', (event) => {
        if (event.keyCode === 13 /* enter */) {
            if (ws) {
                ws.send(JSON.stringify({ action: 'msg', message: txtInput.value }));
                txtInput.value = "";
            } else {
                showMessage('Not connected');
            }
        }
    })

    function fetchSession() {
        fetch('/name', { method: 'GET', credentials: 'same-origin' })
            .then((response) => response.json())
            .then((json) => {
                //console.log(json);
                if (json.name) {
                    name.value = json.name;
                }
            })
            .catch(function (err) {
                showMessage(err.message);
            });
    }
    fetchSession();


    function showMessage(message) {
        messages.textContent += `\n${message}`;
        messages.scrollTop = messages.scrollHeight;
    }
    messages.textContent = 'Enter a name and click Connect.';

    // function handleResponse(response) {
    //     return response.ok
    //         ? response.json().then((data) => JSON.stringify(data, null, 2))
    //         : Promise.reject(new Error('Unexpected response'));
    // }

    // logout.onclick = function () {
    //     fetch('/logout', { method: 'DELETE', credentials: 'same-origin' })
    //         .then(handleResponse)
    //         .then(showMessage)
    //         .catch(function (err) {
    //             showMessage(err.message);
    //         });
    // };

    let ws;

    wsButton.onclick = function () {
        name.disabled = true;
        wsButton.disabled = true;
        setName()
            .then((res) => {
                if (res.result === 'OK') {
                    showMessage('Updated name, connecting...');
                    openWebsocket();
                } else {
                    showMessage('Failed to set name');
                    name.disabled = false;
                    wsButton.disabled = false;
                }
            })
            .catch(function (err) {
                name.disabled = false;
                wsButton.disabled = false;
                showMessage(err.message);
            });
    };
    function openWebsocket() {
        if (ws) {
            ws.onerror = ws.onopen = ws.onclose = null;
            ws.close();
        }

        ws = new WebSocket(`ws://${location.host}`);
        ws.onerror = function () {
            showMessage('WebSocket error');
            name.disabled = false;
            wsButton.disabled = false;
        };
        ws.onopen = function () {
            showMessage('WebSocket connected');
        };
        ws.onclose = function () {
            showMessage('WebSocket closed');
            ws = null;
            name.disabled = false;
            wsButton.disabled = false;
        };
        ws.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);
                if (data.action === 'btn') {
                    const name = data.name || 'Anonymous';
                    showMessage(`${name} pressed ${data.button}`);
                } else if (data.action === 'trbot') {
                    showMessage(data.message);
                } else if (data.action === 'message') {
                    showMessage(`${data.name}: ${data.message}`);
                } else if (data.action === 'join') {
                    showMessage(`${data.name} joined`);
                } else if (data.action === 'leave') {
                    showMessage(`${data.name} left`);
                }
            } catch (e) {
                console.error('Caught exception onmessage', e);
            }
        }
    };

    const buttons = ['left', 'up', 'right', 'down', 'a', 'b', 'start', 'select'];
    for (const buttonName of buttons) {
        const elem = document.getElementById(buttonName);
        elem.addEventListener('click', (event) => {
            event.preventDefault();
            if (ws) {
                ws.send(JSON.stringify({ action: 'btn', button: buttonName }));
            }
        });
    }

    const keyToButton = {
        87: 'up',
        65: 'left',
        83: 'down',
        68: 'right',
        80: 'a',
        76: 'b',
        78: 'start',
        66: 'select'
    };
    
    document.body.addEventListener('keydown', (event) => {
        if (event.repeat) return;
        const button = keyToButton[event.keyCode];
        if (button) {
            ws.send(JSON.stringify({ action: 'btn', button: button }));
        }
    })
})();
