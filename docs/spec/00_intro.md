# Lovefield Specification

# 0. Introduction
## Goal
WebSQL is deprecated, and IndexedDB does not offer a query engine, which leaves both web and Chrome app developers to re-create their own domain-specific or generic query engines. The goal of Lovefield is to fill in that gap.

## Basic Assumptions
* Lovefield is designed to handle database whose dataset is smaller than X (current bound is 2GB) but large enough to need a structural query engine.
* Lovefield will be delivered in the form of JavaScript initially.
* Lovefield will polyfill features that require browser support. We will pursue standardization of these features in the future.
* Lovefield provides a limited subset of SQL-03. Lovefield will not support features such as cursors, view, subquery, and triggers.
* Lovefield uses existing storage technologies (i.e. IndexedDB) to build its data store. Since there is not a way to prevent user from accessing the data store, it’s the developer’s responsibility to ensure that any data accessed from Lovefield query engine shall be treated as ‘unsafe’ and sanitized in some way before being sent back to the server.
* Lovefield assumes existence of Promise and IndexedDB. For IE, Promises are poly-filled by Closure library.

## Requirements
1. SQL-like relational database query engine that covers most use cases supported by WebSQL. 
2. Closure-compiler compliant: generated code and the library shall be compilable by Closure compiler.
3. Chrome Apps v2 compliant: can be used within Chrome Apps, requires only storage access privilege.
4. Drop-in library.
5. Can be used as a component.
6. Can be used by both Closure and jQuery.
7. Copy deployment: users should be able to just copy the JS to their project and start using it without knowing the internals.
8. There shall not be any side-effect of using this library.
9. Cross-browser support: Lovefield shall be compatible with Chrome, Firefox, and Internet Explorer. Safari support will come in near future after it implementing usable IndexedDB.
10. Low-end device support: the library itself shall be able to run on low-CPU-power, low memory devices (e.g. HP Chromebook 11).
11. Stretch goal: the memory requirement shall be independent of the data set managed.

## Designed Workflow
The designed workflow follows the philosophy of protobuf, which already proved to have a good perception from developers. The general idea is:

1. User creates table schema in a YAML file.
2. Bundling
  a. Schema Parser And Code-Generator (SPAC) parses the YAML schema and generate JavaScript source files.
  b. Use Closure compiler to merge SPAC generated code and Lovefield Library together into a bundled file.
3. User writes code using the classes/functions provided in Lovefield bundle.
4. User deploys the bundled file and their own code to their web site or as a Chrome app.
