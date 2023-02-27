let groupOpen = false;
let chatMenuOpen = false;
let inboxOpen = false;
let callMenuOpen = false;
let connectionId = null;

let groupList = {};
let conversationList = {};

function dragElement(elmnt, selmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    selmnt.style.top = selmnt.offsetTop - pos2 + "px";
    selmnt.style.left = selmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Inbox
let conversationHolder = document.createElement("div");
conversationHolder.classList.add("conversation-holder");
conversationHolder.style.top = `0px`;
conversationHolder.style.left = `0px`;
conversationHolder.id = "CVHolder";

let conversationBar = document.createElement("div");
conversationBar.classList.add("conversation-bar");
conversationBar.id = "CVBar";
conversationHolder.appendChild(conversationBar);

let conversationWrapper = document.createElement("div");
conversationWrapper.classList.add("conversation-wrapper");
conversationHolder.appendChild(conversationWrapper);

// Chat Menu
let chatHolder = document.createElement("div");
chatHolder.classList.add("chat-holder");
chatHolder.style.top = `0px`;
chatHolder.style.left = `0px`;
chatHolder.id = "CHHolder";

let chatBar = document.createElement("div");
chatBar.classList.add("chat-bar");
chatBar.id = "CHBar";
chatHolder.appendChild(chatBar);

let chatWrapper = document.createElement("div");
chatWrapper.classList.add("chat-wrapper");
chatWrapper.id = "0";
chatHolder.appendChild(chatWrapper);

// exit button chat
let exitChat = document.createElement("img");
exitChat.width = "35";
exitChat.height = "35";
exitChat.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/911026015957045248/f2b902c3b15eeed.png";
exitChat.classList.add("exit-button-chat");
conversationBar.appendChild(exitChat);

exitChat.onclick = function () {
  ig.game.sounds.click.play();
  conversationHolder.style.visibility = "hidden";
  inboxOpen = false;
};

// exit button chat 2
let exitChat2 = document.createElement("img");
exitChat2.width = "35";
exitChat2.height = "35";
exitChat2.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/911026015957045248/f2b902c3b15eeed.png";
exitChat2.classList.add("exit-button2");
chatBar.appendChild(exitChat2);

exitChat2.onclick = function () {
  ig.game.sounds.click.play();
  chatHolder.style.visibility = "hidden";
  chatMenuOpen = false;
  chatWrapper.id = "0";
};

// Arrow button
let arrow = document.createElement("img");
arrow.width = "45";
arrow.height = "26";
arrow.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/911026619609649219/9b9dc652038a7a1.png";
arrow.classList.add("arrow-button");
chatBar.appendChild(arrow);

arrow.onclick = function () {
  ig.game.sounds.click.play();
  chatHolder.style.visibility = "hidden";
  chatMenuOpen = false;
  chatWrapper.id = "0";

  conversationHolder.style.visibility = "visible";
  inboxOpen = true;
};

// Message composer
let messageComposer = document.createElement("div");
messageComposer.classList.add("message-composer");
chatHolder.appendChild(messageComposer);

let messageBox = document.createElement("input");
messageBox.classList.add("message-box");
messageBox.placeholder = "Message..";
messageBox.autocomplete = "off";
messageBox.id = "msgBx";

messageBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && messageBox.value !== "") {
    socket.emit("send-message", {
      id: chatWrapper.id,
      message: messageBox.value,
    });
    conversationList[chatWrapper.id].messages.push({
      content: ig.game.player.screenName.toUpperCase() + ":" + messageBox.value,
      sender: ig.game.player[id],
    });

    messageBox.value = "";
  }
});
messageComposer.appendChild(messageBox);

