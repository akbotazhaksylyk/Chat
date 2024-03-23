//require Express and create a reference to a variable from an instance of Express
var express = require('express');
var app = express();

//require mongoose
var mongoose = require('mongoose');

//the URL of database
var dbUrl = 'mongodb://localhost:27017';

//message model
var Message = mongoose.model('Message', { name: String, message: String })

//listening to a port
var server = app.listen(3000, () => {
    console.log("server is running on port", server.address().port);
});

mongoose.connect(dbUrl)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

// Express routes for different functionalities

// Route 1: / should respond with a plain text message "hi".
app.get('/', (req, res) => {
    res.send('hi');
});

// Route 2: /json should respond with a JSON object containing a text property set to "hi" and a numbers property set to an array [1, 2, 3].
app.get('/json', (req, res) => {
    res.json({ text: 'hi', numbers: [1, 2, 3] });
});

// Route 3: /echo should echo back the input query parameter in various formats (normal, shouty, character count, and backwards).
app.get('/echo', (req, res) => {
    const input = req.query.input || '';
    res.json({
        normal: input,
        shouty: input.toUpperCase(),
        characterCount: input.length,
        backwards: input.split('').reverse().join('')
    });
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// Route 5: /chat should emit a 'message' event with the message from the query parameter.
app.get('/chat', (req, res) => {
    const message = req.query.message || '';
    io.emit('message', message); // Assuming io is accessible in this scope
    res.send('Message sent: ' + message);
});

// Route 6: /sse should establish a Server-Sent Events (SSE) connection and send messages in real-time to the client.
app.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    setInterval(() => {
        res.write(`data: ${new Date().toLocaleTimeString()}\n\n`);
    }, 1000);

    // Close the connection after 5 seconds for demonstration purposes
    setTimeout(() => {
        res.end();
    }, 5000);
});

// Set up a route to serve chat.html when accessing http://localhost:3000/messages
app.get('/messages', (req, res) => {
    console.log("Request to /messages received");
    res.sendFile(__dirname + '/chat.html');
});

// get: will get all the messages from the database
app.get('/messages/data', async (req, res) => {
    try {
        const messages = await Message.find({});
        console.log("Messages sent to /messages/data:", messages);
        res.send(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Internal Server Error');
    }
});

// post : will post new messages created by the user to the database
// post: will post new messages created by the user to the database
app.post('/messages', async (req, res) => {
    const message = new Message(req.body);
    try {
        await message.save();
        io.emit('message', req.body); // Broadcast the message to all clients
        console.log("Message saved to the database:", req.body);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).send('Internal Server Error');
    }
});

var http = require('http').Server(app);
var io = require('socket.io')(http);

// create a connection
io.on('connection', (socket) => {
    console.log('a user is connected');

    // send existing messages to the connected client when requested
    socket.on('getInitialMessages', () => {
        Message.find({}, (err, messages) => {
            if (err) {
                console.error('Error fetching initial messages:', err);
                return;
            }
            socket.emit('initialMessages', messages);
        });
    });

    // listen for new messages from clients and broadcast to all connected clients
    socket.on('sendMessage', (msg) => {
        const message = new Message(msg);
        message.save((err) => {
            if (err) {
                console.error('Error saving message:', err);
                return;
            }
            io.emit('message', msg);
        });
    });
});

http.listen(3001, () => {
    console.log('server is running on port', server.address().port);
});