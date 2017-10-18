# azure-iot-provisioning-mqtt Requirements

## Overview
This module provides MQTT protocol support to communicate with the Azure device provisioning service

## Example Usage
```js
// TODO: copy/paste

```

// TODO: add results.Connected to HTTP
// TODO: add requirements about register packet contents (what is serialized, what properties besides QOS to use.)
// TODO: add requirements about registration response packet -- final and intermediate.
// TODO: add requirements about how the registration response is returned to the caller.
// TODO: add requirements about topics to subscribe to.
// TODO: add requirements about re-subscription recovery.

## Public Interface

### constructor(config: DeviceProvisioningTransport.Config, mqttBase?: MqttBase)
The `constructor` creates and returns an `Mqtt` object.

**SRS_NODE_PROVISIONING_MQTT_18_001: [** The `construcor` shall accept a `DeviceProvisioningTransport.Config` structure and an optional `MqttBase` object **]**

**SRS_NODE_PROVISIONING_MQTT_18_007: [** If an `MqttBase` object is provided, `Mqtt` shall use this as a lower level transport.  Otherwise, `Mqtt` shall create an `MqttBase` object **]**

### connect(callback: (err?: Error) => void): void
The connect method connects to the provisioing service

**SRS_NODE_PROVISIONING_MQTT_18_010: [** The connect method shall call the connect method on MqttBase **]**

**SRS_NODE_PROVISIONING_MQTT_18_002: [** The `connect` method shall call its callback immediately if `MqttBase` is already connected. **]**

**SRS_NODE_PROVISIONING_MQTT_18_012: [** When `MqttBase` fires the `close` event, the `Mqtt` object shall emit a `disconnect` event. **]**

**SRS_NODE_PROVISIONING_MQTT_18_003: [** The `connect` method shall calls its callback with an `Error` that has been translated from the `MqttBase` error using the `translateError` method if it fails to establish a connection. **]**

**SRS_NODE_PROVISIONING_MQTT_18_004: [** The `connect` method shall call its callback with a `null` error parameter and a `results.Connected` response if `MqttBase` successfully connects. **]**

**SRS_NODE_PROVISIONING_MQTT_18_020: [** The `connect` method shall subscribe to the topic named '$dps/registrations/res/# **]**

**SRS_NODE_PROVISIONING_MQTT_18_021: [** If the registration fails, `connect` shall fail with an error created using `translateError` **]**


### register(authorization: string | X509, forceRegistration: boolean, body: any, callback: DeviceProvisioningTransport.ResponseCallback): void
The `register` method performs a single rount-trip registration transaction with the provisioning service.  Several calls to the `register` method may be necessary to complete the registration.

**SRS_NODE_PROVISIONING_MQTT_18_005: [** The `register` method shall connect the MQTT connection if it's not already connected. **]**

**SRS_NODE_PROVISIONING_MQTT_18_015: [** The `register` method shall call its callback with an `Error` that has been translated using the `translateError` method if the `MqttBase` object fails to establish a connection. **]**

**SRS_NODE_PROVISIONING_MQTT_18_011: [** The `register` method shall call `publish` on the `MqttBase` object **]**

**SRS_NODE_PROVISIONING_MQTT_18_013: [** The `register` method shall use a topic formatted using the following convention: `$dps/registratoins/PUT/iotdps-register/?$rid={request_id}`. **]**

**SRS_NODE_PROVISIONING_MQTT_18_014: [** The `register` method shall use QoS level of 1. **]**

**SRS_NODE_PROVISIONING_MQTT_18_016: [** If `register` is called while `MqttBase` is establishing the connection, it shall wait until the connection is established and then publish the registration packet **]**

**SRS_NODE_PROVISIONING_MQTT_18_017: [** If `register` is called while `MqttBase` is establishing the connection, and `MqttBase` fails to establish the connection, then register shall fail. **]**

**SRS_NODE_PROVISIONING_MQTT_18_018: [** If `register` is called while `MqttBase` is disconnecting, it shall wait until the disconnection is complete and then try to connect again and send the event. **]**

**SRS_NODE_PROVISIONING_MQTT_18_019: [** The `register` method shall call its callback with an `Error` that has been translated using the `translateError` method if the `MqttBase` object fails to publish the message. **]**

// TODO: is this the end of the transaction, or do we need to poll after we receive this?
**SRS_NODE_PROVISIONING_MQTT_18_022: [** `register` shall call it's callback when it receives a response message with the topic named with the following convention: '$dps/regi **]**stration/res/{status}/?$rid={request_id}'

**SRS_NODE_PROVISIONING_MQTT_18_023: [** if the response topic contains a status < 300, the callback will be called with a null error as the first arguement and the body of the message as the second argument. **]**

**SRS_NODE_PROVISIONING_MQTT_18_024: [** If the response topic contains a status >= 300, the callback will be called with an error created using the HTTP translateError function. **]**

// TODO: how does polling work?  Where does operation_id come from?
/*
register shall poll for status updates until the response message is received

status update polling shall use <TODO> for a polling interval.

status updates requests shall be published using a topic with the format '$dps/registrations/GET/
*/

### disconnect(callback: (err?: Error) => void): void
The disconnect method disconnects from the provisioning service.

**SRS_NODE_PROVISIONING_MQTT_18_006: [** If `disconnect` is called while the transport is disconnected, it shall return immediately with no error. **]**

**SRS_NODE_PROVISIONING_MQTT_18_009: [** The `disconnect` method shall call `disconnect` on the `MqttBase` object **]**

