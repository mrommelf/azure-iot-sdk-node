// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

import { RestApiClient, Http as Base } from 'azure-iot-http-base';
import { X509, SharedAccessSignature } from 'azure-iot-common';
import * as Provisioning from 'azure-device-provisioning-client';
import * as dbg from 'debug';
const debug = dbg('azure-device-provisioning:transport-http');

const _defaultHeaders = {
  'Accept' : 'application/json',
  'Content-Type' : 'application/json; charset=utf-8'
};

export class Http extends Provisioning.StateMachine implements Provisioning.Transport {
  private _httpTimeout: number = 4000;
  private _restApiClient: RestApiClient;
  private _httpBase: Base;
  private _config: Provisioning.Config;

  /**
   * @private
   * @constructor
   * @param config The configuration object.
   */
  // TODO: update SRS for new constructor parameters
  /* Codes_SRS_NODE_PROVISIONING_HTTP_18_001: [ The `Http` constructor shall accept the following properties:
  - `idScope` - a string specifiying the scope of the provisioning operations,
  - `registrationId` - the registration id for the specific device ] */
  constructor(config: Provisioning.Config,  httpBase?: Base) {
    super();

    if (!config.serviceHostName) config.serviceHostName = 'global.azure-devices-provisioning.net';

    this._config = config;
    this._httpBase = httpBase || new Base();
  }


 _doConnectForFsm(callback: (err?: Error) => void): void {
   // nothing to do here
   callback();
  }

  _doDisconnectForFsm(callback: (err?: Error) => void): void {
   // nothing to do here
   callback();
  }

  _doFirstRegistrationRequestForFsm(registrationId: string, authorization: SharedAccessSignature | X509 | string, requestBody: any, forceRegistration: boolean, callback: (err?: Error, responseBody?: any, result?: any, pollingInterval?: number) => void): void {

    debug('submitting PUT for ' + registrationId);
    debug(JSON.stringify(requestBody));

    if ((authorization instanceof SharedAccessSignature) || (typeof authorization === 'string')) {
      this._restApiClient = new RestApiClient({ 'host' : this._config.serviceHostName , 'sharedAccessSignature' : authorization},  this._config.userAgent, this._httpBase);
    } else {
      this._restApiClient = new RestApiClient({ 'host' : this._config.serviceHostName , 'x509' : authorization}, this._config.userAgent, this._httpBase);
    }

    /* update Codes_SRS_NODE_PROVISIONING_HTTP_18_009: [ `register` shall PUT the registration request to 'https://global.azure-devices-provisioning.net/{idScope}/registrations/{registrationId}/register' ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_005: [ The registration request shall include the current `api-version` as a URL query string value named 'api-version'. ] */
    let path: string = '/' + this._config.idScope + '/registrations/' + registrationId + '/register?api-version=' + this._apiVersion;

    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_008: [ If `forceRegistration` is specified, the registration request shall include this as a query string value named 'forceRegistration' ] */
    if (forceRegistration) {
      path += '&forceRegistration=true';
    }

    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_006: [ The registration request shall specify the following in the Http header:
      Accept: application/json
      Content-Type: application/json; charset=utf-8 ] */
    let httpHeaders = JSON.parse(JSON.stringify(_defaultHeaders));

    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_007: [ If an `authorization` string is specifed, it shall be URL encoded and included in the Http Authorization header. ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_011: [ If the registration request times out, `register` shall call the `callback` with the lower level error] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_012: [ If the registration response contains a body, `register` shall deserialize this into an object. ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_013: [ If registration response body fails to deserialize, `register` will throw an `SyntaxError` error. ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_014: [ If the registration response has a failed status code, `register` shall use `translateError` to translate this to a common error object and pass this into the `callback` function along with the deserialized body of the response. ] */
    this._restApiClient.executeApiCall('PUT', path, httpHeaders, requestBody, this._httpTimeout, (err: Error, responseBody?: any, result?: any) => {
      if (err) {
        debug('error executing PUT: ' + err.toString());
        callback(err);
      } else {
        debug('PUT response received:');
        debug(JSON.stringify(responseBody));
        callback(null, responseBody, result, this._config.defaultPollingInterval);
      }
    });

  }

  _doOperationStatusQueryForFsm(registrationId: string, operationId: string, callback: (err?: Error, responseBody?: any, result?: any, pollingInterval?: number) => void): void {
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_022: [ operation status request polling shall be a GET operation sent to 'https://global.azure-devices-provisioning.net/{idScope}/registrations/{registrationId}/operations/{operationId}' ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_037: [ The operation status request shall include the current `api-version` as a URL query string value named 'api-version'. ] */
    let path: string = '/' + this._config.idScope + '/registrations/' + registrationId + '/operations/' + operationId + '?api-version=' + this._apiVersion;

    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_020: [ The operation status request shall have the following in the Http header:
      Accept: application/json
      Content-Type: application/json; charset=utf-8 ] */
    let httpHeaders = JSON.parse(JSON.stringify(_defaultHeaders));

    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_021: [ If an `authorization` string is specifed, it shall be URL encoded and included in the Http Authorization header of the operation status request. ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_023: [ If the operation status request times out, `register` shall stop polling and call the `callback` with with the lower level error ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_024: [ `register` shall deserialize the body of the operation status response into an object. ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_025: [ If the body of the operation status response fails to deserialize, `register` will throw a `SyntaxError` error. ] */
    /* Codes_SRS_NODE_PROVISIONING_HTTP_18_026: [ If the operation status response contains a failure status code, `register` shall stop polling and call the `callback` with an error created using `translateError`. ] */
    debug('executing GET for operation status query');
    this._restApiClient.executeApiCall('GET', path, httpHeaders, {}, this._httpTimeout, (err: Error, responseBody?: any, result?: any) => {
      if (err) {
        debug('error executing GET: ' + err.toString());
        callback(err, null);
      } else {
        debug('GET response received:');
        debug(JSON.stringify(responseBody));
        callback(null, responseBody, result, this._config.defaultPollingInterval);
      }
    });
  }

  _getErrorFromResultForFsm(result: any): any {
    return new Error();
  }

}



