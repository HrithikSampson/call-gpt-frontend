let socket: WebSocket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = new WebSocket("ws://localhost:8000/ws");

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      socket = null; // Reset the socket
    };
  }
  return socket;
};