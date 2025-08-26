import { Routes, Route } from "react-router-dom";
import Tom from "../pages/User/Tom";
import TeamOne from "./../pages/Team/TeamOne/TeamOne";
import TeamTwo from "./../pages/Team/TeamTwo/TeamTwo";
import FireWall from "../pages/Firewall/FireWall";
import Files from "./../pages/Files/Files";
import HostDevices from "../pages/HostDevices/HostDevices";
import DeviceFullInfo from "../pages/HostDevices/DeviceFull";
import AgentLogs from "../pages/Logs/Logs";
import Applications from "../pages/Applications/Applications";
import ApplicationConnections from "../pages/HostDevices/ApplicationConnections";
import CreateFirewallRule from "../pages/Firewall/CreateFirewallRule";
import CustomMapIpAddress from "../pages/IpAddress/IpAddress";
// import CustomMap from "../pages/Map/Map";

function Router() {
  return (
    <Routes>
      <Route path="/user/:id" element={<Tom />} />
      {/* <Route path="/map" element={<CustomMap />} /> */}
      <Route path="/ipaddress" element={<CustomMapIpAddress />} />
      <Route path="/firewall" element={<FireWall />} />
      <Route path="/firewall/create" element={<CreateFirewallRule />} />
      <Route path="/devices" element={<HostDevices />} />
      <Route path="/devices/:id" element={<DeviceFullInfo />} />
      <Route path="/connections/:id" element={<ApplicationConnections />} />
      <Route path="/logs" element={<AgentLogs />} />
      <Route path="/applications" element={<Applications />} />
      <Route path="/TeamOne" element={<TeamOne />} />
      <Route path="/TeamTwo" element={<TeamTwo />} />
      <Route path="/Files" element={<Files />} />
    </Routes>
  );
}

export default Router;
