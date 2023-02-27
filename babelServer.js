var express = require("express");
let http = require("http");
const { send } = require("process");
const app = express();
const server = http.createServer(app);

app.get("/", function (req, res, next) {
  res.send("...");
});

// this one is secret ;)
let getPlayerInformation = require("./GetPlayerInformation.js");
let scrape = require("./cookieScraper");

const currentConnections = { individuals: {}, worldGroups: {} };
let currentChatConnections = {};

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

server.listen(process.env.PORT || 3125, async () => {
  console.log("[~] Voice server ready!");
  console.log("[#] Updating cookies...");
  await scrape();
  console.log("[+] Done!");
});

function connectionHandler(
  id,
  isMLUID,
  action,
  location = ["nonspecific", null]
) {
  let globalFound = "none%_";

  if (action === "move") {
    if (location[0] === "nonspecific") return;
    let connectionPoint = connectionHandler(id, isMLUID, "location");
    let clientInfo;

    if (connectionPoint[0] === "individuals%_") {
      clientInfo = currentConnections.individuals[connectionPoint[2]];
      delete currentConnections.individuals[connectionPoint[2]];

      if (location[0] === "individuals%_") {
        currentConnections.individuals[connectionPoint[2]] = clientInfo;
      } else {
        currentConnections.worldGroups[location[0]][location[1]].connections[
          connectionPoint[2]
        ] = clientInfo;
      }
    } else {
      clientInfo =
        currentConnections.worldGroups[connectionPoint[0]][connectionPoint[1]]
          .connections[connectionPoint[2]];
      delete currentConnections.worldGroups[connectionPoint[0]][
        connectionPoint[1]
      ].connections[connectionPoint[2]];

      if (location[0] === "individuals%_") {
        currentConnections.individuals[connectionPoint[2]] = clientInfo;
      } else {
        currentConnections.worldGroups[location[0]][location[1]].connections[
          connectionPoint[2]
        ] = clientInfo;
      }
    }
  } else {
    let found = false;
    Object.keys(currentConnections.individuals).forEach((connection) => {
      if (isMLUID) {
        if (id === currentConnections.individuals[connection].MLIdentity)
          found = true;
      } else {
        if (connection === id) found = true;
      }
      if (found) {
        found = false;
        if (action === "delete") {
          delete currentConnections.individuals[connection];
        } else if (action === "location") {
          globalFound = ["individuals%_", "", connection];
        }
      }
    });
    if (!found) {
      Object.keys(currentConnections.worldGroups).forEach((world) => {
        Object.keys(currentConnections.worldGroups[world]).forEach((group) => {
          Object.keys(
            currentConnections.worldGroups[world][group].connections
          ).forEach((connection) => {
            if (isMLUID) {
              if (
                id ===
                currentConnections.worldGroups[world][group].connections[
                  connection
                ].MLIdentity
              )
                found = true;
            } else {
              if (connection === id) found = true;
            }
            if (found) {
              found = false;
              if (action === "delete") {
                delete currentConnections.worldGroups[world][group].connections[
                  connection
                ];
              } else if (action === "location")
                globalFound = [world, group, connection];
            }
          });
        });
      });
    }
    if (action === "location") return globalFound;
  }
}

