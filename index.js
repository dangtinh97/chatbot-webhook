'use strict';
require('dotenv').config()
const fs = require('fs')
// Imports dependencies and set up http server
const fetch = require('node-fetch');
var qs = require('qs');
const
    http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'), // creates express http server
    app = express();
app.use(bodyParser.urlencoded({extended: false}))

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
    try {
        fetch('https://api.nguoila.online/api/log-webhook', {
            method: "POST",
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        }).then(function (res) {

        })
    } catch (e) {
        console.log(e)
    }

    return res.status(200).send('EVENT_RECEIVED');
    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            replyMessage(webhook_event);
            console.log(webhook_event);
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});

app.get("/test",function (req,res){
    replyMessage({
        sender:{
            id:"1343954529053153"
        },
        message:{
            text:"#help"
        }
    }).then(async function (resp){
        let json = await resp.json()
        return res.json(json)
    })

})

app.get('/translator',function (req,res){
    let q = req.query.q;
    console.log(q)
    translator(q).then(function (res){
        console.log(res)
    })
    return res.json()
})


async function replyMessage(event) {
    let from = event.sender.id;
    let message = event.message.text.trim();

    let reply = "";
    switch (message) {
        case "#help":
            reply = 'Help haui chatbot\n' +
                '#schedule: View timetable\n' +
                '#cat: See pictures of cats\n' +
                '#now : View time now\n' +
                '#trans: Translator english to vietnam  (ex: #trans: Hello)\n' +
                '=a+b-c math with +/- (ex: =1-2+3)'
            break
        case '#cat':
            reply = 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg'
            break
        case '#now':
            reply = 'now: '+(new Date()).toString()
            break
        default:
            reply = 'type #help to see instructions'
            break;
    }

    if(message.indexOf('#trans:')!==-1){
        let q = message.replace('#trans:','').trim()
        if(q!=="") reply = q+" => "+await translator(q)
    }

    if(message.indexOf('#schedule')!==-1)
    {
        let code = message.replace('#schedule:','').trim()
        if(code !== "") reply = schedule(code)
    }

    if(message.indexOf('=')===0){
        let code = message.replace('=','').trim()
        if(code !== "") reply = code+"="+addbits(code)
    }


    return new Promise((resolve)=>{
        fetch('https://graph.facebook.com/v13.0/me/messages?access_token='+Buffer.from(process.env.TOKEN_PAGE,'base64'),{
            method:"POST",
            body:JSON.stringify({
                "messaging_type": "UPDATE",
                "recipient":{
                    "id":from
                },
                "message":{
                    "text":reply
                }
            }),
            headers: {'Content-Type': 'application/json'}
        }).then(function (e){
            return resolve(e)
            console.log(e,"then")
        }).catch(function (e){
            return resolve(e)
        })
    })

}

async function  translator(q)
{
    let request =await fetch('https://google-translate1.p.rapidapi.com/language/translate/v2',{
        method:"POST",
        body:qs.stringify({
            q:q,
            target:"vi",
            source:"en"
        }),
        headers:{
            'content-type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'application/gzip',
            'X-RapidAPI-Host': 'google-translate1.p.rapidapi.com',
            'X-RapidAPI-Key': '1a5db61212msh77580bc7a892427p1549f6jsn8908d135911a'
        }
    })
    try{
        let result= await request.json()
        return result.data.translations[0].translatedText
    }catch (e){
        return 'no find word';
    }

}

function schedule(code)
{
    let list = ['math','music','history','chemistry','physics','Information Technology'];
    let data = {
        '1041040272':list,
        '1041040273':shuffle(list),
        '1041040274':shuffle(list),
        '1041040275':shuffle(list),
        '1041040276':shuffle(list),
        '1041040277':shuffle(list),
    }

    if(typeof data[code]==="undefined") return "Không có dữ liệu."

    return data[code].join(' - ')


}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

function addbits(s) {
    var total = 0;

    s = s.match(/[+\-]*(\.\d+|\d+(\.\d+)?)/g) || [];

    while (s.length) {
        total += parseFloat(s.shift());
    }
    return total;
}


