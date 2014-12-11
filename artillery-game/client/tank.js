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
    tank.power = 100;

    tank.isPlayer = isPlayer;

    if (isPlayer) {
        tank.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        tank.fireButton.onDown.add(Fire, tank);
        tank.rotateRight = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        tank.rotateLeft = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

        tank.powerUp = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        tank.powerDown = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);

        tank.powerText = game.add.text(16, 16, 'Power: ' + (tank.power).toString(), { fontSize: '32px', fill: '#000' });
        tank.angleText = game.add.text(16, 48, 'Angle: ' + (Math.round(((tank.rotation + Math.PI) * 57.2957795) * 10) / 10.0).toString(), { fontSize: '32px', fill: '#000' });

        tank.active = true;
    }

    tank.game = game;

    tank.Update = Update;
    tank.Shoot = Shoot;
    tank.StartRotating = StartRotating;
    tank.SetRotationDestination = SetRotationDestination;
    tank.SetShotVelocity = SetShotVelocity;
    tank.RotateToDestination = RotateToDestination;

    tank.shots = [];

    tank.matchId = matchId;
    tank.playerId = playerId;

    tank.hasQueuedShot = false;
    tank.shouldRotate = false;
    tank.isRotating = false;

    tank.dead = false;
    tank.shotCompleted = false;

    return tank;
}
AstroGliders.Tank.prototype = new AstroGliders.Tank;

function Fire() {
    if (this.active) {
        this.desiredShotVelocity = new Phaser.Point(Math.cos(this.rotation + Math.PI / 2.0) * this.power * 5, Math.sin(this.rotation + Math.PI / 2.0) * this.power * 5);

        this.hasQueuedShot = true;
        Actions.insert({ matchId: this.matchId, playerId: this.playerId, actionType: ActionTypeEnum.PlayerShoot, velocity: this.desiredShotVelocity, rotation: this.rotation });

        this.active = false;
        this.shotCompleted = false;
    }
}

function StartRotating() {
    this.shouldRotate = false;
    this.isRotating = true;
}

function SetRotationDestination(tankRotation) {
    this.shouldRotate = true;

    this.desiredRotation = tankRotation;
}

function SetShotVelocity(shotVelocity) {
    this.desiredShotVelocity = shotVelocity;
    this.hasQueuedShot = true;
    this.shotCompleted = false;
}

function Shoot() {
    shot = this.game.add.sprite(this.x, this.y, 'star');

    //TODO: make the scale -0.3 for player 2
    shot.scale.x = 0.3;
    shot.scale.y = 0.3;

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
        this.isRotating = false;
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

    if (this.isRotating) {
        this.RotateToDestination();
    }

    if (this.shots != null && this.shots.length > 0) {

        for (i = 0; i < this.shots.length; ++i) {
            // we hit the other tank
            if (this.game.physics.arcade.overlap(this.shots[i], otherPlayer)) {
                this.shots[i].kill();
                this.shots.splice(i, 1);
                otherPlayer.kill();

                otherPlayer.dead = true;

                this.shotCompleted = true;

                continue;
            }

            // we hit the ground and the shot was travelling downward or the shot went off the bottom of the screen
            if ((this.shots[i].body.velocity.y > 0 && this.game.physics.arcade.overlap(this.shots[i], platforms))
                || this.shots[i].position.y > 720) {
                this.shots[i].kill();
                this.shots.splice(i, 1);

                this.shotCompleted = true;

                continue;
            }

            var continueAgain = false;

            // collide our shot with the other tanks shots
            for (j = 0; j < otherPlayer.shots.length; ++j) {
                if (this.game.physics.arcade.overlap(this.shots[i], otherPlayer.shots[j])) {
                    this.shots[i].kill();
                    this.shots.splice(i, 1);

                    otherPlayer.shots[j].kill();
                    otherPlayer.shots.splice(j, 1);

                    this.shotCompleted = true;
                    otherPlayer.shotCompleted = true;
                    continueAgain = true;

                    continue;
                }
            }

            if (continueAgain) {
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

                this.dead = true;
                this.shotCompleted = true;

                continue;
            }
        }
    }

    if (this.active) {
        if (this.powerUp.isDown && this.power < 150) {
            this.power += 1;
            this.game.world.remove(this.powerText);
            this.powerText = this.game.add.text(16, 16, 'Power: ' + (this.power).toString(), { fontSize: '32px', fill: '#000' });
        }
        if (this.powerDown.isDown && this.power > 1) {
            this.power -= 1;
            this.game.world.remove(this.powerText);
            this.powerText = this.game.add.text(16, 16, 'Power: ' + (this.power).toString(), { fontSize: '32px', fill: '#000' });
        }

        if (this.rotateRight.isDown) {
            this.rotation -= 0.0174532925;
            this.game.world.remove(this.angleText);
            this.angleText = this.game.add.text(16, 48, 'Angle: ' + (Math.round(((this.rotation + Math.PI) * 57.2957795) * 10) / 10.0).toString(), { fontSize: '32px', fill: '#000' });
        }
        if (this.rotateLeft.isDown) {
            this.rotation += 0.0174532925;
            this.game.world.remove(this.angleText);
            this.angleText = this.game.add.text(16, 48, 'Angle: ' + (Math.round(((this.rotation + Math.PI) * 57.2957795) * 10) / 10.0).toString(), { fontSize: '32px', fill: '#000' });
        }
    }
}