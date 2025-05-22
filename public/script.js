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