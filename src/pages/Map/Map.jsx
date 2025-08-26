import { useMemo, useState, useEffect } from "react";
import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import { ArcLayer } from "@deck.gl/layers";
import { Spin, Alert, Card, List, Typography, Divider, Select } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import useConnectionMap from "../../service/Map";
import useHostDevices from "../../service/HostDevices";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

function CustomMap() {
  const { maps, loading, error } = useConnectionMap();
  const { devices, loading: devicesLoading } = useHostDevices();
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [filteredMaps, setFilteredMaps] = useState([]);

  // Filter connections based on selected device
  useEffect(() => {
    if (!selectedDevice) {
      setFilteredMaps(maps || []);
    } else {
      const filtered = (maps || []).filter(
        (connection) => connection.device_bios_uuid === selectedDevice
      );
      setFilteredMaps(filtered);
    }
  }, [maps, selectedDevice]);

  // Xarita markazlash
  const viewState = useMemo(() => {
    const coords = filteredMaps
      .flatMap((d) => [d.more_info?.local_address, d.more_info?.remote_address])
      .filter((loc) => loc && loc.latitude && loc.longitude);

    if (coords.length === 0) {
      return {
        longitude: 0,
        latitude: 20,
        zoom: 1.5,
        pitch: 30,
        bearing: 0,
      };
    }

    const avgLat =
      coords.reduce((sum, c) => sum + c.latitude, 0) / coords.length;
    const avgLng =
      coords.reduce((sum, c) => sum + c.longitude, 0) / coords.length;

    return {
      longitude: avgLng,
      latitude: avgLat,
      zoom: 2,
      pitch: 30,
      bearing: 0,
    };
  }, [filteredMaps]);

  // Layerlar
  const layers = useMemo(() => {
    const arcs = filteredMaps
      .filter(
        (d) =>
          d.more_info?.local_address &&
          d.more_info?.remote_address &&
          d.more_info.local_address.latitude &&
          d.more_info.remote_address.latitude
      )
      .map((d, index) => ({
        ...d,
        source: [
          d.more_info.local_address.longitude,
          d.more_info.local_address.latitude,
        ],
        target: [
          d.more_info.remote_address.longitude,
          d.more_info.remote_address.latitude,
        ],
        id: index,
      }));

    return [
      new ArcLayer({
        id: "arc-layer",
        data: arcs,
        getSourcePosition: (d) => d.source,
        getTargetPosition: (d) => d.target,
        getSourceColor: (d) =>
          selectedConnection && selectedConnection.id === d.id
            ? [255, 255, 0] // sariq
            : [0, 128, 255], // ko‘k
        getTargetColor: (d) =>
          selectedConnection && selectedConnection.id === d.id
            ? [255, 215, 0] // oltin
            : [255, 0, 128], // pushti
        getWidth: (d) =>
          selectedConnection && selectedConnection.id === d.id ? 5 : 3,
        pickable: true,
        onClick: (info) => {
          if (info.object) {
            setSelectedConnection(info.object);
          }
        },
      }),
    ];
  }, [filteredMaps, selectedConnection]);

  if (loading || devicesLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "30%",
          padding: "16px",
          overflowY: "auto",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <Typography.Title level={4}>Connections List</Typography.Title>

        {/* Device Selection */}
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="Select a device"
            style={{ width: "100%" }}
            allowClear
            onChange={(value) => setSelectedDevice(value)}
            value={selectedDevice}
          >
            {devices.map((device) => (
              <Select.Option key={device.bios_uuid} value={device.bios_uuid}>
                {device.name || device.bios_uuid}
              </Select.Option>
            ))}
          </Select>
        </div>

        <List
          itemLayout="horizontal"
          dataSource={filteredMaps}
          renderItem={(item, index) => (
            <List.Item
              onClick={() => setSelectedConnection({ ...item, id: index })}
              style={{
                cursor: "pointer",
                backgroundColor:
                  selectedConnection && selectedConnection.id === index
                    ? "#e6f7ff"
                    : "white",
                padding: "8px",
                borderRadius: "4px",
              }}
            >
              <List.Item.Meta
                title={`Connection ${index + 1}`}
                description={
                  <>
                    <div>
                      <strong>From:</strong>{" "}
                      {item.more_info?.local_address?.city || "Unknown"},{" "}
                      {item.more_info?.local_address?.country || "Unknown"}
                    </div>
                    <div>
                      <strong>To:</strong>{" "}
                      {item.more_info?.remote_address?.city || "Unknown"},{" "}
                      {item.more_info?.remote_address?.country || "Unknown"}
                    </div>
                    <div>
                      <strong>Device:</strong>{" "}
                      {devices.find(
                        (d) => d.bios_uuid === item.device_bios_uuid
                      )?.name || "Unknown"}
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {/* Map */}
      <div style={{ width: "70%", position: "relative" }}>
        <DeckGL
          initialViewState={viewState}
          controller={true}
          layers={layers}
          style={{ width: "100%", height: "100%" }}
          getTooltip={({ object }) =>
            object &&
            `From: ${object.more_info?.local_address?.city || "Unknown"}\nTo: ${
              object.more_info?.remote_address?.city || "Unknown"
            }`
          }
        >
          <Map mapStyle={MAP_STYLE} />
        </DeckGL>

        {/* Details Card */}
        {selectedConnection && (
          <Card
            title="Connection Details"
            bordered={false}
            style={{
              width: 350,
              position: "absolute",
              top: 10,
              right: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 100,
            }}
            extra={
              <CloseOutlined
                onClick={() => setSelectedConnection(null)}
                style={{ cursor: "pointer" }}
              />
            }
          >
            {/* Device Info */}
            <p>
              <strong>Device:</strong>{" "}
              {devices.find(
                (d) => d.bios_uuid === selectedConnection.device_bios_uuid
              )?.name || "Unknown"}
            </p>

            {/* From */}
            <p>
              <strong>From:</strong>{" "}
              {selectedConnection.more_info?.local_address?.city || "Unknown"},{" "}
              {selectedConnection.more_info?.local_address?.country ||
                "Unknown"}
            </p>
            <p>
              <strong>IP:</strong>{" "}
              {selectedConnection.more_info?.local_address?.ip || "N/A"}
            </p>
            <p>
              <strong>ISP:</strong>{" "}
              {selectedConnection.more_info?.local_address?.isp || "N/A"}
            </p>
            <p>
              <strong>ASN:</strong>{" "}
              {selectedConnection.more_info?.local_address?.asn || "N/A"}
            </p>

            <Divider />

            {/* To */}
            <p>
              <strong>To:</strong>{" "}
              {selectedConnection.more_info?.remote_address?.city || "Unknown"},{" "}
              {selectedConnection.more_info?.remote_address?.country ||
                "Unknown"}
            </p>
            <p>
              <strong>IP:</strong>{" "}
              {selectedConnection.more_info?.remote_address?.ip || "N/A"}
            </p>
            <p>
              <strong>ISP:</strong>{" "}
              {selectedConnection.more_info?.remote_address?.isp || "N/A"}
            </p>
            <p>
              <strong>ASN:</strong>{" "}
              {selectedConnection.more_info?.remote_address?.asn || "N/A"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CustomMap;
