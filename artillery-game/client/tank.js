window.AstroGliders = window.AstroGliders || {};

AstroGliders.Tank = function (isPlayer, x, y, rotation, game, matchId, playerId) {
    // The player and its settings
    tank = game.add.sprite(x, y, 'diamond');
    tank.anchor.setTo(0.5, 0.5);

    tank.enableBody = true;

    //  We need to enable physics on the player
    game.physics.arcade.enable(tank);

    //  Player physics properties. Give the little guy a slight bounce.
    tank.body.bounce.y = 0.2;
    tank.body.collideWorldBounds = true;

    tank.rotation = rotation;

    tank.isPlayer = isPlayer;

    if (isPlayer) {
        tank.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        tank.fireButton.onDown.add(Fire, tank);
        tank.rotateRight = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        tank.rotateLeft = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        tank.active = true;
    }

    tank.game = game;

    tank.Update = Update;
    tank.Shoot = Shoot;
    tank.RotateTo = RotateTo;
    tank.SetShotVelocity = SetShotVelocity;
    tank.RotateToDestination = RotateToDestination;

    tank.shots = [];

    tank.matchId = matchId;
    tank.playerId = playerId;

    tank.hasQueuedShot = false;
    tank.shouldRotate = false;

    return tank;
}
AstroGliders.Tank.prototype = new AstroGliders.Tank;

function Fire() {
    if (this.active) {
        this.desiredShotVelocity = new Phaser.Point(Math.cos(this.rotation + Math.PI / 2.0) * 500, Math.sin(this.rotation + Math.PI / 2.0) * 500);

        this.hasQueuedShot = true;
        Actions.insert({ matchId: this.matchId, playerId: this.playerId, actionType: ActionTypeEnum.PlayerShoot, velocity: this.desiredShotVelocity, rotation: this.rotation });

        this.active = false;
    }
}

function RotateTo(tankRotation) {
    this.shouldRotate = true;

    this.desiredRotation = tankRotation;
}

function SetShotVelocity(shotVelocity) {
    this.desiredShotVelocity = shotVelocity;
    this.hasQueuedShot = true;
}

function Shoot() {
    shot = this.game.add.sprite(this.x, this.y, 'star');

    this.shots.push(shot);

    shot.anchor.setTo(0.5, 0.5);

    this.game.physics.arcade.enable(shot);

    shot.body.gravity.y = 200;

    shot.enableBody = true;

    shot.body.velocity.set(this.desiredShotVelocity.x, this.desiredShotVelocity.y);

    this.hasQueuedShot = false;
}

function RotateToDestination() {
    var rotationDifference = this.rotation - this.desiredRotation;

    if (Math.abs(rotationDifference) < 0.05) {
        this.rotation = this.desiredRotation;
        this.shouldRotate = false;
    }
    else if (rotationDifference > 0) {
        this.rotation -= 0.03;
    }
    else {
        this.rotation += 0.03;
    }
}

function ShotHit() {
    console.log("shot hit");
}

function Update(otherPlayer, platforms) {

    if (this.shouldRotate) {
        this.RotateToDestination();
    }

    if (this.shots != null && this.shots.length > 0) {

        for (i = 0; i < this.shots.length; ++i) {
            // we hit the other tank
            if (this.game.physics.arcade.overlap(this.shots[i], otherPlayer)) {
                this.shots[i].kill();
                this.shots.splice(i, 1);
                otherPlayer.kill();

                if (this.isPlayer) {
                    // this player wins!
                    Actions.insert({ matchId: this.matchId, actionType: ActionTypeEnum.GameOver, winningPlayerId: this.playerId, losingPlayerId: "" });
                }

                continue;
            }

            // we hit the ground and the shot was travelling downward
            if ((this.shots[i].body.velocity.y > 0 && this.game.physics.arcade.overlap(this.shots[i], platforms))
                || this.shots[i].position.y > 720) {
                this.shots[i].kill();
                this.shots.splice(i, 1);
                continue;
            }

            // we hit ourself
            var betweenX = this.position.x - this.shots[i].x;
            var betweenY = this.position.y - this.shots[i].y;

            var between = new Phaser.Point(betweenX, betweenY);

            if (this.shots[i].body.velocity.dot(between) > 0 && this.game.physics.arcade.overlap(this.shots[i], this)) {
                this.kill();
                this.shots[i].kill();
                this.shots.splice(i, 1);

                if (this.isPlayer) {
                    // this player loses :(
                    Actions.insert({ matchId: this.matchId, actionType: ActionTypeEnum.GameOver, winningPlayerId: "", losingPlayerId: this.playerId });
                }

                continue;
            }
        }
    }

    if (this.active) {
        if (this.rotateRight.isDown) {
            this.body.rotation -= 1;
        }
        if (this.rotateLeft.isDown) {
            this.body.rotation += 1;
        }
    }
}