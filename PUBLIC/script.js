const socket = io();
const room = "vitalgo-room";

let localStream, remoteStream, peerConnection;
let isReady = false, isStarted = false;

const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

document.getElementById('startCall').onclick = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    socket.emit('join', room);
  } catch (err) {
    console.error('Error accessing media:', err);
  }
};

document.getElementById('endCall').onclick = () => {
  endVideoConsult();
};

socket.on('joined', () => {
  console.log("Joined room");
});

socket.on('ready', () => {
  isReady = true;
  if (!isStarted && localStream) startPeerConnection();
});

socket.on('offer', async (sdp) => {
  if (!peerConnection) startPeerConnection();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { room, sdp: peerConnection.localDescription });
});

socket.on('answer', async (sdp) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
});

socket.on('ice-candidate', (candidate) => {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

function startPeerConnection() {
  isStarted = true;
  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', { room, candidate: event.candidate });
    }
  };

  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => socket.emit('offer', { room, sdp: peerConnection.localDescription }));
}

function endVideoConsult() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localVideo.srcObject = null;
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
    remoteVideo.srcObject = null;
  }

  isStarted = false;
  console.log("Call ended");
}



function showVideoStream(videoElementId, placeholderId, stream) {
  const video = document.getElementById(videoElementId);
  const placeholder = document.getElementById(placeholderId);

  video.srcObject = stream;
  video.classList.remove('hidden');
  placeholder.style.display = 'none';
  video.play();
}

// Example usage:
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    showVideoStream('localVideo', 'localPlaceholder', stream);
  })
  .catch(error => {
    console.error('Error accessing media devices.', error);
  });



// 🎤 Get references to control buttons for mute and pause video
const muteBtn = document.getElementById('muteBtn');
const pauseVideoBtn = document.getElementById('pauseVideo');

// 🔁 State variables to track mute and pause status
let isMuted = false;
let isVideoPaused = false;

// 🔇 Toggle Mute: Enables/disables audio track and updates icon
muteBtn.addEventListener('click', () => {
  const tracks = localVideo.srcObject.getAudioTracks();
  if (tracks.length > 0) {
    isMuted = !isMuted;
    tracks[0].enabled = !isMuted;
    muteBtn.innerHTML = isMuted
      ? '<i class="fas fa-microphone-slash"></i>'
      : '<i class="fas fa-microphone"></i>';
  }
});

// ⏸️ Toggle Video: Enables/disables video track and updates icon
pauseVideoBtn.addEventListener('click', () => {
  const tracks = localVideo.srcObject.getVideoTracks();
  if (tracks.length > 0) {
    isVideoPaused = !isVideoPaused;
    tracks[0].enabled = !isVideoPaused;
    pauseVideoBtn.innerHTML = isVideoPaused
      ? '<i class="fas fa-video-slash"></i>'
      : '<i class="fas fa-video"></i>';
  }
});

// 🖥️ Placeholder for screen sharing functionality
document.getElementById('screenShare').addEventListener('click', () => {
  alert('Screen sharing feature coming soon!');
});

// 🔄 Placeholder for camera switching functionality
document.getElementById('switchCamera').addEventListener('click', () => {
  alert('Switching camera feature coming soon!');
});



// 📽️ Function to show a video stream in a specified <video> element
function showVideoStream(videoElementId, placeholderId, stream) {
  // Get the video and placeholder DOM elements by their IDs
  const video = document.getElementById(videoElementId);
  const placeholder = document.getElementById(placeholderId);

  // Set the video element to play the provided media stream
  video.srcObject = stream;

  // Unhide the video element
  video.classList.remove('hidden');

  // Hide the placeholder image or element
  placeholder.style.display = 'none';

  // Start playing the video stream
  video.play();
}

// 📡 Access the user's camera and microphone
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    // 👁️ Display the user's video stream in the local video element
    showVideoStream('localVideo', 'localPlaceholder', stream);
  })
  .catch(error => {
    // ⚠️ Handle errors (e.g., permissions denied)
    console.error('Error accessing media devices.', error);
  });

  
// 🎥 Function to swap main and small video elements on click

const mainWrapper = document.getElementById('mainVideoWrapper');
const smallWrapper = document.getElementById('smallVideoWrapper');

smallWrapper.addEventListener('click', () => {
  const mainVideo = mainWrapper.querySelector('video');
  const mainPlaceholder = mainWrapper.querySelector('img');
  const smallVideo = smallWrapper.querySelector('video');
  const smallPlaceholder = smallWrapper.querySelector('img');

  // Swap video elements
  mainWrapper.appendChild(smallVideo);
  smallWrapper.appendChild(mainVideo);

  // Swap placeholder images
  mainWrapper.appendChild(smallPlaceholder);
  smallWrapper.appendChild(mainPlaceholder);

  // Swap visibility if needed
  [mainVideo.className, smallVideo.className] = [smallVideo.className, mainVideo.className];
  [mainPlaceholder.className, smallPlaceholder.className] = [smallPlaceholder.className, mainPlaceholder.className];
});