function createEntryChat(name, id) {
  if (name.length >= 15) {
    name = name.substring(0, 11) + "...";
  }
  let senderId = id;
  // Style
  let conversationEntry = document.createElement("div");
  conversationEntry.classList.add("conversation-entry");
  // Configure
  conversationEntry.id = senderId;

  let senderName = document.createElement("p");
  senderName.classList.add("inbox-sender-name");
  senderName.innerHTML = name.toUpperCase();
  conversationEntry.appendChild(senderName);

  // Style
  let closeConvo = document.createElement("img");
  closeConvo.classList.add("conversation-closer");
  // Configure
  closeConvo.width = "21";
  closeConvo.height = "21";
  closeConvo.src =
    "https://cdn.discordapp.com/attachments/614637022614782000/911027064419807292/65d975657775e47.png";
  conversationEntry.appendChild(closeConvo);
  // Change to red x when hovered
  closeConvo.onmouseover = () => {
    closeConvo.setAttribute(
      "src",
      "https://cdn.discordapp.com/attachments/614637022614782000/911026950049525821/a9a48516cc1de12.png"
    );
  };
  closeConvo.onmouseout = () => {
    closeConvo.setAttribute(
      "src",
      "https://cdn.discordapp.com/attachments/614637022614782000/911027064419807292/65d975657775e47.png"
    );
  };
  // removes entry and clears conversation history
  closeConvo.onclick = () => {
    ig.game.sounds.collapse.play();
    delete conversationList[senderId];
    conversationWrapper.removeChild(closeConvo.parentElement);
    if (chatMenuOpen && chatWrapper.id === senderId) {
      chatMenuOpen = false;
      chatHolder.style.visibility = "hidden";
      chatWrapper.id = "0";
    }
  };

  conversationEntry.onmouseover = () => {
    closeConvo.style.visibility = "visible";
  };
  conversationEntry.onmouseout = () => {
    closeConvo.style.visibility = "hidden";
  };

  conversationEntry.onmousedown = () => {
    if (
      closeConvo.src !==
      "https://cdn.discordapp.com/attachments/614637022614782000/911026950049525821/a9a48516cc1de12.png"
    ) {
      closeConvo.style.visibility = "hidden";
      conversationEntry.style.backgroundColor = "rgba(75, 75, 75, 0.45)";
    }
  };
  conversationEntry.onmouseup = () => {
    if (
      closeConvo.src !==
      "https://cdn.discordapp.com/attachments/614637022614782000/911026950049525821/a9a48516cc1de12.png"
    ) {
      conversationEntry.style.backgroundColor = "";
      if (!chatMenuOpen) {
        conversationHolder.style.visibility = "hidden";
        inboxOpen = false;
      }
      openChatMenu(senderId);
    }
  };
  conversationWrapper.appendChild(conversationEntry);
}

function createMessage(contents, senderId) {
  // Style
  let chatEntry = document.createElement("div");
  chatEntry.classList.add("chat-entry");
  // Configure
  chatEntry.id = senderId;
  chatWrapper.appendChild(chatEntry);
  // Style
  let senderName = document.createElement("div");
  senderName.classList.add("message-sender-name");
  senderId === ig.game.player[id]
    ? (senderName.style.color = "#1c6c0c")
    : (senderName.style.color = "#4f4d4c");
  // Configure
  senderName.innerText = contents.split(":")[0];
  chatEntry.appendChild(senderName);
  // Style
  let messageBody = document.createElement("div");
  messageBody.classList.add("message-body");
  // Configure
  messageBody.innerText = contents.split(":")[1];
  senderName.appendChild(messageBody);
}

let previousChildCount = chatWrapper.children.length;
let previousScrollHeight = chatWrapper.scrollHeight - 360;

function updateChat() {
  requestAnimationFrame(updateChat);
  if (chatWrapper.id === "0") return;
  if (
    chatWrapper.children.length !==
    conversationList[chatWrapper.id].messages.length
  ) {
    chatWrapper.innerHTML = "";
    for (let message of conversationList[chatWrapper.id].messages) {
      createMessage(message.content, message.sender);
    }
  }
  if (chatWrapper.children.length !== previousChildCount) {
    previousChildCount = chatWrapper.children.length;
    if (chatWrapper.scrollTop == previousScrollHeight) {
      chatWrapper.scrollTop = chatWrapper.scrollHeight - 360;
    }
    previousScrollHeight = chatWrapper.scrollHeight - 360;
  }
}

getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return;
      seen.add(value);
    }
    return value;
  };
};

//******VOICE STUFF******

// callMenu
let callHolder = document.createElement("div");
callHolder.classList.add("call-holder");
callHolder.style.top = `0px`;
callHolder.style.left = `0px`;
callHolder.id = "CCHolder";

let callBar = document.createElement("div");
callBar.classList.add("call-bar");
callBar.id = "CCBar";
callHolder.appendChild(callBar);

let callWrapper = document.createElement("div");
callWrapper.classList.add("call-wrapper");
callHolder.appendChild(callWrapper);

