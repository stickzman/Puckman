/// <reference path="Ghost.ts"/>
class Pinky extends Ghost {
    protected INIT_COLOR = "pink"
    protected color = this.INIT_COLOR

    constructor(x?: number, y?: number) {
        super(x, y)
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            switch (player.direction) {
                case dir.UP: {
                    this.targetX = player.tileX
                    this.targetY = player.tileY - 4
                    break
                }
                case dir.DOWN: {
                    this.targetX = player.tileX
                    this.targetY = player.tileY + 4
                    break
                }
                case dir.LEFT: {
                    this.targetX = player.tileX - 4
                    this.targetY = player.tileY
                    break
                }
                case dir.RIGHT: {
                    this.targetX = player.tileX + 4
                    this.targetY = player.tileY
                    break
                }
            }
        } else {
            this.targetX = 4
            this.targetY = 1
        }
    }
}
