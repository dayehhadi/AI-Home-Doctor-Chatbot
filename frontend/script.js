// script.js

// Configuration
const API_CHAT_URL = "http://127.0.0.1:5000/chat"; // Ensure Flask server is running

// Elements
const chatDisplay = document.getElementById('chatDisplay');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Language Toggle Elements
const languageToggle = document.getElementById('languageToggle');
const languageLabel = document.getElementById('languageLabel');
let currentLanguage = 'En'; // Default language is English

// Sidebar toggle elements
const sidebarToggle = document.getElementById('sidebarToggle'); // Button to open sidebar
const closeSidebarButton = document.getElementById('closeSidebar'); // Button to close sidebar
const sidebar = document.getElementById('sidebar');

// File input and attach button elements
const attachButton = document.getElementById('attachButton');
const fileInput = document.getElementById('fileInput');

// Image Name Display Elements
const imageNameBox = document.getElementById('imageNameBox');
const imageNameSpan = document.getElementById('imageName');
const removeImageButton = document.getElementById('removeImageButton');

// Variable for the "Diagnosing..." animation
let diagnosingInterval;

// Variable to store the attached file
let attachedFile = null;
let attachedFileDataURL = null; // Variable to store the Data URL of the attached image

// Variables to store current bot name and icon
let currentBotName = "Nurse";
let currentBotIcon = 'images/nurse_icon.png';


// Recording Variables
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let audioStream;
let audioContext;
let analyser;
let dataArray;
let animationId;

// Elements for audio recording
const recordButton = document.getElementById('recordButton'); // Microphone button
const audioRecordingContainer = document.getElementById('audioRecordingContainer');
const startRecordingButton = document.getElementById('startRecordingButton');
const stopRecordingButton = document.getElementById('stopRecordingButton');
const sendAudioButton = document.getElementById('sendAudioButton');
const cancelAudioButton = document.getElementById('cancelAudioButton');
const waveformCanvas = document.getElementById('waveformCanvas');
// Elements
const resetButton = document.getElementById('resetButton');

// Initial Chat State
let messages = [
    { role: "bot", content: "Hello! How can I assist you today?"+"\n"+" مرحبًا! كيف يمكنني مساعدتك اليوم؟", bot_name: currentBotName, bot_icon: currentBotIcon }
];

// Function to sanitize user input to prevent XSS
function sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Added function to format markdown bold text
function formatMarkdown(str) {
    return str.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
}

// Function to render messages
function renderMessages() {
    chatDisplay.innerHTML = ''; // Clear current messages
    messages.forEach((message, index) => {
        if (message.role === "user") {
            // User Message
            const userContainer = document.createElement('div');
            userContainer.className = 'chat-container user-chat-container';
            userContainer.id = `message-${index}`; // Assign an ID

            const chatContent = document.createElement('div');
            chatContent.className = 'chat-content user-bubble chat-bubble';

            let messageContent = "";

            if (message.content && message.content.trim() !== "") {
                messageContent += `<span class="sender-label">You:</span> <span class="message-text">${formatMarkdown(sanitize(message.content))}</span>`;
            }

            if (message.imageData) {
                messageContent += `<br><img src="${message.imageData}" alt="Attached Image" class="image-attachment">`;
            }

            if (message.audioData) {
                messageContent += `<br><audio controls src="${message.audioData}"></audio>`;
            }
            chatContent.innerHTML = messageContent;

            const userIcon = document.createElement('img');
            userIcon.src = 'images/user.png'; // Ensure this image exists
            userIcon.alt = 'User';
            userIcon.className = 'message-icon';

            userContainer.appendChild(chatContent);
            userContainer.appendChild(userIcon);
            chatDisplay.appendChild(userContainer);
        } else {
            // Bot Message
            const botContainer = document.createElement('div');
            botContainer.className = 'chat-container bot-chat-container';
            botContainer.id = `message-${index}`; // Assign an ID

            if (message.isDiagnosing) {
                botContainer.setAttribute('data-is-diagnosing', 'true');
            }

            const botIcon = document.createElement('img');
            botIcon.src = message.bot_icon || 'images/nurse_icon.png';
            botIcon.alt = 'Bot';
            botIcon.className = 'message-icon';

            const chatContent = document.createElement('div');
            chatContent.className = 'chat-content bot-bubble chat-bubble';

            const botName = message.bot_name || 'Doctor';
            currentBotName =botName
            currentBotIcon = botIcon.src
            chatContent.innerHTML = `<span class="sender-label">${sanitize(botName)}:</span> <span class="message-text">${formatMarkdown(sanitize(message.content)).replace(/\n/g, '<br>')}</span>`;

            botContainer.appendChild(botIcon);
            botContainer.appendChild(chatContent);
            chatDisplay.appendChild(botContainer);
        }
    });

    // Automatically scroll to the bottom after rendering messages
    scrollToBottom();
}

