import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import { AppBar, Box, Toolbar } from "@mui/material";

const LobbyFormContainer = {
  width: "100%",
  padding: "10px",
  margin: "10px auto",
  display: "flex",
  justifyContent: "center",
};

function Lobby() {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const navigate = useNavigate();

  const socket = useSocket();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <Box
      style={{
        width: "100%",
        height: "100vh",
        background: "rgb(217, 211, 211)",
      }}
    >
      <AppBar position="static">
        <Toolbar></Toolbar>
      </AppBar>
      <Box sx={LobbyFormContainer}>
        <form
          onSubmit={handleSubmitForm}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <input
            placeholder="Email"
            style={{
              outline: "none",
              border: "1px #f4f4f4",
              borderRadius: "15px",
              background: "#f4f4f4",
              height: "8vh",
              width: "50%",
              textAlign: "center",
              margin: "5px auto",
            }}
            type="email"
            id="form-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <input
            placeholder="Room no."
            style={{
              outline: "none",
              border: "1px #f4f4f4",
              borderRadius: "15px",
              background: "#f4f4f4",
              height: "8vh",
              width: "50%",
              textAlign: "center",
              margin: "5px auto",
            }}
            type="text"
            id="form-room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <br />
          <button
            style={{
              width: "25%",
              height: "6vh",
              borderRadius: "15px",
              margin: "5px auto",
            }}
          >
            Join
          </button>
        </form>
      </Box>
    </Box>
  );
}

export default Lobby;
