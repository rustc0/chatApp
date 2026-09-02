import DmView from "../dms/DmView";
import RoomView from "../rooms/RoomView";

function MainPanel({ activeView }) {
  if (activeView === true) {
    return <DmView />;
  }

  const isDm = activeView.type === "dm";
  const roomName = isDm ? activeView.peer?.username ?? "Direct message" : activeView.name;

  return <RoomView roomId={activeView.id} roomName={roomName} isDm={isDm} />;
}

export default MainPanel;