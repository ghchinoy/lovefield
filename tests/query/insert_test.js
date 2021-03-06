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
goog.setTestOnly();
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');
goog.require('hr.db');
goog.require('lf.query.InsertBuilder');
goog.require('lf.testing.hrSchemaSampleData');


/** @type {!goog.testing.AsyncTestCase} */
var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall('Insert');


/** @type {!hr.db.Database} */
var db;


function setUp() {
  asyncTestCase.waitForAsync('setUp');
  hr.db.getInstance(
      /* opt_onUpgrade*/ undefined,
      /* opt_volatile */ true).then(function(database) {
    db = database;
    asyncTestCase.continueTesting();
  }, fail);
}


/**
 * Tests that Insert#exec() fails if into() has not been called first.
 */
function testExec_ThrowsMissingInto() {
  asyncTestCase.waitForAsync('testExec_ThrowsMissingInto');
  var query = new lf.query.InsertBuilder();
  var job = lf.testing.hrSchemaSampleData.generateSampleJobData(db);
  query.values([job]);
  query.exec().then(
      fail,
      function(e) {
        asyncTestCase.continueTesting();
      });
}


/**
 * Tests that Insert#exec() fails if values() has not been called first.
 */
function testExec_ThrowsMissingValues() {
  asyncTestCase.waitForAsync('testExec_ThrowsMissingValues');
  var query = new lf.query.InsertBuilder();
  query.into(db.getSchema().getJob());
  query.exec().then(
      fail,
      function(e) {
        asyncTestCase.continueTesting();
      });
}


/**
 * Tests that Insert#exec() fails if allowReplace is true, for a table that has
 * no primary key.
 */
function testExec_ThrowsNoPrimaryKey() {
  asyncTestCase.waitForAsync('testExec_ThrowsNoPrimaryKey');

  var jobHistoryRow = lf.testing.hrSchemaSampleData.
      generateSampleJobHistoryData(db);
  var query = new lf.query.InsertBuilder(/* allowReplace */ true);

  query.
      into(db.getSchema().getJobHistory()).
      values([jobHistoryRow]);
  query.exec().then(
      fail,
      function(e) {
        asyncTestCase.continueTesting();
      });
}


/**
 * Tests that Insert#values() fails if values() has already been called.
 */
function testValues_ThrowsAlreadyCalled() {
  var query = new lf.query.InsertBuilder();

  var job = lf.testing.hrSchemaSampleData.generateSampleJobData(db);
  var buildQuery = function() {
    query.values([job]).values([job]);
  };

  assertThrows(buildQuery);
}


/**
 * Tests that Insert#into() fails if into() has already been called.
 */
function testInto_ThrowsAlreadyCalled() {
  var query = new lf.query.InsertBuilder();

  var buildQuery = function() {
    var jobTable = db.getSchema().getJob();
    query.into(jobTable).into(jobTable);
  };

  assertThrows(buildQuery);
}
