// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

import { EventEmitter } from 'events';
import { errors, X509, SharedAccessSignature } from 'azure-iot-common';
import * as machina from 'machina';
import * as Provisioning from './transport_interface';
import * as dbg from 'debug';
const debug = dbg('azure-device-provisioning:transport-fsm');

export interface TransportHandlers {
  _doConnectForFsm(callback: (err?: Error) => void): void;
  _doDisconnectForFsm(callback: (err?: Error) => void): void;
  _doFirstRegistrationRequestForFsm(registrationId: string, authorization: SharedAccessSignature | X509 | string, requestBody: any, forceRegistration: boolean, callback: (err?: Error, responseBody?: any, result?: any, pollingInterval?: number) => void): void;
  _doOperationStatusQueryForFsm(registrationId: string, operationId: string, callback: (err?: Error, responseBody?: any, result?: any, pollingInterval?: number) => void): void;
  _getErrorFromResultForFsm(result: any): any;
}

export class TransportStateMachine extends EventEmitter implements Provisioning.Transport, TransportHandlers{
  protected _apiVersion: string = '2017-08-31-preview';
  private _fsm: machina.Fsm;
  private _pollingTimer: any;
  private _registrationCallback: Provisioning.ResponseCallback;

  constructor() {
    super();

    this._fsm = new machina.Fsm({
      namespace: 'Provisioning',
      initialState: 'disconnected',
      states: {
        disconnected: {
          _onEnter: (callback, err) => {
            debug('entering disconnected state');
            this._pollingTimer = null;
            this._registrationCallback = null;
            if (callback) {
              callback(err);
            }
          },
          connect: (callback) => {
            this._fsm.transition('connecting', callback);
          },
          register: (callback, registrationId, authorization, requestBody, forceRegistration) => {
            this._fsm.handle('connect', (err) => {
              if (err) {
                this._fsm.transition('disconnecting', callback, err);
              } else {
                this._fsm.transition('sendingRegistrationReqest', callback, registrationId, authorization, requestBody, forceRegistration);
              }
            });
          },
          disconnect: (callback) => {
            // nothing to do.
            callback();
          }
        },
        connecting: {
          _onEnter: (callback) => {
            debug('entering connecting state');
            this._doConnectForFsm((err) => {
              if (err) {
                this._fsm.transition('disconnecting', callback, err);
              } else {
                this._fsm.transition('connected', callback);
              }
            });
          },
          '*': () => this._fsm.deferUntilTransition()
        },
        connected: {
          _onEnter: (callback, err, body, result) => {
            debug('entering connected state');
            callback(err, body, result);
          },
          connect: (callback) => {
            // nothing to do.
            callback();
          },
          disconnect: (callback) => {
            this._fsm.transition('_disconnecting', callback);
          },
          register: (callback, registrationId, authorization, requestBody, forceRegistration) => {
            this._fsm.transition('sendingRegistrationRequest', callback, registrationId, authorization, requestBody, forceRegistration);
          },
        },
        sendingRegistrationReqest: {
          _onEnter: (callback, registrationId, authorization, requestBody, forceRegistration) => {
            debug('entering sendingRegistrationRequest state');
            this._registrationCallback = callback;
            this._doFirstRegistrationRequestForFsm(registrationId, authorization, requestBody, forceRegistration, (err, responseBody, result, pollingInterval) => {
              if (this._registrationInProgress()) { // make sure we weren't cancelled before doing something with the response
                if (err) {
                  this._fsm.transition('connected', callback, err);
                } else {
                  this._handleOperationStatusResponse(registrationId, responseBody, result, pollingInterval, callback);
                }
              }
            });
          },
          disconnect: (callback) => this._fsm.transition('disconnecting', callback),
          '*': (callback) => callback(new errors.InvalidOperationError('another operation is in progress'))
        },
        waiting_to_poll: {
          _onEnter: (callback, registrationId, operationId, pollingInterval) => {
            debug('entering waitingToPoll state');
            debug('waiting for ' + pollingInterval + ' ms');
            this._pollingTimer = setTimeout(() => {
              this._fsm.transition('polling', callback, registrationId, operationId, pollingInterval);
            }, pollingInterval);
          },
          disconnect: (callback, err, responseBody) => this._fsm.transition('disconnecting', callback, err, responseBody),
          '*': (callback) => callback(new errors.InvalidOperationError('another operation is in progress'))
        },
        polling: {
          _onEnter: (callback, registrationId, operationId, pollingInterval) => {
            debug('entering polling state');
            this._doOperationStatusQueryForFsm(registrationId, operationId, (err, result, body, pollingInterval) => {
              if (this._registrationInProgress()) { // make sure we weren't cancelled before doing something with the response
                if (err) {
                  this._fsm.transition('connected', callback, err);
                } else {
                  this._handleOperationStatusResponse(registrationId, result, body, pollingInterval, callback);
                }
              }
            });
          },
          disconnect: (callback) => this._fsm.transition('disconnecting', callback),
          '*': (callback) => callback(new errors.InvalidOperationError('another operation is in progress'))
        },
        disconnecting: {
          _onEnter: (callback, err) => {
            debug('entering disconnecting state');
            this._cancelCurrentOperation((cancelErr) => {
              // log any errors, which are extremely unlikely, but continue disconnecting.
              if (cancelErr) {
                debug('error received from transport during disconnection (1):' + cancelErr.toString());
              }
              this._doDisconnectForFsm((disconnectErr) => {
                if (disconnectErr) {
                  debug('error received from transport during disconnection (2):' + cancelErr.toString());
                }
                this._fsm.transition('disconnected', callback, err);
              });
            });
          },
          '*': () => this._fsm.deferUntilTransition()
        }
      }
    });
  }

