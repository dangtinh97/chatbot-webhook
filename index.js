'use strict';
require('dotenv').config()
const fs = require('fs')
// Imports dependencies and set up http server
const fetch = require('node-fetch');
const
    http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'), // creates express http server
    app = express();
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
let server = http.createServer(app)


// Sets server port and logs message on success
server.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));

app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "Thispageisusedtotesttheproperoperation"

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
    res.send("NOT INFO")
});

app.post('/webhook', (req, res) => {

    let body = req.body;
    try{
        fs.writeFile('test.txt', JSON.stringify(body), err => {
            if (err) {
                console.error(err)
                return
            }
            //file written successfully
        })
        fetch('https://api.nguoila.online/api/log-webhook',{
            method:"POST",
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        }).then(function (res){

        })
    }catch (e){
        console.log(e)
    }
    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});