function renderDiagnosingMessages() {
    chatDisplay.innerHTML = ''; // Clear current messages
    messages.forEach(message => {
        if (message.role === "user") {
            // User Message
            const userContainer = document.createElement('div');
            userContainer.className = 'chat-container user-chat-container';

            const chatContent = document.createElement('div');
            chatContent.className = 'chat-content user-bubble chat-bubble';

            let messageContent = `<span class="sender-label">You:</span> <span>${formatMarkdown(sanitize(message.content))}</span>`;

            if (message.imageData) {
                messageContent += `<br><img src="${message.imageData}" alt="Attached Image" class="image-attachment">`;
            }

            chatContent.innerHTML = messageContent;

            const userIcon = document.createElement('img');
            userIcon.src = 'images/user.png'; // Ensure this image exists
            userIcon.alt = 'User';
            userIcon.className = 'message-icon';

            userContainer.appendChild(chatContent);
            userContainer.appendChild(userIcon);
            chatDisplay.appendChild(userContainer);  
        } else {
            console.log("Rendering bot message with icon:", message.bot_icon);
            // Bot Message
            const botContainer = document.createElement('div');
            botContainer.className = 'chat-container bot-chat-container';

            const botIcon = document.createElement('img');
            botIcon.src = message.bot_icon || 'images/nurse_icon.png';
            botIcon.alt = 'Bot';
            botIcon.className = 'message-icon';

            const chatContent = document.createElement('div');
            chatContent.className = 'chat-content bot-bubble chat-bubble';

            const botName = message.bot_name || 'Doctor';
            chatContent.innerHTML = `<span class="sender-label">${sanitize(botName)}:</span> <span>${formatMarkdown(sanitize(message.content)).replace(/\n/g, '<br>')}</span>`;

            botContainer.appendChild(botIcon);
            botContainer.appendChild(chatContent);
            chatDisplay.appendChild(botContainer);
        }
    });

    // Automatically scroll to the bottom after rendering messages
    scrollToBottom();
}

// Function to send user message using Fetch API
async function sendMessage() {
    console.log('sendMessage function called'); // Debugging statement

    const userText = userInput.value.trim();
    console.log(`User input: "${userText}"`); // Debugging

    if (userText === "" && !attachedFile && !recordedChunks.length) {
        console.log('No message, file, or audio to send'); // Debugging
        return;
    }
    console.log(userText);
    if (!recordedChunks.length){
    // Append user message to chat display
    messages.push({ role: "user", content: userText, imageData: attachedFileDataURL });
    renderMessages();
    }
    // Clear input
    userInput.value = "";

    // Hide the image name box since the image is being sent
    hideImageNameBox();

    // Show "Diagnosing..." animation
    showDiagnosingAnimation();

    // Show upload indicator if file is attached
    if (attachedFile) {
        showUploadIndicator(); // This will now include a progress bar
    }

    // Create FormData
    let formData = new FormData();
    formData.append('message', userText);
    formData.append('language', currentLanguage); // Include the selected language

    if (attachedFile) {
        formData.append('image', attachedFile, attachedFile.name); // Include filename
        console.log(`Appending image: ${attachedFile.name}`); // Debugging
    }

    // Debugging: Log FormData contents
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
        if (pair[0] === 'image') {
            console.log(`${pair[0]}: ${pair[1].name}`); // Log image filename
        } else {
            console.log(`${pair[0]}: ${pair[1]}`);
        }
    }

    try {
        const response = await fetch(API_CHAT_URL, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            const gptResponse = data.gpt_response || "No response from the chatbot.";
            const botName = data.bot_name || "Doctor";
            const botIconUrl = data.bot_icon;

            // Stop the "Diagnosing..." animation
            stopDiagnosingAnimation();

            // Remove the "Diagnosing..." message
            messages.pop();
            console.log(currentBotName)
            // Append the actual response
            messages.push({
                role: "bot",
                content: gptResponse,
                bot_name: botName,
                bot_icon: botIconUrl
            });

            renderMessages();
        } else {
            // Handle non-200 responses
            console.error(`Server responded with status ${response.status}`);
            const errorData = await response.json();
            const errorMessage = errorData.error || "An error occurred while processing your request.";
            stopDiagnosingAnimation();
            messages.pop();
            messages.push({
                role: "bot",
                content: `Error: ${errorMessage}`,
                bot_name: currentBotName,
                bot_icon: currentBotIcon
            });
            renderMessages();
        }

        if (attachedFile) {
            hideUploadIndicator();
            attachedFile = null;
            attachedFileDataURL = null;
            fileInput.value = '';
            removeFileAttachedIndicator();
        }

    } catch (error) {
        // Handle network or other errors
        console.error('An error occurred during the transaction:', error);
        stopDiagnosingAnimation();
        messages.pop();
        messages.push({
            role: "bot",
            content: "An error occurred while sending your message. Please try again.",
            bot_name: currentBotName,
            bot_icon: currentBotIcon
        });

        if (attachedFile) {
            hideUploadIndicator();
            attachedFile = null;
            attachedFileDataURL = null;
            fileInput.value = '';
            removeFileAttachedIndicator();
        }

        renderMessages();
    }
}

