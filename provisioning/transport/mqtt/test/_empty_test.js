// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var Mqtt = require('../lib/mqtt.js').Mqtt;

var fakeConfig = {
 idScope: '__fake_scope__',
 registrationId: '__fake_reg_id__',
 userAgent: '__fake_agent__'
};

var fakeBase = {

};

describe('device client', function () {
  it ('has an empty test to satisfy npm scripts until actual tests are writtten', function(testCallback) {
    var mqtt = new Mqtt(fakeConfig, fakeBase);
    testCallback();
  });
});
