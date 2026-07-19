import DmView from "../dms/DmView";
import RoomView from "../rooms/RoomView";

function MainPanel({ activeView }) {
  if (activeView === true) {
    return <DmView />;
  }

  return <RoomView roomId={activeView.id} roomName={activeView.name} />;
}

export default MainPanel;