let bottomCallBar = document.createElement("div");
bottomCallBar.classList.add("message-composer-voice");
callHolder.appendChild(bottomCallBar);

// group
let groupHolder = document.createElement("div");
groupHolder.classList.add("group-holder");
groupHolder.style.top = `0px`;
groupHolder.style.left = `0px`;
groupHolder.id = "GRHolder";

let groupBar = document.createElement("div");
groupBar.classList.add("group-bar");
groupBar.id = "GRBar";
groupHolder.appendChild(groupBar);

let groupWrapper = document.createElement("div");
groupWrapper.classList.add("group-wrapper");
groupHolder.appendChild(groupWrapper);

// exit button voice
let exitVoice = document.createElement("img");
exitVoice.width = "35";
exitVoice.height = "35";
exitVoice.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/911026015957045248/f2b902c3b15eeed.png";
exitVoice.classList.add("exit-button-voice");
groupBar.appendChild(exitVoice);

exitVoice.onclick = function () {
  ig.game.sounds.click.play();
  groupHolder.style.visibility = "hidden";
  groupOpen = false;
};

// mute button
let isMuted = false;
let muteButton = document.createElement("img");
muteButton.width = "50";
muteButton.height = "52";
muteButton.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/939544338701123714/ecbf7de66f1df64.png";
muteButton.classList.add("mute-button");

muteButton.onclick = function () {
  if (isMuted)
    muteButton.src =
      "https://cdn.discordapp.com/attachments/614637022614782000/939544338701123714/ecbf7de66f1df64.png";
  else
    muteButton.src =
      "https://cdn.discordapp.com/attachments/614637022614782000/939544215476666408/c9a5ae84e3c4a66.png";

  ig.game.sounds.click.play();
  isMuted = !isMuted;
};

bottomCallBar.appendChild(muteButton);

// deaf button
let isDeaf = false;
let deafButton = document.createElement("img");
deafButton.width = "55";
deafButton.height = "52";
deafButton.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/939544109595652156/4384f8b5416d847.png";
deafButton.classList.add("deaf-button");

deafButton.onclick = function () {
  if (isDeaf)
    deafButton.src =
      "https://cdn.discordapp.com/attachments/614637022614782000/939544109595652156/4384f8b5416d847.png";
  else
    deafButton.src =
      "https://cdn.discordapp.com/attachments/614637022614782000/939544075688869908/c98c770b6de73c9.png";

  ig.game.sounds.click.play();
  isDeaf = !isDeaf;
};

bottomCallBar.appendChild(deafButton);

// Hangup button
let hangupButton = document.createElement("img");
hangupButton.width = "60";
hangupButton.height = "50";
hangupButton.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/939546188770848808/98f245296a979cd.png";
hangupButton.classList.add("hangup-button");

hangupButton.onclick = function () {
  socket.emit("leaveWorldGroup");

  callWrapper.innerHTML = "";
  callHolder.style.visibility = "hidden";
  callMenuOpen = false;

  ig.game.sounds.click.play();
};

bottomCallBar.appendChild(hangupButton);

let addButton = document.createElement("img");
addButton.width = "25";
addButton.height = "25";
addButton.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/923671839371325500/2722f0cdd620ddb.png";
addButton.classList.add("add-button");

let alertText = `<p class="miftThankYouMessage">Enter group information</p> <p>NAME <input type="text" id="nam" maxlength="255" style="width: 30%; text-transform: uppercase;"/></p><p class="disableContentSelect" style="margin: 0px;padding: 0px 90px 0px 0px; border-radius: 8px; cursor: default" onclick="ig.game.settings.toggleCheckbox('isPrivate'); passParam();">PRIVATE <img src=" https://d2eim8cueyd9dt.cloudfront.net/media/checkbox/off/3.png" alt="" id="checkbox_isPrivate" /> <span id="isPrivateInfo" style="display: inline-block; opacity: .5; margin-left: 28px; font-size: 90%"></span></p><br><a href="javascript:addGroup()" class="okButton">CREATE</a>`;
ig.game.settings.isPrivate = false;

function passParam() {
  let alertD = document.getElementById("alertDialog");
  ig.game.settings.isPrivate = !ig.game.settings.isPrivate;

  if (ig.game.settings.isPrivate) {
    let newDia = alertD.children[0].innerHTML
      .split("<br><a")
      .join(
        '<p>PASSWORD <input type="text" id="pass" maxlength="255" style="width: 22%; text-transform: uppercase;"/></p><a'
      );
    alertD.children[0].innerHTML = newDia;
  } else {
    alertD.children[0].innerHTML = alertText;
  }
}