// Function to start "Diagnosing..." live animation
function showDiagnosingAnimation() {
    let dots = 0;
    console.log(currentBotName)
    const diagnosingMessage = {
        role: "bot",
        content: "Diagnosing...",
        bot_name: currentBotName,
        bot_icon: currentBotIcon,
        isDiagnosing: true
    };
    messages.push(diagnosingMessage);
    const diagnosingMessageIndex = messages.length - 1; // Store the index
    renderMessages(); // Render all messages once

    // Set up an interval to update the "Diagnosing..." message
    diagnosingInterval = setInterval(() => {
        dots = (dots + 1) % 4; // Cycle between 0, 1, 2, 3 dots
        diagnosingMessage.content = "Diagnosing" + ".".repeat(dots);

        // Update the content of the diagnosing message directly
        const diagnosingMessageElement = document.getElementById(`message-${diagnosingMessageIndex}`);
        if (diagnosingMessageElement) {
            const chatContent = diagnosingMessageElement.querySelector('.chat-content .message-text');
            if (chatContent) {
                chatContent.innerHTML = sanitize(diagnosingMessage.content).replace(/\n/g, '<br>');
            }
        }
    }, 500); // Update every half second
}

// Function to stop the "Diagnosing..." animation
function stopDiagnosingAnimation() {
    if (diagnosingInterval) {
        clearInterval(diagnosingInterval); // Stop the interval
        diagnosingInterval = null;
    }
}

// Event listener for send button
sendButton.addEventListener('click', function() {
    console.log('Send button clicked'); // Debugging
    sendMessage();
});

// Event listener for reset button
resetButton.addEventListener('click', function() {
    resetChatbot();
});


// Allow sending message by pressing Enter key
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        console.log('Enter key pressed in input'); // Debugging
        sendMessage();
    }
});

// Event listener for attach button
attachButton.addEventListener('click', function () {
    console.log('Attach button clicked'); // Debugging
    fileInput.click(); // Trigger the file input to open the file explorer
});

// Event listener for language toggle button
languageToggle.addEventListener('click', function() {
    if (currentLanguage === 'En') {
        currentLanguage = 'Ar';
    } else {
        currentLanguage = 'En';
    }
    languageLabel.textContent = currentLanguage;
    console.log(`Language toggled to ${currentLanguage}`); // Debugging

    // Update the lang attribute on the body element
    document.body.setAttribute('lang', currentLanguage === 'Ar' ? 'ar' : 'en');

    // Update text direction based on language
    if (currentLanguage === 'Ar') {
        document.body.style.direction = 'rtl'; // Right-to-left for Arabic
    } else {
        document.body.style.direction = 'ltr'; // Left-to-right for English
    }
});

