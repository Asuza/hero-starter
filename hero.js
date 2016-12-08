var moves = {
    spoonyBard: function (gameData, helpers) {
        var hero = gameData.activeHero,
            enemy = helpers.getNearestEnemy(gameData),
            diamondMine = helpers.getNearestNonTeamDiamondMine(gameData),
            healthWell = helpers.getNearestHealthWell(gameData),
            teamMember = helpers.getNearestTeamMember(gameData),
            diamondMineIsCloserThanEnemy = (diamondMine.isReachable() && diamondMine.getDistance() <= enemy.getDistance()),
            weakerEnemy;

        if (hero.health > 30 && enemy.canBeKilledNow()) {
            return enemy.getDirection();
        }

        if (teamMember.canBeHealedNow()) {
            return teamMember.getDirection();
        }

        if (hero.health <= 70 && healthWell.isReachable()) {
            return healthWell.getDirection();
        } else if (!enemy.isReachable() || diamondMineIsCloserThanEnemy) {
            return diamondMine.getDirection();
        }

        weakerEnemy = helpers.getNearestWeakerEnemy(gameData);

        // Nearby diamond mines are secure, so go on the offensive.
        if (weakerEnemy.getDistance() <= enemy.getDistance()) {
            return weakerEnemy.getDirection();
        } else if (enemy) {
            return enemy.getDirection();
        }
    }
};

//  Set our heros strategy
module.exports = moves.spoonyBard;
