window.AstroGliders = window.AstroGliders || {};

AstroGliders.Tank = function (isPlayer, x, y, rotation, flip, game, matchId, playerId) {
    // The player and its settings
    tank = game.add.group();
    tank.position.x = x;
    tank.position.y = y - 10;

    tank.base = tank.create(0, 0, 'catapult');
    game.physics.arcade.enable(tank.base);

    tank.arm = tank.create(0, 7, 'arm');
    tank.arm.anchor.setTo(0.95, 0.2);
    tank.arrow = tank.create(0, 0, 'arrow');
    tank.arrow.anchor.setTo(0.5, 0);

    if (flip) {
        tank.base.scale.x = -1;
        tank.arm.scale.x = -1;

        tank.arm.position.x = -50;
    }
    else {
        tank.arm.position.x = 50;
    }

    tank.flipped = flip
    tank.arrow.rotation = rotation;
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
        tank.angleText = game.add.text(16, 48, 'Angle: ' + (Math.round(((tank.arm.rotation + Math.PI) * 57.2957795) * 10) / 10.0).toString(), { fontSize: '32px', fill: '#000' });

        tank.active = true;
    }

    tank.game = game;

    tank.Update = Update;
    tank.Shoot = Shoot;
    tank.RotateAndShoot = RotateAndShoot;
    tank.SetShotVelocity = SetShotVelocity;
    tank.RotateToDestinationAndShoot = RotateToDestinationAndShoot;
    tank.SetRotationDestination = SetRotationDestination;
    tank.ResetArm = ResetArm;
    tank.kill = kill;
    tank.Cleanup = Cleanup;

    tank.shots = [];

    tank.matchId = matchId;
    tank.playerId = playerId;

    tank.hasQueuedShot = false;
    tank.isRotating = false;

    tank.dead = false;
    tank.shotCompleted = false;

    tank.amountToRotate = Math.PI / 4;

    return tank;
}
AstroGliders.Tank.prototype = new AstroGliders.Tank;

function Fire() {
    if (this.active) {
        this.desiredShotVelocity = new Phaser.Point(Math.cos(this.arrow.rotation + Math.PI / 2.0) * this.power * 5, Math.sin(this.arrow.rotation + Math.PI / 2.0) * this.power * 5);

        this.hasQueuedShot = true;
        Actions.insert({ matchId: this.matchId, playerId: this.playerId, actionType: ActionTypeEnum.PlayerShoot, velocity: this.desiredShotVelocity, rotation: this.arrow.rotation });

        this.active = false;
        this.shotCompleted = false;
    }
}

function RotateAndShoot() {
    this.isRotating = true;
}

function SetShotVelocity(shotVelocity) {
    this.desiredShotVelocity = shotVelocity;
    this.hasQueuedShot = true;
    this.shotCompleted = false;
}

function Shoot() {
    shot = this.game.add.sprite(this.x, this.y, 'cat');

    //TODO: make the scale -0.3 for player 2
    shot.scale.x = 0.3;
    shot.scale.y = 0.3;

    this.shots.push(shot);

    shot.anchor.setTo(0.5, 0.5);

    this.game.physics.arcade.enable(shot);

    shot.body.gravity.x = this.wind;
    shot.body.gravity.y = 200;

    shot.enableBody = true;

    shot.body.velocity.set(this.desiredShotVelocity.x, this.desiredShotVelocity.y);

    this.hasQueuedShot = false;
}

function SetRotationDestination(rotation) {
    this.arrow.rotation = rotation;

    if (this.flipped) {
        this.arm.rotation = rotation - Math.PI * 3 / 4;
    }
    else {
        this.arm.rotation = rotation + Math.PI * 3 / 4;
    }

    this.amountToRotate = Math.PI / 4;
}

function ResetArm() {
    if (this.flipped) {
        this.arm.rotation = this.arrow.rotation - Math.PI * 3 / 4;
    }
    else {
        this.arm.rotation = this.arrow.rotation + Math.PI * 3 / 4;
    }

    this.amountToRotate = Math.PI / 4;
}