function addGroup() {
  let gName = document.getElementById("nam");
  if (gName.value === "") {
    ig.game.alertDialog.open(
      "<p style='color: red'>Name cannot be empty...</p>",
      !0,
      null,
      null,
      null,
      !0,
      null,
      null,
      !0,
      null,
      null,
      !0
    );
    return;
  }

  if (ig.game.settings.isPrivate) {
    let gPass = document.getElementById("pass");
    if (gPass.value === "") {
      ig.game.alertDialog.open(
        "<p style='color: red'>Password cannot be empty...</p>",
        !0,
        null,
        null,
        null,
        !0,
        null,
        null,
        !0,
        null,
        null,
        !0
      );
      return;
    }
    socket.emit("createWorldGroup", {
      isPrivate: ig.game.settings.isPrivate,
      password: gPass.value,
      groupName: gName.value,
      world: document.location.pathname.substring(1),
      hostId: ig.game.player.id,
    });
  } else {
    socket.emit("createWorldGroup", {
      isPrivate: ig.game.settings.isPrivate,
      password: "",
      groupName: gName.value,
      world: document.location.pathname.substring(1),
      hostId: ig.game.player.id,
    });
  }

  ig.game.alertDialog.close();
  ig.game.sounds.click.play();

  openCall();
}

addButton.onclick = function () {
  ig.game.sounds.click.play();
  groupHolder.style.visibility = "hidden";
  groupOpen = false;

  ig.game.alertDialog.open(
    alertText,
    !0,
    null,
    null,
    null,
    !0,
    null,
    null,
    !0,
    null,
    null,
    !0
  );
};

groupBar.appendChild(addButton);

let entryOpen = false;

function createEntry(name, isPrivate, id, count, host, connections) {
  if (name.length >= 30) {
    name = name.substring(0, 28) + "...";
  }

  if (host.length >= 25) {
    host = host.substring(0, 11) + "...";
  }
  let senderId = id;
  // Style
  let groupEntry = document.createElement("div");
  groupEntry.classList.add("group-entry");
  // Configure
  groupEntry.id = senderId;

  let senderName = document.createElement("p");
  senderName.classList.add("group-sender-name");
  senderName.innerText = name.toUpperCase();
  groupEntry.appendChild(senderName);

  let peopleCount = document.createElement("p");
  peopleCount.classList.add("people-count");
  peopleCount.innerText = count;
  groupEntry.appendChild(peopleCount);
  peopleCount.style.visibility = "hidden";

  let closeConvo = document.createElement("img");
  closeConvo.classList.add("group-closer");
  // Configure
  closeConvo.width = "25";
  closeConvo.height = "25";
  closeConvo.src =
    "https://cdn.discordapp.com/attachments/614637022614782000/912193129107587092/a32f04c951bf698.png";
  groupEntry.appendChild(closeConvo);

  if (isPrivate) {
    closeConvo.style.visibility = "visible";
  } else {
    closeConvo.style.visibility = "hidden";
  }

  groupEntry.onmouseover = () => {
    groupEntry.style.backgroundColor = "rgba(75, 75, 75, 0.25)";
    closeConvo.style.visibility = "visible";
    closeConvo.width = "45";
    closeConvo.height = "30";
    senderName.style.fontStyle = "italic";
    senderName.innerHTML =
      `HOST: <span style="color: #1c6c0c">` + host.toUpperCase() + "</span>";
    closeConvo.setAttribute(
      "src",
      "https://cdn.discordapp.com/attachments/614637022614782000/912461875004977172/0ae032891a92df8.png"
    );
    peopleCount.style.visibility = "visible";
  };
  groupEntry.onmouseout = () => {
    if (!isPrivate) closeConvo.style.visibility = "hidden";
    closeConvo.width = "25";
    closeConvo.height = "25";
    senderName.style.fontStyle = "normal";
    senderName.innerText = name.toUpperCase();
    closeConvo.setAttribute(
      "src",
      "https://cdn.discordapp.com/attachments/614637022614782000/912193129107587092/a32f04c951bf698.png"
    );
    peopleCount.style.visibility = "hidden";

    groupEntry.style.backgroundColor = "";
  };

  groupEntry.onmouseup = () => {
    entryOpen = true;
    let foundSelf = false;

    for (con in connections) {
      if (connections[con].MLIdentity === ig.game.player.id) {
        foundSelf = true;
        break;
      }
    }

    if (foundSelf) {
      ig.game.sounds.nocando.play();
      ig.game.alertDialog.open(
        "<p style='color: red'>You're already in this world group...</p>",
        !0,
        null,
        null,
        null,
        !0,
        null,
        null,
        !0,
        null,
        null,
        !0
      );
      entryOpen = false;
      return;
    }

    if (isPrivate) {
      ig.game.alertDialog.open(
        "<p class='miftThankYouMessage'>Enter Password</p><input id='in' autocomplete='off'></input>",
        !0,
        null,
        null,
        null,
        !0,
        null,
        null,
        !0,
        null,
        null,
        !0
      );
      let pass = document.getElementById("in");

      function passwordEvent(event) {
        if (event.key === "Enter") {
          ig.game.alertDialog.close();
          document.removeEventListener("keyup", passwordEvent);

          let p = pass.value;
          socket.emit("joinWorldGroup", {
            world: document.location.pathname.substring(1),
            hostId: id,
            password: p,
          });

          groupHolder.style.visibility = "hidden";
          groupOpen = false;

          entryOpen = false;
        }
      }

      document.addEventListener("keyup", passwordEvent);
    } else {
      socket.emit("joinWorldGroup", {
        world: document.location.pathname.substring(1),
        hostId: id,
      });
      groupHolder.style.visibility = "hidden";
      groupOpen = false;

      entryOpen = false;
    }
  };
  groupWrapper.appendChild(groupEntry);
}

