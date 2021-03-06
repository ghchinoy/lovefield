/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
goog.provide('lf.Global');

goog.require('goog.structs.Map');
goog.require('lf.Exception');



/**
 * Global context for Lovefield services.
 * @constructor @struct
 */
lf.Global = function() {
  /** @private {!goog.structs.Map.<string, !Object>} */
  this.services_ = new goog.structs.Map();
};


/** @private {?lf.Global} */
lf.Global.instance_;


/** @return {!lf.Global} */
lf.Global.get = function() {
  if (!lf.Global.instance_) {
    lf.Global.instance_ = new lf.Global();
  }
  return lf.Global.instance_;
};


/** Resets the global instance, useful for testing. */
lf.Global.reset = function() {
  lf.Global.instance_ = null;
};


/**
 * @template T
 * @param {!lf.service.ServiceId.<T>} serviceId
 * @param {!T} service
 * @return {!T} The registered service for chaining.
 */
lf.Global.prototype.registerService = function(serviceId, service) {
  this.services_.set(serviceId.toString(), service);
  return service;
};


/**
 * @template T
 * @param {!lf.service.ServiceId.<T>} serviceId
 * @return {!T} The registered service or throws if not registered yet.
 * @throws {!lf.Exception}
 */
lf.Global.prototype.getService = function(serviceId) {
  var service = this.services_.get(serviceId.toString(), null);
  if (service == null) {
    throw new lf.Exception(lf.Exception.Type.NOT_FOUND, serviceId.toString());
  }
  return service;
};


/**
 * @param {!lf.service.ServiceId} serviceId
 * @return {boolean} Whether the service is registered or not.
 */
lf.Global.prototype.isRegistered = function(serviceId) {
  return this.services_.containsKey(serviceId.toString());
};
