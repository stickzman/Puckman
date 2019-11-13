/// <reference path="Ghost.ts"/>
class Blinky extends Ghost {
    protected color = "red"
    protected scatterX = 24
    protected scatterY = 1

    constructor(x = 13.5 * TILE_SIZE, y = 14 * TILE_SIZE) {
        super(x, y)
        this.x = x
        this.y = y
        this.updateTilePos()
        this.setState(STATE.CHASE)
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.targetX = player.tileX
            this.targetY = player.tileY
        }
    }
}