function createSpeaker(name, callId) {
  if (name.length >= 20) {
    name = name.substring(0, 15) + "...";
  }
  // Style
  let callEntry = document.createElement("div");
  callEntry.classList.add("group-entry");
  // Configure
  callEntry.id = callId;

  let senderName = document.createElement("p");
  senderName.classList.add("group-sender-name");
  senderName.innerText = name.toUpperCase();
  callEntry.appendChild(senderName);

  callWrapper.appendChild(callEntry);
}

function updateGroupList() {
  socket.emit("getGroupCount", document.location.pathname.substring(1));
  socket.on("groupCount", (data) => {
    groupWrapper.innerHTML = "";
    if (data.number !== 0) {
      for (let group in data.groups) {
        createEntry(
          data.groups[group].name,
          data.groups[group].private,
          group,
          Object.keys(data.groups[group].connections).length,
          data.groups[group].hostName,
          data.groups[group].connections
        );
      }
    }
  });
}

function openGroup() {
  if (!groupOpen) {
    ig.game.sounds.click.play();
    updateGroupList();
    groupHolder.style.visibility = "visible";
    console.log;
    groupOpen = true;
  }
}

function openCall() {
  if (!callMenuOpen) {
    ig.game.sounds.click.play();
    // updateGroupList();
    callHolder.style.visibility = "visible";
    callWrapper.innerHTML = "";

    callMenuOpen = true;
  }
}

async function loadCSS() {
  fetch("https://cdn.jsdelivr.net/gh/ZoltarML/ManyBABEL@latest/ManyBABEL.css")
    .then((resp) => resp.text())
    .then((css) => {
      let style = document.createElement("style");
      style.innerHTML = css;
      $("head")[0].appendChild(style);
    });
}

// Getting Parses deobfuscator and Socket.io
!(async function main() {
  if (typeof io !== "undefined") return;

  await $.getScript(
    "https://cdn.jsdelivr.net/gh/socketio/socket.io-client/dist/socket.io.min.js"
  );

  loadCSS().then(async () => {
    if (typeof Deobfuscator === "undefined")
      // Parses deobf
      await $.getScript(
        "https://cdn.jsdelivr.net/gh/parseml/many-deobf@latest/deobf.js"
      );

    init(500);
  });
})();

let globalGroupCount = 0;

ig.game.bottomMenu.subMenus[0].extraOptions = { names: [], callbacks: [] };

