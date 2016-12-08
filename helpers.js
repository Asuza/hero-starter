var helpers = {};

// Returns false if the given coordinates are out of range
helpers.validCoordinates = function (board, distanceFromTop, distanceFromLeft) {
    return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
      distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
};

// Returns the tile [direction] (North, South, East, or West) of the given X/Y coordinate
helpers.getTileNearby = function (board, distanceFromTop, distanceFromLeft, direction) {

    // These are the X/Y coordinates
    var fromTopNew = distanceFromTop;
    var fromLeftNew = distanceFromLeft;

    // This associates the cardinal directions with an X or Y coordinate
    if (direction === 'North') {
        fromTopNew -= 1;
    } else if (direction === 'East') {
        fromLeftNew += 1;
    } else if (direction === 'South') {
        fromTopNew += 1;
    } else if (direction === 'West') {
        fromLeftNew -= 1;
    } else {
        return false;
    }

    // If the coordinates of the tile nearby are valid, return the tile object at those coordinates
    if (helpers.validCoordinates(board, fromTopNew, fromLeftNew)) {
        return board.tiles[fromTopNew][fromLeftNew];
    } else {
        return false;
    }
};

// Returns an object with certain properties of the nearest object we are looking for
helpers.findNearestObjectDirectionAndDistance = function (board, fromTile, tileCallback) {
    // Storage queue to keep track of places the fromTile has been
    var queue = [];

    // Keeps track of places the fromTile has been for constant time lookup later
    var visited = {};

    // Variable assignments for fromTile's coordinates
    var dft = fromTile.distanceFromTop;
    var dfl = fromTile.distanceFromLeft;

    // Stores the coordinates, the direction fromTile is coming from, and it's location
    var visitInfo = [dft, dfl, 'None', 'START'];

    // Just a unique way of storing each location we've visited
    visited[dft + '|' + dfl] = true;

    // Push the starting tile on to the queue
    queue.push(visitInfo);

    // While the queue has a length
    while (queue.length > 0) {

        // Shift off first item in queue
        var coords = queue.shift();

        // Reset the coordinates to the shifted object's coordinates
        dft = coords[0];
        dfl = coords[1];

        // Loop through cardinal directions
        var directions = ['North', 'East', 'South', 'West'];
        for (var i = 0; i < directions.length; i++) {

            // For each of the cardinal directions get the next tile...
            var direction = directions[i];

            // ...Use the getTileNearby helper method to do this
            var nextTile = helpers.getTileNearby(board, dft, dfl, direction);

            // If nextTile is a valid location to move...
            if (nextTile) {

                // Assign a key variable the nextTile's coordinates to put into our visited object later
                var key = nextTile.distanceFromTop + '|' + nextTile.distanceFromLeft;

                var isGoalTile = false;
                try {
                    isGoalTile = tileCallback(nextTile);
                } catch (err) {
                    isGoalTile = false;
                }

                // If we have visited this tile before
                if (visited.hasOwnProperty(key)) {
                    // Do nothing--this tile has already been visited
                    // Is this tile the one we want?
                } else if (isGoalTile) {

                    // This variable will eventually hold the first direction we went on this path
                    var correctDirection = direction;

                    // This is the distance away from the final destination that will be incremented in a bit
                    var distance = 1;

                    // These are the coordinates of our target tileType
                    var finalCoords = [nextTile.distanceFromTop, nextTile.distanceFromLeft];

                    // Loop back through path until we get to the start
                    while (coords[3] !== 'START') {

                        // Haven't found the start yet, so go to previous location
                        correctDirection = coords[2];

                        // We also need to increment the distance
                        distance++;

                        // And update the coords of our current path
                        coords = coords[3];
                    }

                    // Return object with the following pertinent info
                    var goalTile = nextTile;
                    goalTile.direction = correctDirection;
                    goalTile.distance = distance;
                    goalTile.coords = finalCoords;
                    return goalTile;

                // If the tile is unoccupied, then we need to push it into our queue
                } else if (nextTile.type === 'Unoccupied') {

                    queue.push([nextTile.distanceFromTop, nextTile.distanceFromLeft, direction, coords]);

                    // Give the visited object another key with the value we stored earlier
                    visited[key] = true;
                }
            }
        }
    }

    // If we are blocked and there is no way to get where we want to go, return false
    return false;
};

helpers.getNearestNonTeamDiamondMine = function (gameData, startTile) {
    startTile = (startTile || gameData.activeHero);

    return helpers.nearestTileFilter(gameData, function (tile) {
        return (tile.type === 'DiamondMine' && !tile.owner || tile.owner.team !== startTile.team);
    });
};

