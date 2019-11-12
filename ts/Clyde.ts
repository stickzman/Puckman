/// <reference path="Ghost.ts"/>
class Clyde extends Ghost {
    protected INIT_COLOR = "orange"
    protected color = this.INIT_COLOR

    constructor(x?: number, y?: number) {
        super(x, y)
    }

    updateTarget() {
        if (this.state === STATE.CHASE
                && Math.hypot(player.tileX - this.tileX, player.tileY - this.tileY) > 8) {
            this.targetX = player.tileX
            this.targetY = player.tileY
        } else {
            this.targetX = 0
            this.targetY = 35
        }
    }
}