function RotateToDestinationAndShoot() {
    if (this.amountToRotate < 0.06) {
        this.rotation = this.desiredRotation;
        this.isRotating = false;
        this.Shoot();
    }
    else if (this.flipped) {
        this.arm.rotation -= 0.06;
        this.amountToRotate -= 0.06;
    }
    else {
        this.arm.rotation += 0.06;
        this.amountToRotate -= 0.06;
    }
}

function ShotHit() {
    console.log("shot hit");
}

function kill() {
    this.base.kill();
    this.arm.kill();
    this.arrow.kill();
}

function Cleanup() {
    this.base.kill();
    this.arm.kill();
    this.arrow.kill();

    this.game.world.remove(this.base);
    this.game.world.remove(this.arm);
    this.game.world.remove(this.arrow);
}

function Update(otherPlayer, platforms, wall) {

    if (this.isRotating) {
        this.RotateToDestinationAndShoot();
    }

    if (this.shots != null && this.shots.length > 0) {

        for (i = 0; i < this.shots.length; ++i) {
            // we hit the other tank
            if (this.game.physics.arcade.overlap(this.shots[i], otherPlayer.base)) {
                this.shots[i].kill();
                this.shots.splice(i, 1);
                otherPlayer.kill();

                otherPlayer.dead = true;

                this.shotCompleted = true;

                this.ResetArm();

                continue;
            }

            // we hit the ground and the shot was travelling downward or the shot went off the bottom of the screen or hit the wall
            if ((this.shots[i].body.velocity.y > 0 && this.game.physics.arcade.overlap(this.shots[i], platforms))
                || this.shots[i].position.y > 720 || this.game.physics.arcade.overlap(this.shots[i], wall)) {
                this.shots[i].kill();
                this.shots.splice(i, 1);

                this.shotCompleted = true;

                this.ResetArm();

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

                    this.ResetArm();
                    otherPlayer.ResetArm();

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

            if (this.shots[i].body.velocity.dot(between) > 0 && this.game.physics.arcade.overlap(this.shots[i], this.base)) {
                this.kill();
                this.shots[i].kill();
                this.shots.splice(i, 1);

                this.dead = true;
                this.shotCompleted = true;

                this.ResetArm();

                continue;
            }
        }
    }

    if (this.active) {
        if (this.powerUp.isDown && this.power < 150) {
            this.power += 1;
            this.arrow.scale.y = this.power / 100;
            this.game.world.remove(this.powerText);
            this.powerText = this.game.add.text(16, 16, 'Power: ' + (this.power).toString(), { fontSize: '32px', fill: '#000' });
        }
        if (this.powerDown.isDown && this.power > 1) {
            this.power -= 1;
            this.arrow.scale.y = this.power / 100;
            this.game.world.remove(this.powerText);
            this.powerText = this.game.add.text(16, 16, 'Power: ' + (this.power).toString(), { fontSize: '32px', fill: '#000' });
        }

        if (this.rotateRight.isDown) {
            this.arrow.rotation -= 0.0174532925;
            this.arm.rotation -= 0.0174532925;
            this.game.world.remove(this.angleText);
            this.angleText = this.game.add.text(16, 48, 'Angle: ' + (Math.round(((this.arm.rotation + Math.PI) * 57.2957795) * 10) / 10.0).toString(), { fontSize: '32px', fill: '#000' });
        }
        if (this.rotateLeft.isDown) {
            this.arrow.rotation += 0.0174532925;
            this.arm.rotation += 0.0174532925;
            this.game.world.remove(this.angleText);
            this.angleText = this.game.add.text(16, 48, 'Angle: ' + (Math.round(((this.arm.rotation + Math.PI) * 57.2957795) * 10) / 10.0).toString(), { fontSize: '32px', fill: '#000' });
        }
    }
}