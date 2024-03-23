$(() => {
    var socket = io();

    // listen for initial messages from the server
    socket.on('initialMessages', (messages) => {
        messages.forEach(addMessages);
    });

    // listen for new messages from the server
    socket.on('message', addMessages);

    // Get initial messages when the page loads
    getMessages();

    // Send a new message when the form is submitted
    $("form").submit(() => {
        sendMessage({
            name: $("#name").val(),
            message: $("#message").val(),
        });
        return false; // prevent form submission
    });

    // Function to get initial messages
    function getMessages() {
        // Use jQuery to get initial messages
        $.get('http://localhost:3000/messages/data', (data) => {
            data.forEach(addMessages);
        });
    }

    // Function to send a new message
    function sendMessage(message) {
        // Use jQuery to post messages to the server
        $.post('http://localhost:3000/messages', message, (data) => {
            console.log("Message sent successfully:", data);
        });
    }

    // Function to add messages to the UI
    function addMessages(message) {
        $("#messages").append(`
            <h4>${message.name}</h4>
            <p>${message.message}</p>
        `);
    }
});
