'use strict';

const session = require('express-session');
const express = require('express');
const http = require('http');
const uuid = require('uuid');
const bodyParser = require('body-parser');

const { WebSocketServer, WebSocket } = require('ws');

function onSocketError(err) {
    console.error(err);
}

const app = express();
const userIdToName = new Map();

//
// We need the same instance of the session parser in express and
// WebSocket server.
//
const sessionParser = session({
    saveUninitialized: false,
    secret: 'T0P$eCuRiTy',
    resave: false
});

//
// Serve static files from the 'public' folder.
//
app.use(express.static('public'));
app.use(sessionParser);
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.get('/session', function (req, res) {
    initializeSession(req);
    //console.log(req.session);
    const name = userIdToName.get(req.session.userId);
    res.send({ name: name, userId: req.session.userId });
});

function initializeSession(req) {
    if (!req.session.userId) {
        //
        // "Log in" user and set userId to session.
        //
        const id = uuid.v4();

        console.log(`Initialize session ${id}`);
        req.session.userId = id;
    }
}

app.post('/name', function (req, res) {

    initializeSession(req);
    const prevName = userIdToName.get(req.session.userId);
    userIdToName.set(req.session.userId, req.body.name);
    console.log(`${req.session.userId}: name change from ${prevName} to ${req.body.name}`);

    res.send({ result: 'OK', message: 'Name updated to ' + req.body.name });
});

app.delete('/logout', function (request, response) {
    const ws = map.get(request.session.userId);

    console.log('Destroying session');
    request.session.destroy(function () {
        if (ws) ws.close();

        response.send({ result: 'OK', message: 'Session destroyed' });
    });
});

//
// Create an HTTP server.
//
const server = http.createServer(app);

//
// Create a WebSocket server completely detached from the HTTP server.
//
const wss = new WebSocketServer({ clientTracking: true, noServer: true });

server.on('upgrade', function (request, socket, head) {
    socket.on('error', onSocketError);

    console.log('Parsing session from request...');

    sessionParser(request, {}, () => {
        if (!request.session.userId) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        console.log('Session is parsed!');

        socket.removeListener('error', onSocketError);

        wss.handleUpgrade(request, socket, head, function (ws) {
            wss.emit('connection', ws, request);
        });
    });
});

wss.on('connection', function (ws, request) {
    const userId = request.session.userId;

    ws.on('error', console.error);

    ws.on('message', function (message) {
        try {
            const obj = JSON.parse(message);

            if (obj.action = 'btn') {
                const name = userIdToName.get(userId);
                console.log(`Received button press ${obj.button} from ${userId} / ${name}`);
                const response = JSON.stringify({action: 'btn', button: obj.button, name: name});
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(response);
                    }
                });
            }
        } catch (e) {
            console.error(`${userId} sent bad message ${message}`, e);
        }

    });

    ws.on('close', function () {
        map.delete(userId);
    });
});

//
// Start the server.
//
server.listen(8080, function () {
    console.log('Listening on http://localhost:8080');
});