function addNewSubMenu(name, callback) {
  if (ig.game.bottomMenu.subMenus.length == 0) return;

  bottomMenu = ig.game.bottomMenu.subMenus[0];
  bottomMenu.extraOptions.names.push(name);
  bottomMenu.extraOptions.callbacks.push(callback);

  if (!bottomMenu.pos._y) {
    bottomMenu._numberOfMenuItems = bottomMenu.numberOfMenuItems;
    bottomMenu._update = bottomMenu.update;
    bottomMenu.pos._y = bottomMenu.pos.y;
    bottomMenu._open = bottomMenu.open;
    bottomMenu._draw = bottomMenu.draw;
  }
  bottomMenu.numberOfMenuItems++;
  const offset = 20 * (bottomMenu.numberOfMenuItems - 9);
  bottomMenu.pos.y = bottomMenu.pos._y - offset;

  bottomMenu.open = function () {
    this._open();

    let size = {
      x: this.clickSpotHelp.size.x,
      y: this.clickSpotHelp.size.y,
    };

    for (let index = 0; index < bottomMenu.numberOfMenuItems - 9; index++) {
      eval(
        `let position = { x: this.clickSpotHelp.pos.x, y: this.clickSpotHelp.pos.y + (this.clickSpotHeight * ${
          index + 1
        })}; this.clickSpot${
          index + 1
        }= new UIClickSpot(position, size, false, "clickSpot${
          index + 1
        }"); this.clickSpot${
          index + 1
        }.onClick = this.extraOptions.callbacks[${index}];`
      );
    }

    socket.emit("getGroupCount", document.location.pathname.substring(1));
    socket.on("groupCount", (data) => {
      globalGroupCount = data.number;
    });
  };

  bottomMenu.update = function () {
    this._update();
    for (let index = 0; index < bottomMenu.numberOfMenuItems - 9; index++) {
      eval(
        `this.clickSpot${index + 1} && this.clickSpot${index + 1}.update();`
      );
    }
  };

  bottomMenu.draw = function () {
    this._draw();

    if (!this.isOpen) return;

    ig.system.context.globalAlpha = 0.7;

    for (let index = 0; index < this.extraOptions.names.length; index++) {
      ig.game.blackFont.draw(
        this.extraOptions.names[index],
        this.clickSpotHelp.pos.x + 5,
        this.clickSpotHelp.pos.y + 5 + this.clickSpotHeight * (index + 1)
      );
    }

    ig.system.context.globalAlpha = 1;

    ig.system.context.globalAlpha = 0.4;

    ig.game.blackFont.draw(
      globalGroupCount,
      this.clickSpotHelp.pos.x + 70,
      this.clickSpotHelp.pos.y + 5 + this.clickSpotHeight
    );

    ig.system.context.globalAlpha = 1;
  };
}

