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
goog.provide('lf.proc.Relation');
goog.provide('lf.proc.RelationEntry');

goog.require('goog.asserts');
goog.require('goog.structs.Map');
goog.require('goog.structs.Set');
goog.require('lf.Row');

goog.forwardDeclare('lf.schema.Column');



/**
 * A Relation instance represents the input/output of a query execution step. It
 * is passed from one step to the next one during query execution.
 * @constructor
 * @struct
 *
 * @param {!Array.<!lf.proc.RelationEntry>} entries
 * @param {!Array.<string>} tables The names of the source tables of this
 *     relation.
 */
lf.proc.Relation = function(entries, tables) {
  /**
   * @type {!Array.<!lf.proc.RelationEntry>}
   * @const
   */
  this.entries = entries;

  /** @private {!goog.structs.Set.<string>} */
  this.tables_ = new goog.structs.Set(tables);
};


/**
 * @param {!lf.proc.Relation} relation The relation to check against.
 * @return {boolean} Whether this relation is compatible with the given
 *     relation, in terms of calculating union/intersection.
 */
lf.proc.Relation.prototype.isCompatible = function(relation) {
  return this.tables_.equals(relation.tables_);
};


/**
 * Asserts that two relations are compatible with regards to union/intersection
 * operations.
 * @param {!lf.proc.Relation} lhs The relation to check against.
 * @param {!lf.proc.Relation} rhs The relation to check against.
 * @private
 */
lf.proc.Relation.assertCompatible_ = function(lhs, rhs) {
  goog.asserts.assert(
      lhs.isCompatible(rhs),
      'Intersection/union operations only apply to compatible relations.');
};


/**
 * @return {!Array.<string>} The names of all source tables of this relation.
 */
lf.proc.Relation.prototype.getTables = function() {
  return this.tables_.getValues();
};


/**
 * @return {boolean} Whether prefixes have been applied to the payloads in this
 *     relation.
 */
lf.proc.Relation.prototype.isPrefixApplied = function() {
  return this.tables_.getCount() > 1;
};


/** @return {!Array.<!lf.Row>} */
lf.proc.Relation.prototype.getPayloads = function() {
  return this.entries.map(function(entry) {
    return entry.row.payload();
  });
};


/** @return {!Array.<number>} */
lf.proc.Relation.prototype.getRowIds = function() {
  return this.entries.map(function(entry) {
    return entry.row.id();
  });
};


/** @private {?lf.proc.Relation} */
lf.proc.Relation.emptyRelation_ = null;


/**
 * Creates an empty Relation instance. Since a relation is immutable, a
 * singleton "empty" relation instance is lazily instantiated and returned in
 * all subsequent calls.
 * @return {!lf.proc.Relation}
 */
lf.proc.Relation.createEmpty = function() {
  if (goog.isNull(lf.proc.Relation.emptyRelation_)) {
    lf.proc.Relation.emptyRelation_ = new lf.proc.Relation([], []);
  }

  return lf.proc.Relation.emptyRelation_;
};


/**
 * Finds the intersection of a given list of relations.
 * @param {!Array.<!lf.proc.Relation>} relations The instances to be
 *     intersected.
 * @return {!lf.proc.Relation} A relation containing only those entries that
 *     exist in all input relations.
 */
lf.proc.Relation.intersect = function(relations) {
  if (relations.length == 0) {
    return lf.proc.Relation.createEmpty();
  }

  var totalCount = relations.reduce(function(soFar, relation) {
    lf.proc.Relation.assertCompatible_(relations[0], relation);
    return soFar + relation.entries.length;
  }, 0);
  var allEntries = new Array(totalCount);

  var entryCounter = 0;
  // Creating a map [entry.id --> entry] for each relation, and at the same time
  // populating the allEntries array.
  var relationMaps = relations.map(function(relation) {
    var map = new goog.structs.Map();
    relation.entries.forEach(function(entry) {
      allEntries[entryCounter++] = entry;
      map.set(entry.id, entry);
    });
    return map;
  });

  var intersection = new goog.structs.Map();
  for (var i = 0; i < allEntries.length; i++) {
    var existsInAll = relationMaps.every(function(relation) {
      return relation.containsKey(allEntries[i].id);
    });
    if (existsInAll) {
      intersection.set(allEntries[i].id, allEntries[i]);
    }
  }

  return new lf.proc.Relation(
      intersection.getValues(), relations[0].tables_.getValues());
};


/**
 * Finds the union of a given list of relations.
 * @param {!Array.<!lf.proc.Relation>} relations The instances to be
 *     intersected.
 * @return {!lf.proc.Relation} A relation containing all entries from all input
 *     relations.
 */
