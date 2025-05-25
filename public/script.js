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

function lightMode() {
    document.body.classList.remove('dark-mode');
    // Ensure the sun icon is active
    document.querySelector('.togglemenu .fa-sun').classList.add('active-mode');
    document.querySelector('.togglemenu .fa-moon').classList.remove('active-mode');
    localStorage.setItem('theme', 'light'); // Save preference
}

function darkMode() {
    document.body.classList.add('dark-mode');
    // Ensure the moon icon is active
    document.querySelector('.togglemenu .fa-moon').classList.add('active-mode');
    document.querySelector('.togglemenu .fa-sun').classList.remove('active-mode');
    localStorage.setItem('theme', 'dark'); // Save preference
}

function sidemenushow() {
    const sideBar = document.getElementById('sideBar'); // Main sidebar
    const aside = document.getElementById('aside1'); // mobile navbar
    const backshadow = document.getElementById('close-sidebar');

    //adding animations
    sideBar.classList.remove('slide-out');
    sideBar.classList.add('slide-in');
    aside.classList.add('slide-out');
    aside.classList.remove('slide-in');

    // Show the sidebar and toggle icons
    sideBar.style.display = 'block';
    sideBar.style.opacity ='1';
    aside.style.opacity = '0';
    backshadow.style.display = 'block';
}

function sidemenunone() {
    const sideBar = document.getElementById('sideBar'); // Main sidebar
    const aside = document.getElementById('aside1'); //mobile navbar
    const backshadow = document.getElementById('close-sidebar');

    //adding animations
    sideBar.classList.remove('slide-in');
    sideBar.classList.add('slide-out');
    aside.classList.remove('slide-out');
    aside.classList.add('slide-in');

    // Hide the sidebar and toggle icons
    sideBar.style.opacity = '0';
    aside.style.display = 'block';
    aside.style.opacity ='1';
    backshadow.style.display = 'none'; 
}

function activelink(){
    const navLinks = document.querySelectorAll('.linkpages a, .linkpages1 a');
    const currentPage = window.location.pathname.split("/").pop();

    navLinks.forEach(lin => {
        const href = lin.href.split("/").pop();
        if (href === currentPage){
            lin.classList.add('active');
        }
    });
}

activelink();

document.addEventListener('DOMContentLoaded', function() {
    // Handles active theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.togglemenu .fa-moon').classList.add('active-mode');
        document.querySelector('.togglemenu .fa-sun').classList.remove('active-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.querySelector('.togglemenu .fa-sun').classList.add('active-mode');
        document.querySelector('.togglemenu .fa-moon').classList.remove('active-mode');
    }

    // Including continues typing of vital-go
    new Typed("#motto", {
        strings: ["Our Motto:", "Connected Health.", "Empowered Lives.", "Your Health.", "Anywhere.", "Anytime."],
        typeSpeed: 250,
        loop: true
    });
});