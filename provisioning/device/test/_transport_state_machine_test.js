// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var TransportStateMachine = require('../lib/transport_state_machine').TransportStateMachine;
var sinon = require('sinon');
var assert = require('chai').assert;

var makeNewMachine = function() {
  var machine = new TransportStateMachine();
  machine._doConnectForFsm = sinon.stub().callsArg(0);
  machine._doDisconnectForFsm = sinon.stub().callsArg(0);
  machine._doFirstRegistrationRequestForFsm = sinon.stub().callsArg(4);
  machine._doOperationStatusQueryForFsm = sinon.stub().callsArg(2);
  machine._getErrorFromResultForFsm = sinon.stub().callsArg(0);
  return machine;
};

var fakeErrorText = '__FAKE_ERROR__';

describe('state machine', function () {
  this.timeout(100);

  describe('connect', function() {
    it ('calls _doConnectForFsm', function(testCallback) {
      var machine = makeNewMachine();
      machine.connect(function(err) {
        assert(machine._doConnectForFsm.calledOnce);
        assert.isNotOk(err);
        testCallback();
      });
    });

    it ('fails and disconnects if _doConnectForFsm fails', function(testCallback) {
      var machine = makeNewMachine();
      machine._doConnectForFsm = sinon.stub().callsArgWith(0, new Error(fakeErrorText));
      machine.connect(function(err) {
        assert(machine._doConnectForFsm.calledOnce);
        assert(machine._doDisconnectForFsm.calledOnce);
        assert.isOk(err);
        assert.typeOf(err, 'Error');
        assert.equal(err.message, fakeErrorText);
        testCallback();
      });

      it ('does nothing if called while connected', function(testCallback) {
        testCallback(new Error());
      });

      it ('doesn\'t complete until connection is complete if called while connecting', function(testCallback) {
        testCallback(new Error());
      });

      it ('does nothing if called while executing first request', function(testCallback) {
        testCallback(new Error());
      });

      it ('does nothing if called while waiting to poll', function(testCallback) {
        testCallback(new Error());
      });

      it ('does nothing if called while executing first request', function(testCallback) {
        testCallback(new Error());
      });

      it ('waits for disconnect to complete and then reconnects if called while disconnecting', function(testCallback) {
        testCallback(new Error());
      });

    });

  });

  describe('register', function() {
    describe('calls _doFirstRegistrationRequestForFsm', function() {
      it ('and returns failure if it fails', function(testCallback) {
        testCallback(new Error());
      });
      it ('and returns success if it succeeds with status==="Assigned"', function(testCallback) {
        testCallback(new Error());
      });
      it ('and starts polling if it succeeds with status==="Assigning"', function(testCallback) {
        testCallback(new Error());
      });
      it ('and returns failure if it succeeds with some other status', function(testCallback) {
        testCallback(new Error());
      });
      it ('and fires an operationStatus event if it succeeds', function(testCallback) {
        testCallback(new Error());
      });
    });

    describe ('then calls _doOperationStatusQueryForFsm', function() {
      it ('and returns failure if it fails', function(testCallback) {
        testCallback(new Error());
      });
      it ('and returns success if it succeeds with status==="Assigned"', function(testCallback) {
        testCallback(new Error());
      });
      it ('and continues polling if it succeeds with status==="Assigning"', function(testCallback) {
        testCallback(new Error());
      });
      it ('and returns failure if it succeeds with some other status', function(testCallback) {
        testCallback(new Error());
      });
      it ('and fires an operationStatus event if it succeeds', function(testCallback) {
        testCallback(new Error());
      });
    });

    it ('fails if called while sending the first request', function(testCallback) {
      testCallback(new Error());
    });
    it ('fails if called while waiting to poll', function(testCallback) {
      testCallback(new Error());
    });
    if ('fails if called while sending an operation status request', function(testCallback) {
      testCallback(new Error());
    });
  });


  describe('disconnect', function() {
    it ('does nothing if called while disconnected', function(testCallback) {
      testCallback(new Error());
    });
    describe ('calls _doDisconnectForFsm', function() {
      it ('if called while connected', function(testCallback) {
        testCallback(new Error());
      });
      it ('and causes register to fail if called while sending the first request', function(testCallback) {
        testCallback(new Error());
      });
      it ('and causes register to fail if called while waiting to poll', function(testCallback) {
        testCallback(new Error());
      });
      it ('and causes register to fail if called while sending an operation status request', function(testCallback) {
        testCallback(new Error());
      });
    });

  });

});
