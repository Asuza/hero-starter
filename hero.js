let moves = {
    spoonyBard: function (gameData, helpers) {
        let hero = gameData.activeHero;
        let enemy = helpers.getNearestEnemy(gameData);
        let diamondMine = helpers.getNearestNonTeamDiamondMine(gameData);
        let healthWell = helpers.getNearestHealthWell(gameData);
        let teamMember = helpers.getNearestTeamMember(gameData);
        let diamondMineIsCloserThanEnemy = (diamondMine.isReachable() && diamondMine.getDistance() <= enemy.getDistance());

        if (hero.health > 30 && enemy.canBeKilledNow()) {
            return enemy.getDirection();
        }

        if (teamMember.canBeHealedNow()) {
            return teamMember.getDirection();
        }

        if (hero.health <= 90 && healthWell.getDistance() === 1) {
            return healthWell.getDirection();
        } else if (hero.health <= 60 && healthWell.isReachable()) {
            return healthWell.getDirection();
        } else if (!enemy.isReachable() || diamondMineIsCloserThanEnemy) {
            return diamondMine.getDirection();
        }

        // Nearby diamond mines are secure, so go on the offensive.
        let weakerEnemy = helpers.getNearestWeakerEnemy(gameData);
        if (weakerEnemy.getDistance() <= enemy.getDistance()) {
            return weakerEnemy.getDirection();
        } else if (enemy) {
            return enemy.getDirection();
        }
    }
};

//  Set our heros strategy
module.exports = moves.spoonyBard;
