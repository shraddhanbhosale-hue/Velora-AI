import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } 
from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

// Firebase

const firebaseConfig = {
  apiKey: "AIzaSyCHvu0Uuy1ausxC6-djFK3m3g03--qkkBU",
  authDomain: "velora-ai-1ff1a.firebaseapp.com",
  projectId: "velora-ai-1ff1a",
  storageBucket: "velora-ai-1ff1a.firebasestorage.app",
  messagingSenderId: "109271705797",
  appId: "1:109271705797:web:22717ff7489d93c00368ac",
  measurementId: "G-Q6JCLLGZND"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// login

window.openLogin = () => {
  document.getElementById("loginModal")?.classList.remove("hidden");
};

window.closeLogin = () => {
  document.getElementById("loginModal")?.classList.add("hidden");
};

window.googleLogin = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      closeLogin();

      const popup = document.createElement("div");
      popup.className =
        "fixed top-[70px] right-[20px] bg-white rounded-2xl p-4 shadow-xl z-50 w-[250px]";

      popup.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
          <img src="${user.photoURL}" class="w-[40px] h-[40px] rounded-full">
          <div>
            <p class="font-semibold text-black text-[14px]">${user.displayName}</p>
            <p class="text-gray-500 text-[12px]">${user.email}</p>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" class="w-full text-center text-[13px] border border-gray-300 py-1 rounded-lg hover:bg-gray-100 transition text-black">
          Close
        </button>
      `;

      document.body.appendChild(popup);

      const btn = document.querySelector(".right-nav button");
      if (btn) btn.innerText = user.displayName.split(" ")[0];
    })
    .catch((err) => console.log(err.message));
};

// chatbot

const input = document.querySelector(".input");
const sendBtn = document.querySelector(".sendBtn");
const messageArea = document.querySelector(".message");
const menuIcon = document.querySelector(".menu");
const sidebar = document.querySelector(".sidebar");
const closeBtn = document.querySelector(".cross");

// sidebar

menuIcon?.addEventListener("click", () => sidebar?.classList.toggle("hidden"));
closeBtn?.addEventListener("click", () => sidebar?.classList.toggle("hidden"));

// file upload

document.querySelector(".ri-add-large-fill")?.addEventListener("click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.click();
});


// request control

let firstSend = true;
let isRequestRunning = false;
let lastRequestTime = 0;

// send msg

sendBtn?.addEventListener("click", handleSend);

input?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

async function handleSend() {
  const text = input.value.trim();
  if (!text) return;

  if (isRequestRunning) return;


  /* USER MESSAGE */
  const userMsg = document.createElement("div");
  userMsg.className = "flex justify-end mb-4";
  userMsg.innerHTML = `
    <p class="bg-[#212121] text-white py-2 px-4 rounded-2xl max-w-[80%]">
      ${text}
    </p>
  `;
  messageArea.appendChild(userMsg);
  messageArea.scrollTop = messageArea.scrollHeight;

  /* TYPING INDICATOR */
  const typing = document.createElement("div");
  typing.className = "text-white mb-4";
  typing.innerText = "Thinking...";
  messageArea.appendChild(typing);

  try {
    const reply = await fetchGemini(text);
    typing.remove();

    const botMsg = document.createElement("div");
    botMsg.className = "flex justify-start mb-4";
    botMsg.innerHTML = `
      <p class="bg-black text-white px-1 rounded-2xl max-w-[100%] leading-relaxed">
        ${formatText(reply)}
      </p>
    `;

    messageArea.appendChild(botMsg);
    messageArea.scrollTop = messageArea.scrollHeight;

  } catch (err) {
    typing.remove();
    const errMsg = document.createElement("div");
    errMsg.className = "text-red-400 mb-4 text-sm";
    errMsg.innerText = "Something went wrong. Please try again.";
    messageArea.appendChild(errMsg);
  }

  setTimeout(() => {
    isRequestRunning = false;
  }, 3000);
}

// Text Format
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/### (.*?)\n/g, "<br><strong>$1</strong><br>")
    .replace(/## (.*?)\n/g, "<br><strong>$1</strong><br>")
    .replace(/\* (.*?)\n/g, "<br>• $1")
    .replace(/\n/g, "<br>");
}




// Gemini API

async function fetchGemini(prompt, retryCount = 0) {
  const GEMINI_API_KEY = "";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  const data = await res.json();
  console.log("Gemini Status:", res.status);

  if (res.status === 429) {
    if (retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      return fetchGemini(prompt, retryCount + 1);
    }
    return "Rate limit reached. Please wait 1 minute and try again.";
  }

  if (!res.ok) {
    console.error("Gemini Error:", data.error?.message);
    throw new Error(data.error?.message || "API Error");
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";
}