lf.proc.Relation.union = function(relations) {
  if (relations.length == 0) {
    return lf.proc.Relation.createEmpty();
  }

  var union = new goog.structs.Map();
  relations.forEach(function(relation) {
    lf.proc.Relation.assertCompatible_(relations[0], relation);
    relation.entries.forEach(function(entry) {
      union.set(entry.id, entry);
    });
  });

  return new lf.proc.Relation(
      union.getValues(), relations[0].tables_.getValues());
};


/**
 * Creates an lf.proc.Relation instance from a set of lf.Row instances.
 * @param {!Array.<!lf.Row>} rows
 * @param {!Array.<string>} tables The names of the tables where these rows
 *     belong.
 * @return {!lf.proc.Relation}
 */
lf.proc.Relation.fromRows = function(rows, tables) {
  var isPrefixApplied = tables.length > 1;
  var entries = rows.map(function(row) {
    return new lf.proc.RelationEntry(row, isPrefixApplied);
  });

  return new lf.proc.Relation(entries, tables);
};



/**
 * Each RelationEntry represents a row that is passed from one execution step
 * to another and does not necessarilly correspond to a physical row in a DB
 * table (as it can be the result of a cross-product/join operation).
 * @constructor
 * @struct
 *
 * @param {!lf.Row} row
 * @param {boolean} isPrefixApplied Whether the payload in this entry is using
 *     prefixes for each attribute. This happens when this entry is the result
 *     of a relation join.
 */
lf.proc.RelationEntry = function(row, isPrefixApplied) {
  /** @type {!lf.Row} */
  this.row = row;

  /** @type {number} */
  this.id = lf.proc.RelationEntry.getNextId_();

  /** @private {boolean} */
  this.isPrefixApplied_ = isPrefixApplied;
};


/**
 * The ID to assign to the next entry that will be created.
 * @private {number}
 */
lf.proc.RelationEntry.id_ = 0;


/**
 * @return {number} The next unique entry ID to use for creating a new instance.
 * @private
 */
lf.proc.RelationEntry.getNextId_ = function() {
  return lf.proc.RelationEntry.id_++;
};


/**
 * @param {!lf.schema.Column} column The column to be retrieved.
 * @return {*} The value of the requested column for this entry.
 */
lf.proc.RelationEntry.prototype.getField = function(column) {
  if (this.isPrefixApplied_) {
    return this.row.payload()[
        column.getTable().getName()][column.getName()];
  } else {
    return this.row.payload()[column.getName()];
  }
};


/**
 * Sets the value of the given field on this entry.
 * @param {!lf.schema.Column} column The column to be retrieved.
 * @param {*} value The value to be set.
 */
lf.proc.RelationEntry.prototype.setField = function(column, value) {
  var alias = column.getAlias();
  if (goog.isDefAndNotNull(alias)) {
    this.row.payload()[alias] = value;
    return;
  }

  if (this.isPrefixApplied_) {
    var containerObj = this.row.payload()[column.getTable().getName()];
    if (!goog.isDefAndNotNull(containerObj)) {
      containerObj = {};
      this.row.payload()[column.getTable().getName()] = containerObj;
    }
    containerObj[column.getName()] = value;
  } else {
    this.row.payload()[column.getName()] = value;
  }
};


/**
 * Combines two entries into a single entry.
 * @param {!lf.proc.RelationEntry} leftEntry
 * @param {!Array.<string>} leftEntryTables The names of all source tables for
 *     the attributes in leftEntry.
 * @param {!lf.proc.RelationEntry} rightEntry
 * @param {!Array.<string>} rightEntryTables The names of all source tables for
 *     the attributes in rightEntry.
 * @return {!lf.proc.RelationEntry} The combined entry.
 */
lf.proc.RelationEntry.combineEntries = function(
    leftEntry, leftEntryTables, rightEntry, rightEntryTables) {
  var result = {};

  var mergeEntry = function(entry, entryTables) {
    if (entry.isPrefixApplied_) {
      var payload = entry.row.payload();
      for (var prefix in payload) {
        result[prefix] = payload[prefix];
      }
    } else {
      // Since the entry is not prefixed, all attributes come from a single
      // table.
      result[entryTables[0]] = entry.row.payload();
    }
  };

  mergeEntry(leftEntry, leftEntryTables);
  mergeEntry(rightEntry, rightEntryTables);

  var row = new lf.Row(lf.Row.DUMMY_ID, result);
  return new lf.proc.RelationEntry(row, true);
};
