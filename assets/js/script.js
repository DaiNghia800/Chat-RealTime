import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut , onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getDatabase, set, ref, push, onChildAdded, get, child, remove, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";
import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'
const firebaseConfig = {
    apiKey: "AIzaSyCXZjRae5yW6356Zknr4SHn9Xc0HmraRIY",
    authDomain: "chat-app-21cf1.firebaseapp.com",
    databaseURL: "https://chat-app-21cf1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chat-app-21cf1",
    storageBucket: "chat-app-21cf1.appspot.com",
    messagingSenderId: "654905757189",
    appId: "1:654905757189:web:8d9ce1988abd6d224e566c"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);
  const dbRef = ref(db);
  const chatRef = ref(db, 'chats');

//   Register 

  const formRegister = document.querySelector("#form-register");

  if(formRegister) {
    formRegister.addEventListener("submit", (event) => {
        event.preventDefault();

        const fullName = formRegister.fullName.value;
        const email = formRegister.email.value;
        const password = formRegister.password.value;

        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          if(user) {
            set(ref(db, 'users/' + user.uid), {
                fullName: fullName
            }).then(() => {
                window.location.href = "index.html";
            })
          }
        })
        .catch((error) => {
          console.log(error);
        });
    })
  }

// Login 

const formLogin = document.querySelector("#form-login");

if(formLogin) {
  formLogin.addEventListener("submit", (event) => {
      event.preventDefault();

      const email = formLogin.email.value;
      const password = formLogin.password.value;

      signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if(user) {
          window.location.href = "index.html";
        }
      })
      .catch((error) => {
        console.log(error);
      });
  })
}


// Logout 

const buttonLogout = document.querySelector("[button-logout]");

if(buttonLogout) {
  buttonLogout.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    }).catch((error) => {
      console.log(error);
    })
  })
}

const buttonLogin = document.querySelector("[button-login]");
const buttonRegister = document.querySelector("[button-register]");
const formChat = document.querySelector(".chat");

onAuthStateChanged(auth ,(user) => {
  if(user) {
    buttonLogout.style.display = "inline-block";
    formChat.style.display = "block";
  } else {
    buttonLogin.style.display = "inline-block";
    buttonRegister.style.display = "inline-block";
  }
});

// Chat basic 
const url = 'https://api.cloudinary.com/v1_1/dyydagzyn/image/upload';
const formChatMessage = document.querySelector(".inner-form");
if(formChatMessage) {
  const upload = new FileUploadWithPreview.FileUploadWithPreview('upload-images' , {
    multiple: true,
    maxFileCount: 8
  });
  
  formChatMessage.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = formChatMessage.content.value;
    const userId = auth.currentUser.uid;
    const images = upload.cachedFileArray;

    const formData = new FormData();
    const arrayLinkImage = [];

    for (let i = 0; i < images.length; i++) {
      let file = images[i];
      formData.append('file', file);
      formData.append('upload_preset', 'wu6dkhud');

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json();
      arrayLinkImage.push(data.url);
        
    }  

    if((content || arrayLinkImage.length > 0) && userId) {
      set(push(ref(db, 'chats')), {
        content: content,
        userId: userId,
        images: arrayLinkImage
      })
      formChatMessage.content.value = "";
      upload.resetPreviewPanel();
    }
  })
}

// Delete Message 

const buttonDeleteChat = (key) => {
  const button = document.querySelector(`button[button-delete="${key}"]`);
  if(button) {
    button.addEventListener("click", () => {
      remove(ref(db, 'chats/' + key));
    })
  }
}

onChildRemoved(chatRef, (data) => {
  const key = data.key;
  const keyOfMessage = document.querySelector(`[chat-key="${key}"]`);
  keyOfMessage.remove();
})


// Get list messages 

const chatBody = document.querySelector(".inner-body");
if(chatBody) {
  const chatRef = ref(db, 'chats');
  onChildAdded(chatRef, (data) => {
    const key = data.key;
    const userId = data.val().userId;
    const content = data.val().content;
    const images = data.val().images;

    get(child(dbRef, `users/${userId}`)).then((snapshot) => {
      const fullName = snapshot.val().fullName;
      
      const elementChat = document.createElement("div");
      elementChat.setAttribute("chat-key", key);

      let htmlFullname = '';
      let htmlButtonDelete = '';
      let htmlImages = '';
      let htmlContents = '';

      if(userId == auth.currentUser.uid) {
        elementChat.classList.add("inner-outgoing");
        htmlButtonDelete = `
        <button class="button-delete" button-delete="${key}">
          <i class="fa-regular fa-trash-can"></i>
        </button>  
        `;
      } else {
        elementChat.classList.add("inner-incoming");
        htmlFullname = `
        <div class="inner-name"> 
          ${fullName}
        </div>  
        `;
      }

      if(images) {
        htmlImages += `
        <div class="inner-images">
        `;

        for(const image of images) {
          htmlImages += `
          <img src="${image}" />
          `
        }

        htmlImages += `
        </div>
        `;
      }

      if(content) {
        htmlContents += `
        <div class="inner-content">
        ${content}
        </div>  
        `;
      }

      elementChat.innerHTML = `
      ${htmlFullname}
      ${htmlContents}
      ${htmlImages}
      ${htmlButtonDelete}
      `;

      chatBody.appendChild(elementChat);
      new Viewer(elementChat);

      buttonDeleteChat(key);
  })
 })
}


// Insert ICon 

const emojiPicker = document.querySelector('emoji-picker');

if(emojiPicker) {
  emojiPicker.addEventListener('emoji-click', (event) => {
    const icon = event.detail.unicode;

    if(icon) {
      const inputChat = document.querySelector(".chat .inner-form input[name='content']");

      inputChat.value = inputChat.value + icon;
    }
  });
}

// Popup Icon 
const buttonIcon = document.querySelector('.button-icon');
if(buttonIcon) {
  const tooltip = document.querySelector('.tooltip')
  Popper.createPopper(buttonIcon, tooltip)

  buttonIcon.onclick = () => {
    tooltip.classList.toggle('shown');
  }

  window.addEventListener('click', (e) => {
    if(!tooltip.contains(e.target) && !buttonIcon.contains(e.target)) {
      tooltip.classList.remove('shown');
    }
  } )
}
  




