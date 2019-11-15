/// <reference path="Ghost.ts"/>
class Blinky extends Ghost {
    protected color = "#fc0000"
    protected scatterX = 24
    protected scatterY = 1

    constructor() {
        super()
        this.reset()
    }

    reset() {
        this.direction = (Math.random() < 0.5) ? dir.LEFT : dir.RIGHT
        this.x = 13.5 * TILE_SIZE
        this.y = 14 * TILE_SIZE
        this.setState(globalState)
        this.updateTilePos()
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.targetX = player.tileX
            this.targetY = player.tileY
        }
    }
}