// Handle file selection
fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
        attachedFile = fileInput.files[0];
        console.log(`File selected: ${attachedFile.name}`); // Debugging
        
        showFileAttachedIndicator(attachedFile.name);

        // Show the image name box with the file name
        showImageNameBox(attachedFile.name);

        // Read the file as a data URL and store it
        const reader = new FileReader();
        reader.onload = function(e) {
            attachedFileDataURL = e.target.result; // Store the data URL
            console.log(`File read as Data URL: ${attachedFileDataURL.substring(0, 30)}...`); // Debugging
        };
        reader.readAsDataURL(attachedFile);
    } else {
        console.log('No file selected'); // Debugging
    }
});

// Show file attached indicator
function showFileAttachedIndicator(filename) {
    attachButton.classList.add('file-attached');
    attachButton.title = `File attached: ${filename}`;
}

// Remove file attached indicator
function removeFileAttachedIndicator() {
    attachButton.classList.remove('file-attached');
    attachButton.title = 'Attach File';
}

// Show image name box
function showImageNameBox(filename) {
    imageNameSpan.textContent = `Attached: ${filename}`;
    imageNameBox.style.display = 'flex';
}

// Hide image name box
function hideImageNameBox() {
    imageNameBox.style.display = 'none';
    imageNameSpan.textContent = '';
    fileInput.value = '';
    removeFileAttachedIndicator();
}
function resetChatbot() {
    // Clear the messages array and reset to initial state
    messages = [
        { role: "bot", content: "Hello! How can I assist you today?"+"\n"+" مرحبًا! كيف يمكنني مساعدتك اليوم؟", bot_name: "Nurse", bot_icon: 'images/nurse_icon.png' }
    ];
    currentBotName = "Nurse";
    currentBotIcon = 'images/nurse_icon.png';
    renderMessages();

    // Send a reset request to the server
    fetch(API_CHAT_URL, {
        method: 'POST',
        body: JSON.stringify({ reset: true }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Chatbot reset:', data.message);
    })
    .catch(error => {
        console.error('Error resetting chatbot:', error);
    });
}


// Show upload indicator
function showUploadIndicator() {
    let uploadIndicator = document.getElementById('uploadIndicator');
    if (!uploadIndicator) {
        uploadIndicator = document.createElement('div');
        uploadIndicator.id = 'uploadIndicator';
        uploadIndicator.className = 'upload-indicator';

        // Create progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.id = 'uploadProgress';
        progressBar.className = 'progress-bar';
        progressBar.textContent = '0%';

        progressContainer.appendChild(progressBar);
        uploadIndicator.appendChild(progressContainer);

        document.body.appendChild(uploadIndicator);
    }
    uploadIndicator.style.display = 'block';
}

// Hide upload indicator
function hideUploadIndicator() {
    let uploadIndicator = document.getElementById('uploadIndicator');
    if (uploadIndicator) {
        uploadIndicator.style.display = 'none';
    }
}

// Function to update the progress bar
function updateProgressBar(percent) {
    const progressBar = document.getElementById('uploadProgress');
    if (progressBar) {
        progressBar.style.width = percent + '%';
        progressBar.textContent = Math.floor(percent) + '%';
    }
}

// Event listener for remove image button
removeImageButton.addEventListener('click', function() {
    console.log('Remove image button clicked'); // Debugging
    hideImageNameBox();
});

// Initial render
renderMessages();

// Function to toggle sidebar and button visibility
function toggleSidebar() {
    sidebar.classList.toggle('closed');
    console.log(`Sidebar toggled. Closed: ${sidebar.classList.contains('closed')}`); // Debugging

    // Show/hide sidebar toggle buttons based on sidebar state
    if (sidebar.classList.contains('closed')) {
        sidebarToggle.style.display = 'block'; // Show open button
        closeSidebarButton.style.display = 'none'; // Hide close button
    } else {
        sidebarToggle.style.display = 'none'; // Hide open button
        closeSidebarButton.style.display = 'block'; // Show close button
    }
}

// Event listeners for open/close sidebar buttons
sidebarToggle.addEventListener('click', toggleSidebar);
closeSidebarButton.addEventListener('click', toggleSidebar);

// Hide the sidebar toggle initially (when sidebar is open)
sidebarToggle.style.display = 'none';

// Scroll the chat to the bottom
function scrollToBottom() {
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// ======= AUDIO RECORDING FUNCTIONALITY =======

// Event listener for record button (Microphone button)
recordButton.addEventListener('click', function () {
    // Show the audio recording container
    audioRecordingContainer.style.display = 'flex';
});

// Event listener for start recording button
startRecordingButton.addEventListener('click', function () {
    startRecording();
});

// Event listener for stop recording button
stopRecordingButton.addEventListener('click', function () {
    stopRecording();
});

// Event listener for send audio button
sendAudioButton.addEventListener('click', function () {
    // Hide the audio recording container
    audioRecordingContainer.style.display = 'none';

    // Send the recorded audio
    if (recordedChunks.length > 0) {
        const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
        sendAudio(audioBlob);
        recordedChunks = [];
    }
});

// Event listener for cancel audio button
cancelAudioButton.addEventListener('click', function () {
    // Hide the audio recording container
    audioRecordingContainer.style.display = 'none';

    // Stop recording if recording is in progress
    if (isRecording) {
        stopRecording();
    }

    // Clear recorded chunks
    recordedChunks = [];
});

// Start Recording Function
function startRecording() {
    console.log('Starting recording...');

    // Check if the browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                audioStream = stream;
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                isRecording = true;
                startRecordingButton.disabled = true;
                stopRecordingButton.disabled = false;
                sendAudioButton.disabled = true;
                console.log('Recording started.');

                recordedChunks = [];

                mediaRecorder.ondataavailable = function (e) {
                    if (e.data.size > 0) {
                        recordedChunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = function () {
                    console.log('Recording stopped.');
                    isRecording = false;
                    startRecordingButton.disabled = false;
                    stopRecordingButton.disabled = true;
                    sendAudioButton.disabled = false;

                    // Stop the waveform visualization
                    cancelAnimationFrame(animationId);
                    audioContext.close();
                };

                // Start waveform visualization
                visualize(stream);
            })
            .catch(function (err) {
                console.error('The following error occurred: ' + err);
            });
    } else {
        console.error('getUserMedia not supported on your browser!');
    }
}

// Stop Recording Function
function stopRecording() {
    console.log('Stopping recording...');
    mediaRecorder.stop();
    audioStream.getTracks().forEach(track => track.stop());
}

// Function to visualize the audio waveform
function visualize(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const bufferLength = analyser.fftSize;
    dataArray = new Uint8Array(bufferLength);

    const canvasCtx = waveformCanvas.getContext('2d');
    waveformCanvas.width = waveformCanvas.offsetWidth;
    waveformCanvas.height = waveformCanvas.offsetHeight;

    function draw() {
        animationId = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = '#0E1117';
        canvasCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#831434';

        canvasCtx.beginPath();

        var sliceWidth = waveformCanvas.width * 1.0 / bufferLength;
        var x = 0;

        for (var i = 0; i < bufferLength; i++) {

            var v = dataArray[i] / 128.0;
            var y = v * waveformCanvas.height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
        canvasCtx.stroke();
    }

    draw();
}

// Function to send audio to server
function sendAudio(audioBlob) {
    console.log('Sending audio to server...');

    // Append user message to chat display with audio player
    const audioURL = URL.createObjectURL(audioBlob);
    messages.push({ role: "user", content: "", audioData: audioURL });
    renderMessages(); // Render messages once

    // Show "Diagnosing..." animation
    showDiagnosingAnimation();

    // Create FormData
    let formData = new FormData();
    formData.append('audio', audioBlob, 'RecordedAudio.webm');
    formData.append('language', currentLanguage); // Include the selected language

    // Send the audio to the server
    fetch(API_CHAT_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const transcribedText = data.gpt_response || "Could not transcribe audio.";
        const botName = data.bot_name || "Nurse";
        const botIconUrl = data.bot_icon;

        // Stop "Diagnosing..." animation
        stopDiagnosingAnimation();
        // Remove "Diagnosing..." message
        messages.pop();


        // Append bot response
        messages.push({
            role: "bot",
            content: data.gpt_response,
            bot_name: botName,
            bot_icon: botIconUrl
        });
        renderMessages();
    })
    .catch(error => {
        console.error('Error:', error);
        stopDiagnosingAnimation();
        messages.pop();
        messages.push({ role: "bot", content: "An error occurred while processing your audio. Please try again." });
        renderMessages();
    });
}