io.sockets.on("connection", (client) => {
  client.on("MLUID", async (MLSignature) => {
    senderInformation = await getPlayerInformation(MLSignature.connectId);
    lastUserState = JSON.parse(MLSignature.user);

    if (senderInformation.pi.isFullAccount) {
      if (
        senderInformation.pi.rank === lastUserState.rank &&
        senderInformation.pi.screenName === lastUserState.screenName
      ) {
        currentConnections.individuals[client.id] = {
          calling: false,
          mute: false,
          microphone: true,
          username: senderInformation.pi.screenName,
        };
        currentConnections.individuals[client.id].MLIdentity =
          MLSignature.connectId;

        currentChatConnections[client.id] = { socket: client };
        currentChatConnections[client.id].MLIdentity = MLSignature.connectId;

        console.log("[+] " + lastUserState.screenName + " connected!");
        client.emit("init", client.id);
      } else {
        client.emit("reject", "Something seems off... Disconnecting.");
        console.log("[-] " + lastUserState.screenName + " rejected...");
        client.disconnect();
      }
    } else {
      client.emit(
        "reject",
        "Please login and create an account to use this feature."
      );
      console.log("[-] Explorer rejected...");
      client.disconnect();
    }
  });

  client.on("disconnect", function () {
    // chat connection
    if (Object.keys(currentConnections).includes(client.id)) {
      delete currentConnections[client.id];
    }
    // voice connection
    let clientLocation = connectionHandler(client.id, false, "location");
    if (clientLocation === "none%_") return;

    if (clientLocation[0] !== "individuals%_") {
      let group =
        currentConnections.worldGroups[clientLocation[0]][clientLocation[1]];
      console.log(`[-] ${group.connections[client.id].username} disconnected!`);

      if (group.connections[client.id].MLIdentity === clientLocation[1]) {
        for (entity in group.connections) {
          client.broadcast.to(entity).emit("groupEnd");
          connectionHandler(entity, false, "move", ["individuals%_"]);
        }
      } else {
        connectionHandler(client.id, false, "move", ["individuals%_"]);
        for (const connection in group.connections) {
          client.broadcast.to(connection).emit("left", client.id);
        }
      }
    }
    console.log(
      `[-] ${currentConnections.individuals[client.id].username} disconnected!`
    );

    connectionHandler(client.id, false, "delete");

    if (clientLocation[0] !== "individuals%_") {
      if (
        Object.keys(
          currentConnections.worldGroups[clientLocation[0]][clientLocation[1]]
            .connections
        ).length === 0
      )
        delete currentConnections.worldGroups[clientLocation[0]][
          clientLocation[1]
        ];

      if (
        Object.keys(currentConnections.worldGroups[clientLocation[0]])
          .length === 0
      )
        delete currentConnections.worldGroups[clientLocation[0]];
    }
  });

  client.on("call", (data) => {
    let requestedUser = connectionHandler(data.user, true, "location");
    let indivClient = currentConnections.individuals[client.id];

    if (indivClient.calling !== false) {
      connectionHandler(client.id, false, "move", ["individuals%_"]);
      indivClient.calling = false;
    }

    if (
      requestedUser[0] === "individuals%_" &&
      currentConnections.individuals[requestedUser[2]].calling === false
    ) {
      indivClient.calling = requestedUser[2];
      currentConnections.individuals[requestedUser[2]].calling = client.id;
    } else {
      client.emit(
        "reject",
        "The person who you're attempting to call is unavailable..."
      );
      // client.emit('debug', currentConnections);
    }
  });

  client.on("voice", (data) => {
    let newData = data.split(";");
    newData[0] = "data:audio/ogg;";
    newData = newData[0] + newData[1];

    let clientLocation = connectionHandler(client.id, false, "location");
    let indivClient = currentConnections.individuals[client.id];

    if (clientLocation[0] === "individuals%_") {
      if (
        indivClient.calling !== false &&
        typeof indivClient.calling !== "undefined"
      ) {
        if (
          typeof currentConnections.individuals[indivClient.calling] !==
          "undefined"
        ) {
          if (!currentConnections.individuals[indivClient.calling].mute)
            client.broadcast.to(indivClient.calling).emit("send", newData);
        } else {
          indivClient.calling = false;
        }
      }
    } else if (clientLocation !== "none%_") {
      let group =
        currentConnections.worldGroups[clientLocation[0]][clientLocation[1]];

      for (const connection in group.connections) {
        if (connection != client.id && !group.connections[connection].mute)
          client.broadcast
            .to(connection)
            .emit("send", { audio: newData, id: client.id });
      }
    }
  });

  client.on("deafen", (data) => {
    let clientLocation = connectionHandler(client.id, false, "location");
    if (clientLocation[0] === "individuals%_")
      currentConnections.individuals[client.id].microphone = data;
    else
      currentConnections.worldGroups[clientLocation[0]][
        clientLocation[1]
      ].connections[client.id].microphone = data;
  });

  client.on("mute", (data) => {
    let clientLocation = connectionHandler(client.id, false, "location");
    if (clientLocation[0] === "individuals%_")
      currentConnections.individuals[client.id].mute = data;
    else
      currentConnections.worldGroups[clientLocation[0]][
        clientLocation[1]
      ].connections[client.id].mute = data;
  });

  client.on("createWorldGroup", (data) => {
    // console.log(data.hostId);
    if (
      typeof currentConnections.worldGroups[data.world] === "undefined" ||
      typeof currentConnections.worldGroups[data.world][data.hostId] ===
        "undefined"
    ) {
      currentConnections.worldGroups[data.world] =
        typeof currentConnections.worldGroups[data.world] === "undefined"
          ? {}
          : currentConnections.worldGroups[data.world];

      currentConnections.worldGroups[data.world][data.hostId] = {
        private: data.isPrivate,
        password: data.password,
        hostName: "",
        name: data.groupName,
        connections: {},
      };
      connectionHandler(client.id, false, "move", [data.world, data.hostId]);
      currentConnections.worldGroups[data.world][data.hostId].hostName =
        currentConnections.worldGroups[data.world][data.hostId].connections[
          client.id
        ].username;

      // await sleep(2000);
      console.log("joined at create: " + data.hostId);
      // client.emit("debug", "test");
      client.emit("joined", {
        cause: "update",
        hostId: data.hostId,
        id: client.id,
        caller:
          currentConnections.worldGroups[data.world][data.hostId].connections[
            client.id
          ],
      });
    } else {
      client.emit(
        "reject",
        "You've already created a world group... If you wish to create another, end the current one and try again!"
      );
    }
  });

  client.on("leaveWorldGroup", (data) => {
    let clientLocation = connectionHandler(client.id, false, "location");

    if (clientLocation[0] !== "individuals%_") {
      let group =
        currentConnections.worldGroups[clientLocation[0]][clientLocation[1]];
      if (group.connections[client.id].MLIdentity === clientLocation[1]) {
        for (entity in group.connections) {
          client.broadcast.to(entity).emit("groupEnd");
          connectionHandler(entity, false, "move", ["individuals%_"]);
        }
      } else {
        connectionHandler(client.id, false, "move", ["individuals%_"]);
        for (const connection in group.connections) {
          client.broadcast.to(connection).emit("left", client.id);
        }
      }
      if (Object.keys(group.connections).length === 0)
        delete currentConnections.worldGroups[clientLocation[0]][
          clientLocation[1]
        ];

      if (
        Object.keys(currentConnections.worldGroups[clientLocation[0]])
          .length === 0
      )
        delete currentConnections.worldGroups[clientLocation[0]];
    }

    // client.emit('debug', currentConnections);
  });

  client.on("endCall", (data) => {
    currentConnections.individuals[
      currentConnections.individuals[client.id].calling
    ].calling = false;
    client.broadcast
      .to(currentConnections.individuals[client.id].calling)
      .emit("alert", "Call ended!");
    currentConnections.individuals[client.id].calling = false;
  });

  client.on("getGroupCount", (data) => {
    let count =
      typeof currentConnections.worldGroups[data] === "undefined"
        ? 0
        : currentConnections.worldGroups[data];
    if (count === 0) {
      client.emit("groupCount", { number: count });
    } else {
      client.emit("groupCount", {
        number: Object.keys(count).length,
        groups: count,
      });
    }
  });

  client.on("secondInfoCount", (data) => {
    let count =
      typeof currentConnections.worldGroups[data.world] === "undefined"
        ? 0
        : currentConnections.worldGroups[data.world];
    if (count === 0) {
      console.log("here at 0");
      client.emit("secondCount", { number: count });
    } else {
      console.log("here at many");
      client.emit("secondCount", {
        number: Object.keys(count).length,
        groups: count,
        joinedData: data.joinData,
      });
    }
  });

  client.on("getConnectionCount", (data) => {
    client.emit(
      "connectionCount",
      Object.keys(
        currentConnections.worldGroups[data.world][data.group].connections
      ).length
    );
  });

  client.on("joinWorldGroup", (data) => {
    let clientLocation = connectionHandler(client.id, false, "location");
    let group = currentConnections.worldGroups[data.world][data.hostId];

    if (group.private) {
      if (data.password === group.password) {
        if (clientLocation[0] !== "individuals%_") {
          let group =
            currentConnections.worldGroups[clientLocation[0]][
              clientLocation[1]
            ];
          client.emit("clear");

          if (group.connections[client.id].MLIdentity === clientLocation[1]) {
            connectionHandler(client.id, false, "move", [
              data.world,
              data.hostId,
            ]);

            for (entity in group.connections) {
              client.broadcast.to(entity).emit("groupEnd");
              connectionHandler(entity, false, "move", ["individuals%_"]);
            }
          } else {
            connectionHandler(client.id, false, "move", [
              data.world,
              data.hostId,
            ]);

            for (const connection in group.connections) {
              client.broadcast.to(connection).emit("left", client.id);
            }
          }
        } else {
          connectionHandler(client.id, false, "move", [
            data.world,
            data.hostId,
          ]);
        }

        console.log("joined at jwgpass: " + data.hostId);
        client.emit("joined", {
          cause: "join",
          hostId: data.hostId,
          id: client.id,
          caller: group.connections[client.id],
        });

        for (const connection in group.connections) {
          if (connection != client.id)
            client.broadcast.to(connection).emit("joined", {
              cause: "update",
              hostId: data.hostId,
              id: client.id,
              caller: group.connections[client.id],
            });
        }
      } else {
        console.log(data.password);
        client.emit("reject", "Incorrect password...");
      }
    } else {
      if (clientLocation[0] !== "individuals%_") {
        let group =
          currentConnections.worldGroups[clientLocation[0]][clientLocation[1]];
        client.emit("clear");

        if (group.connections[client.id].MLIdentity === clientLocation[1]) {
          connectionHandler(client.id, false, "move", [
            data.world,
            data.hostId,
          ]);
          for (entity in group.connections) {
            client.broadcast.to(entity).emit("groupEnd");
            connectionHandler(entity, false, "move", ["individuals%_"]);
          }
        } else {
          connectionHandler(client.id, false, "move", [
            data.world,
            data.hostId,
          ]);
          for (const connection in group.connections) {
            client.broadcast.to(connection).emit("left", client.id);
          }
        }
      } else {
        connectionHandler(client.id, false, "move", [data.world, data.hostId]);
      }

      console.log("joined at jwg: " + data.hostId);
      client.emit("joined", {
        cause: "join",
        hostId: data.hostId,
        id: client.id,
        caller: group.connections[client.id],
      });

      for (const connection in group.connections) {
        if (connection != client.id)
          client.broadcast.to(connection).emit("joined", {
            cause: "update",
            hostId: data.hostId,
            id: client.id,
            caller: group.connections[client.id],
          });
      }
    }

    if (clientLocation[0] !== "individuals%_") {
      if (
        Object.keys(
          currentConnections.worldGroups[clientLocation[0]][clientLocation[1]]
            .connections
        ).length === 0
      )
        delete currentConnections.worldGroups[clientLocation[0]][
          clientLocation[1]
        ];

      if (
        Object.keys(currentConnections.worldGroups[clientLocation[0]])
          .length === 0
      )
        delete currentConnections.worldGroups[clientLocation[0]];
    }

    // client.emit('debug', currentConnections);
  });

  client.on("send-message", async (data) => {
    console.log("here");
    if (data.id !== currentChatConnections[client.id].MLIdentity) {
      let reciever = null;
      Object.keys(currentChatConnections).forEach((user) => {
        if (currentChatConnections[user].MLIdentity === data.id) {
          reciever = currentChatConnections[user].socket;
        }
      });
      reciever !== null
        ? reciever.emit("receive-message", {
            message: data.message,
            senderId: currentChatConnections[client.id].MLIdentity,
          })
        : client.emit(
            "reject",
            "Player doesn't appear to be connected to ManyBABEL. If you would like to chat with them privately, you may need to ask them to install BetterML and enable ManyBABEL."
          );
    }
  });
});
