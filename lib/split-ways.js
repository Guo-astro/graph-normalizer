'use strict';

var lineString = require('turf-linestring');

module.exports = function (ways) {
  // construct node hash
  // nodeHash is a hash of nodes => ways
  // each way represents a node "owner"
  var nodeHash = {};
  ways.forEach(function (way) {
    way.properties.refs.forEach(function (ref) {
      if (!nodeHash[ref]) nodeHash[ref] = {};

      nodeHash[ref][way.properties.id] = true;
    });
  });

  var splitWays = [];

  ways.forEach(function (way) {
    var splits = 0;
    var last = 0;
    var current = 0;

    way.properties.refs.forEach(function (ref, i) {
      current++;

      // ignore terminal nodes
      if (i > 0 && i < way.properties.refs.length - 1) {
        // find the number of ways that contain the node
        var ownerCount = Object.keys(nodeHash[ref]).length;

        // look for nodes with more than 1 owner
        if (ownerCount > 1) {
          // add front of split way to splitWays
          var waySlice = lineString(
            way.geometry.coordinates.slice(last, current),
            {
              id: way.properties.id + '!' + splits,
              refs: way.properties.refs.slice(last, current)
            }
          );

          // persist oneway and highway tags if they are present
          if (way.properties.hasOwnProperty('oneway')) waySlice.properties.oneway = way.properties.oneway;
          if (way.properties.hasOwnProperty('highway')) waySlice.properties.highway = way.properties.highway;

          splitWays.push(waySlice);

          splits++;
          last = i;
        }
      }
    });

    // add the remainder of the way
    if (last < current) {
      var waySlice = lineString(
        way.geometry.coordinates.slice(last, current),
        {
          id: way.properties.id + '!' + splits,
          refs: way.properties.refs.slice(last, current)
        }
      );

      // persist oneway and highway tags if they are present
      if (way.properties.hasOwnProperty('oneway')) waySlice.properties.oneway = way.properties.oneway;
      if (way.properties.hasOwnProperty('highway')) waySlice.properties.highway = way.properties.highway;

      splitWays.push(waySlice);
    }
  });

  return splitWays;
};