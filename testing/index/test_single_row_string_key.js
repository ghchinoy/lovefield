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
goog.provide('lf.testing.index.TestSingleRowStringKey');

goog.require('goog.testing.jsunit');
goog.require('lf.index.KeyRange');
goog.require('lf.testing.index.TestIndex');



/**
 * @extends {lf.testing.index.TestIndex}
 * @constructor
 * @struct
 *
 * @param {!function():!lf.index.Index} constructorFn The function to call
 *     before every test case, in order to get a newly created index.
 */
lf.testing.index.TestSingleRowStringKey = function(constructorFn) {
  lf.testing.index.TestSingleRowStringKey.base(
      this, 'constructor', constructorFn);
};
goog.inherits(
    lf.testing.index.TestSingleRowStringKey,
    lf.testing.index.TestIndex);


/** @override */
lf.testing.index.TestSingleRowStringKey.prototype.testAddGet =
    function(index) {
  // Test add / get.
  for (var i = -5; i < 5; ++i) {
    var key = 'key' + i.toString();
    var value = i;
    index.add(key, value);
    var actualValue = index.get(key)[0];
    assertEquals(value, actualValue);
  }
};


/** @override */
lf.testing.index.TestSingleRowStringKey.prototype.testGetRangeCost =
    function(index) {
  this.populateIndex_(index);

  lf.testing.index.TestSingleRowStringKey.keyRanges.forEach(
      function(keyRange, counter) {
        var expectedResult = lf.testing.index.TestSingleRowStringKey.
            getRangeExpectations[counter];
        lf.testing.index.TestIndex.assertGetRangeCost(
            index, keyRange, expectedResult);
      });
};


/** @override */
lf.testing.index.TestSingleRowStringKey.prototype.testRemove =
    function(index) {
  this.populateIndex_(index);
  var key = 'key-1';
  assertTrue(index.get(key).length > 0);

  index.remove(key);
  assertArrayEquals([], index.get(key));

  var keyRange = lf.index.KeyRange.only(key);
  assertArrayEquals([], index.getRange(keyRange));
  assertEquals(0, index.cost(keyRange));
};


/** @override */
lf.testing.index.TestSingleRowStringKey.prototype.testSet = function(index) {
  this.populateIndex_(index);
  index.remove('key-1');
  assertEquals(9, index.getRange().length);

  for (var i = -5; i < 5; ++i) {
    var key = 'key' + i.toString();
    var value = 30 + i;
    index.set(key, value);
    var actualValue = index.get(key)[0];
    assertEquals(value, actualValue);
  }

  assertEquals(10, index.getRange().length);
};


/**
 * Populates the index with dummy data to be used for al tests.
 * @param {!lf.index.Index} index
 * @private
 */
lf.testing.index.TestSingleRowStringKey.prototype.populateIndex_ =
    function(index) {
  for (var i = -5; i < 5; ++i) {
    var key = 'key' + i.toString();
    var value = i;
    index.add(key, value);
  }
};


/**
 * The key ranges to be used for testing.
 * @type {!Array.<!lf.index.KeyRange|undefined>}
 */
lf.testing.index.TestSingleRowStringKey.keyRanges = [
  // get all.
  undefined,
  lf.index.KeyRange.all(),
  // get one key
  lf.index.KeyRange.only('key-3'),
  // lower bound.
  lf.index.KeyRange.lowerBound('key0'),
  lf.index.KeyRange.lowerBound('key0', true),
  // upper bound.
  lf.index.KeyRange.upperBound('key0'),
  lf.index.KeyRange.upperBound('key0', true),
  // both lower and upper bound.
  new lf.index.KeyRange('key-1', 'key-5', false, false),
  new lf.index.KeyRange('key-1', 'key-5', true, false),
  new lf.index.KeyRange('key-1', 'key-5', false, true),
  new lf.index.KeyRange('key-1', 'key-5', true, true)
];


/**
 * The expected results for all key ranges in
 * lf.testing.index.TestSingleRowStringKeyCases.keyRanges.
 * @type {!Array.<!Array.<number>>}
 */
lf.testing.index.TestSingleRowStringKey.getRangeExpectations = [
  // get all.
  [-1, -2, -3, -4, -5, 0, 1, 2, 3, 4],
  [-1, -2, -3, -4, -5, 0, 1, 2, 3, 4],
  // get one key
  [-3],
  // lower bound.
  [0, 1, 2, 3, 4],
  [1, 2, 3, 4],
  // upper bound.
  [-1, -2, -3, -4, -5, 0],
  [-1, -2, -3, -4, -5],
  // both lower and upper bound.
  [-1, -2, -3, -4, -5],
  [-2, -3, -4, -5],
  [-1, -2, -3, -4],
  [-2, -3, -4]
];
