// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

import { EventEmitter } from 'events';
import { MqttBase } from 'azure-iot-mqtt-base';
import { errors, X509 } from 'azure-iot-common';
import * as machina from 'machina';
import * as Provisioning from 'azure-device-provisioning-client';

// TODO: update HTTP constructor to accept _config
export class Mqtt extends EventEmitter implements Provisioning.Transport {
  private _config: Provisioning.Config;
  private _mqttBase: MqttBase;
  private _fsm: machina.Fsm;

  /**
   * @private
   * @constructor
   * @param config The configuration object.
   */
  // TODO: add api version to config struct or make global
  constructor(config: Provisioning.Config, mqttBase?: MqttBase) {
    super();
    this._config = config;
    this._mqttBase = mqttBase || new MqttBase(config.userAgent);
    this._fsm = new machina.Fsm({
      namespace: 'mqtt-provisioning',
      initialState: 'disconnected',
      states: {
        disconnected: {
          _onEnter: (callback, err, result) => {
            if (callback) {
              callback(err, result);
            }
          },
          connect: (callback) => {
            this._fsm.transition('connecting', callback);
          },
          register: (authorization, forceRegistration, body, callback) => {
            callback(new errors.NotConnectedError());
          },
          disconnect: (callback) => {
            if (callback) {
              callback();
            }
          }
        }
      }
    });
  }

  connect(callback: (err?: Error) => void): void {
    this._fsm.handle('connect', callback);
  }

  register(authorization: string | X509, forceRegistration: boolean, body: any, callback: Provisioning.ResponseCallback): void {
    this._fsm.handle('register', authorization, forceRegistration, body, callback);
  }

  disconnect(callback: (err?: Error) => void): void {
    this._fsm.handle('disconnect', callback);
  }

}