  /* istanbul ignore next */
  _doConnectForFsm(callback: (err?: Error) => void): void {
    throw new errors.NotImplementedError('_doConnectForFsm not implemented in this transport');
  }

  /* istanbul ignore next */
  _doDisconnectForFsm(callback: (err?: Error) => void): void {
    throw new errors.NotImplementedError('_doDisconnectForFsm not implemented in this transport');
  }

  /* istanbul ignore next */
  _doFirstRegistrationRequestForFsm(registrationId: string, authorization: SharedAccessSignature | X509 | string, requestBody: any, forceRegistration: boolean, callback: (err?: Error, responseBody?: any, result?: any, pollingInterval?: number) => void): void {
    throw new errors.NotImplementedError('_doFirstRegistrationRequestForFsm not implemented in this transport');
  }

  /* istanbul ignore next */
  _doOperationStatusQueryForFsm(registrationId: string, operationId: string, callback: (err?: Error, responseBody?: any, result?: any, pollingInterval?: number) => void): void {
    throw new errors.NotImplementedError('_doOperationStatusQueryForFsm not implemented in this transport');
  }

  /* istanbul ignore next */
  _getErrorFromResultForFsm(result: any): any {
    throw new errors.NotImplementedError('_getErrorFromResultForFsm not implemented in this transport');
  }


  connect(callback: (err?: Error) => void): void {
    this._fsm.handle('connect', callback);
  }

  register(registrationId: string, authorization: string | X509, requestBody: any, forceRegistration: boolean, callback: Provisioning.ResponseCallback): void {
    debug('register called for registrationId "' + registrationId + '"');
    if (this._registrationInProgress()) {
      debug('attempted to register while another operation is process');
      callback(new errors.InvalidOperationError('another registration is in progress'));
    } else {
      this._fsm.handle('register', callback, registrationId, authorization, requestBody, forceRegistration);
    }
  }

  disconnect(callback: (err: Error) => void): void {
    debug('disconnect called');
    this._fsm.handle('disconnect', callback);
  }

  private _cancelCurrentOperation(callback: (err?: Error) => void): void {
    debug('cancelling current operation');
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_035: [ disconnect will cause polling to cease ] */
    if (this._pollingTimer != null) {
      debug('stopping polling timer');
      clearTimeout(this._pollingTimer);
      this._pollingTimer = null;
    }

    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_031: [ If `disconnect` is called while the registration request is in progress, `register` shall call the `callback` with an `OperationCancelledError` error. ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_033: [ If `disconnect` is called while the register is waiting between polls, `register` shall call the `callback` with an `OperationCancelledError` error. ] */
    if (this._registrationInProgress()) {
      debug('operation is in progress.  Cancelling.');
      let _callback = this._registrationCallback;
      this._registrationCallback = null;
      _callback(new errors.OperationCancelledError());
    }

    callback();
  }
  private _handleOperationStatusResponse(registrationId: string,  responseBody: any, result: any, pollingInterval: number, callback: any): void {
    if (responseBody) {
      debug('received response from service:' + JSON.stringify(responseBody));
      let status: string = responseBody.status || responseBody.operationStatus;
      switch (status.toLowerCase()) {
        case 'assigned': {
          this._fsm.transition('connected', callback, null, responseBody, result);
          break;
        }
        case 'assigning': {
          this.emit('operationStatus', responseBody);
          this._fsm.transition('waiting_to_poll', callback, registrationId, responseBody.operationId, pollingInterval);
          break;
        }
        default: {
          let err = new SyntaxError('status is ' + status);
          (err as any).Result = result;
          (err as any).ResponseBody = responseBody;
          this._fsm.transition('connected', callback, err);
          break;
        }
      }
    } else {
      let err = this._getErrorFromResultForFsm(result);
      (err as any).Result = result;
      (err as any).ResponseBody = responseBody;
      this._fsm.transition('connected', callback, err, responseBody, result);
    }
  }


  private _registrationInProgress(): boolean {
    return (this._registrationCallback != null);
  }

}