function init(time) {
  // Appending menus
  $("body")[0].appendChild(groupHolder);
  $("body")[0].appendChild(callHolder);
  $("body")[0].appendChild(conversationHolder);
  $("body")[0].appendChild(chatHolder);

  $("#canvas").on("click", () => $("#msgBx").blur());

  // Making menus able to be dragged
  // Voice
  dragElement(
    document.getElementById("GRBar"),
    document.getElementById("GRHolder")
  );
  dragElement(
    document.getElementById("CCBar"),
    document.getElementById("CCHolder")
  );
  // Chat
  dragElement(
    document.getElementById("CVBar"),
    document.getElementById("CVHolder")
  );
  dragElement(
    document.getElementById("CHBar"),
    document.getElementById("CHHolder")
  );

  updateChat();

  // getting blocked info
  let playerInfo = Deobfuscator.object(ig.game, "myPeople");
  let blockFunction = Deobfuscator.function(playerInfo, ".splice(c,1)})");
  let blockList = Deobfuscator.keyBetween(blockFunction, "b.", ".splice");

  // Adding new submenus
  addNewSubMenu("Groups", () => openGroup());
  addNewSubMenu("Inbox", () => openInbox());

  checkAd = Deobfuscator.function(ig.game.bottomMenu, 'var a="bottom: "', true);

  // Creating a new alert function for messages
  ig.game.bottomMenu.messageAlert = function (a, b) {
    var f;
    f =
      "" +
      ('<span class="pseudolink" onclick="' +
        ("ig.game.playerDialog.openForPlayerId('" + a + "')") +
        '">' +
        b +
        "</span>");
    f += " has sent you a message.";
    let ad;
    eval(`ad = this.${checkAd}()`);

    jQuery(
      '<div id="pingFromFriend" style="' + ad + '">' + f + "</div>"
    ).appendTo("body");
    ig.game.sounds.ping.play();
    setTimeout(() => jQuery("#pingFromFriend").remove(), 3000);
  };

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    let vol = 0;
    var mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    const audioContext = new AudioContext();
    const mediaStreamAudioSourceNode =
      audioContext.createMediaStreamSource(stream);
    const analyserNode = audioContext.createAnalyser();
    mediaStreamAudioSourceNode.connect(analyserNode);

    const pcmData = new Float32Array(analyserNode.fftSize);
    let volAvg = [];

    const onFrame = () => {
      analyserNode.getFloatTimeDomainData(pcmData);
      let sumSquares = 0.0;
      for (const amplitude of pcmData) {
        sumSquares += amplitude * amplitude;
      }
      vol = Math.sqrt(sumSquares / pcmData.length) * 100;
      volAvg.push(vol);

      window.requestAnimationFrame(onFrame);
    };

    window.requestAnimationFrame(onFrame);

    var audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", function (event) {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", function () {
      var audioBlob = new Blob(audioChunks);
      let values = (average = 0);
      for (var i = 0; i < volAvg.length; i++) {
        values += volAvg[i];
      }

      average = values / volAvg.length;
      audioChunks = [];

      var fileReader = new FileReader();
      fileReader.readAsDataURL(audioBlob);
      fileReader.onloadend = function () {
        if (isMuted) return;

        var base64String = fileReader.result;
        volAvg = [];
        if (average <= 0.9) return;

        socket.emit("voice", base64String);
        if (callMenuOpen) {
          let speakerFrame = document.getElementById(connectionId);
          speakerFrame.children[0].style.color = "#1c6c0c";
          setTimeout(() => {
            speakerFrame.children[0].style.color = "#4f4d4c";
          }, 1500);
        }
      };

      mediaRecorder.start();

      setTimeout(function () {
        mediaRecorder.stop();
      }, time);
    });

    setTimeout(function () {
      mediaRecorder.stop();
    }, time);
  });

  socket = io("http://localhost:3125", {
    reconnection: false,
  });
  socket.emit("MLUID", {
    connectId: ig.game.player[id],
    user: JSON.stringify(ig.game.player, getCircularReplacer()),
  });

  socket.on("receive-message", async (info) => {
    if (playerInfo[blockList].includes(info.senderId)) return;

    let senderData = await jQuery.ajax({
      url: "/j/u/pi/",
      type: "POST",
      data: {
        id: info.senderId,
        planeId: 0,
        areaId: "5f163f57be72d462f412bf5d",
      },
    });
    consoleref.log(senderData);
    let children = conversationWrapper.children;
    let exists = false;
    if (children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        if (info.senderId === children[i].id) {
          exists = true;
          break;
        }
      }
    }
    if (!exists) {
      createEntryChat(senderData.screenName, info.senderId);
      conversationList[info.senderId] = {
        messages: [
          {
            content: senderData.screenName.toUpperCase() + ":" + info.message,
            sender: info.senderId,
          },
        ],
      };
    } else {
      conversationList[info.senderId].messages.push({
        content: senderData.screenName.toUpperCase() + ":" + info.message,
        sender: info.senderId,
      });
    }

    if (!inboxOpen && chatWrapper.id !== info.senderId) {
      ig.game.bottomMenu.messageAlert(info.senderId, senderData.screenName);
    }
  });

  socket.on("send", function (data) {
    if (!isDeaf) {
      var audio = new Audio(data.audio);
      let speakerFrame = document.getElementById(data.id);
      speakerFrame.children[0].style.color = "#1c6c0c";

      audio.play();
      setTimeout(() => {
        speakerFrame.children[0].style.color = "#4f4d4c";
      }, 1500);
    }
  });

  socket.on("reject", (reason) => {
    ig.game.sounds.nocando.play();
    ig.game.alertDialog.open(
      "<p style='color: red'>" + reason + "</p>",
      !0,
      null,
      null,
      null,
      !0,
      null,
      null,
      !0,
      null,
      null,
      !0
    );
  });

  socket.on("joined", (data) => {
    if (data.cause === "join") {
      openCall();
      socket.emit("secondInfoCount", {
        world: document.location.pathname.substring(1),
        joinData: data,
      });
    } else if (data.cause === "update") {
      if (data.id !== connectionId) ig.game.sounds.bell_3_f.play();

      createSpeaker(data.caller.username, data.id);
    }
  });

  socket.on("left", (data) => {
    callWrapper.removeChild(document.getElementById(data));
    ig.game.sounds.bell_2_as.play();
  });

  socket.on("groupEnd", () => {
    callWrapper.innerHTML = "";
    callHolder.style.visibility = "hidden";
    callMenuOpen = false;
    ig.game.alertDialog.open(
      "<p style='color: black'>Host has ended the world group!</p>",
      !0,
      null,
      null,
      null,
      !0,
      null,
      null,
      !0,
      null,
      null,
      !0
    );
  });

  socket.on("alert", (reason) => {
    ig.game.sounds.click.play();
    ig.game.alertDialog.open(
      "<p style='color: black'>" + reason + "</p>",
      !0,
      null,
      null,
      null,
      !0,
      null,
      null,
      !0,
      null,
      null,
      !0
    );
  });

  socket.on("debug", (data) => {
    consoleref.log(data);
  });

  socket.on("secondCount", (gd) => {
    for (connection in gd.groups[gd.joinedData.hostId].connections) {
      createSpeaker(
        gd.groups[gd.joinedData.hostId].connections[connection].username,
        connection
      );
    }
  });

  socket.on("init", (data) => {
    connectionId = data;
  });

  socket.on("clear", () => {
    callWrapper.innerHTML = "";
  });
}