helpers.getNearestHealthWell = function (gameData) {
    return helpers.nearestTileFilter(gameData, function (tile) {
        return (tile.type === 'HealthWell');
    });
};

helpers.getNearestTeamMember = function (gameData, startTile) {
    startTile = (startTile || gameData.activeHero);

    return helpers.nearestTileFilter(gameData, function (tile) {
        return (tile.type === 'Hero' && tile.team === startTile.team);
    });
};

helpers.nearestTileFilter = function (gameData, filterFn) {
    var hero = gameData.activeHero,
        board = gameData.board,
        result,
        tileObj;

    result = helpers.findNearestObjectDirectionAndDistance(board, hero, filterFn);

    tileObj = (result || {});

    return {
        isReachable: function () {
            return !!result;
        },
        getDistance: function () {
            return tileObj.distance;
        },
        getDirection: function () {
            return tileObj.direction;
        },
        canBeKilledNow: function () {
            return (result && tileObj.health <= 30 && tileObj.distance === 1);
        },
        canBeHealedNow: function () {
            return (result && tileObj.health <= 60 && tileObj.distance === 1);
        }
    };
};

helpers.getNearestWeakerEnemy = function (gameData, startTile) {
    startTile = (startTile || gameData.activeHero);

    return helpers.nearestTileFilter(gameData, function (tile) {
        return (tile.type === 'Hero' && tile.team !== startTile.team && tile.health < startTile.health);
    });
};

helpers.getNearestEnemy = function (gameData, startTile) {
    startTile = (startTile || gameData.activeHero);

    return helpers.nearestTileFilter(gameData, function (tile) {
        return (tile.type === 'Hero' && tile.team !== startTile.team);
    });
};

/**
 * Searches for tiles from the starting tile, within the number of steps.
 * This method does NOT account for objects that may be in the way.
 * @param  {Game} gameData  The game data.
 * @param  {Object} [startTile=gameData.activeHero] A tile to start the search from.
 * @param  {Number} [steps=1]   The maximum number of steps to search.
 * @param  {Function} filterFn  A function to find tiles with. It is passed a
 *     single parameter containing the current tile. Return true to include the
 *     tile in the final results.
 * @param  {Object} [visited]   Used internally by this method.
 * @return {Array} The matching tiles.
 */
helpers.searchTiles = function (gameData, filterFn, steps, startTile, visited) {
    var tiles = gameData.board.tiles,
        matches = [],
        adjacentTiles = [],
        currentX,
        currentY,
        tileCoordinates,
        tile,
        adjacentTile,
        adjacentMatches;

    startTile = (startTile || gameData.activeHero);
    filterFn = (filterFn || function () {});
    visited = (visited || {});

    if (steps === undefined) {
        steps = 1;
    }

    currentX = startTile.distanceFromLeft;
    currentY = startTile.distanceFromTop;

    tile = tiles[currentX][currentY];
    tileCoordinates = currentX + ',' + currentY;


    if (!visited[tileCoordinates]) {
        visited[tileCoordinates] = true;

        if (filterFn(tile)) {
            tile.steps = steps;
            matches.push(tile);
        }
    }

    if (steps > 0) {

        steps--;

        if (helpers.isValidPoint(gameData, currentX, currentY - 1)) {
            adjacentTiles.push(tiles[currentX][currentY - 1]); // North
        }

        if (helpers.isValidPoint(gameData, currentX + 1, currentY)) {
            adjacentTiles.push(tiles[currentX + 1][currentY]); // East
        }

        if (helpers.isValidPoint(gameData, currentX, currentY + 1)) {
            adjacentTiles.push(tiles[currentX][currentY + 1]); // South
        }

        if (helpers.isValidPoint(gameData, currentX - 1, currentY)) {
            adjacentTiles.push(tiles[currentX - 1][currentY]); // West
        }

        for (var i = 0; i < adjacentTiles.length; i++) {
            adjacentTile = adjacentTiles[i];

            if (adjacentTile && !visited[adjacentTile.distanceFromLeft + ',' + adjacentTile.distanceFromTop]) {
                adjacentMatches = helpers.searchTiles(gameData, filterFn, steps, adjacentTile, visited);

                if (adjacentMatches.length) {
                    matches = matches.concat(adjacentMatches);
                }
            }
        }
    }

    return matches;
};

helpers.isValidPoint = function (gameData, x, y) {

    var size = gameData.board.lengthOfSide - 1;

    if (x < 0 || y < 0 || x > size || y > size) {
        return false;
    }

    return true;

};

module.exports = helpers;
