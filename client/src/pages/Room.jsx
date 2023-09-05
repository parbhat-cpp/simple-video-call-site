import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { AppBar, Box, Toolbar, Typography } from "@mui/material";

const ContainerBox = {
  width: "100%",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const ButtonContainer = {
  display: "flex",
  flexDirection: {
    lg: "row",
    md: "row",
    sm: "column",
    xs: "column",
  },
  "& > button": {
    margin: "0 10px",
    outline: "none",
  },
};

function Room() {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log("incoming call", from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("call accepted");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);

    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <Box style={{ background: "rgb(217, 211, 211)" }}>
      <Box sx={ContainerBox}>
        <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
        <Box sx={ButtonContainer}>
          {myStream && <button onClick={sendStreams}>Send stream</button>}
          {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: {
              lg: "row",
              md: "column",
              sm: "column",
              xs: "column",
            },
            justifyContent: "center",
            alignItems: "center",
            "& > div": {
              flex: {
                lg: "0.5",
                md: "0.5",
                sm: "1",
                xs: "1",
              },
            },
          }}
        >
          {remoteStream && (
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "10px",
              }}
            >
              <ReactPlayer
                playing
                height="auto"
                width="100%"
                url={remoteStream}
              />
              <Typography>Caller</Typography>
            </Box>
          )}
          {myStream && (
            <Box
              sx={{
                display: {
                  lg: "flex",
                  md: "none",
                  sm: "none",
                  xs: "flex",
                },
                flexDirection: "column",
                alignItems: "center",
                padding: "10px",
              }}
            >
              <ReactPlayer
                playing
                height="auto"
                width="100%"
                url={myStream}
              />
              <Typography>Me</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Room;