function getDistance(x1, y1, x2, y2) {
  let xDistance = x2 - x1;
  let yDistance = y2 - y1;

  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

let img = new Image();

img.src =
  "https://cdn.discordapp.com/attachments/614637022614782000/911027270628544552/05a896880addfd3.png";
ig.game.playerDialog.old_draw = ig.game.playerDialog.draw;

ig.game.playerDialog.draw = function () {
  ig.game.playerDialog.old_draw();

  if (this.isOpen) {
    clickedPlayer = Deobfuscator.object(ig.game.playerDialog, "rank");
    if (clickedPlayer.id !== ig.game.player[id]) {
      ig.system.context.globalAlpha = 0.5;
      if (ig.game.player.isEditorHere) {
        ig.system.context.drawImage(
          img,
          (this.pos.x + 103) * ig.system.scale,
          (this.pos.y + 91) * ig.system.scale,
          16 * ig.system.scale,
          12 * ig.system.scale
        );
      } else {
        ig.system.context.drawImage(
          img,
          (this.pos.x + 117) * ig.system.scale,
          (this.pos.y + 91) * ig.system.scale,
          16 * ig.system.scale,
          12 * ig.system.scale
        );
      }

      ig.system.context.globalAlpha = 1;
    }
  } else {
    document.removeEventListener("click", () => {});
  }
};

document.addEventListener("click", () => {
  if (ig.game.isEditorHere) {
    if (
      ig.game.playerDialog.isOpen &&
      getDistance(
        ig.input.mouse.x,
        ig.input.mouse.y,
        ig.game.playerDialog.pos.x + 103,
        ig.game.playerDialog.pos.y + 91
      ) <= 16 &&
      clickedPlayer.id !== ig.game.player[id]
    ) {
      ig.game.sounds.click.play();
      openChatMenu(clickedPlayer.id, clickedPlayer.name);
    }
  } else {
    if (
      ig.game.playerDialog.isOpen &&
      getDistance(
        ig.input.mouse.x,
        ig.input.mouse.y,
        ig.game.playerDialog.pos.x + 117,
        ig.game.playerDialog.pos.y + 91
      ) <= 16 &&
      clickedPlayer.id !== ig.game.player[id]
    ) {
      ig.game.sounds.click.play();
      openChatMenu(clickedPlayer.id, clickedPlayer.name);
    }
  }
});

function openChatMenu(cid, cscn) {
  if (typeof conversationList[cid] == "undefined") {
    createEntryChat(cscn, cid);
    conversationList[cid] = { messages: [] };
  }

  if (!chatMenuOpen) {
    chatHolder.style.visibility = "visible";
    chatMenuOpen = true;
    chatWrapper.id = cid;
  } else {
    chatWrapper.id = cid;
  }
}

function openInbox() {
  if (!inboxOpen) {
    ig.game.sounds.click.play();
    conversationHolder.style.visibility = "visible";

    inboxOpen = true;
  }
}
