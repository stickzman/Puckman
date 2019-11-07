/// <reference path="TileMap.ts" />
/// <reference path="Player.ts" />
const TILE_SIZE = 16
const dir = {
    "UP": 0,
    "DOWN": 1,
    "LEFT": 2,
    "RIGHT": 3
}

const canvas = <HTMLCanvasElement>document.getElementById("canvas")
const c = canvas.getContext("2d")

const player = new Player()

window.addEventListener("keydown", (e) => {
    if (e.key === "w" || e.key === "ArrowUp") player.desiredDirection = dir.UP
    if (e.key === "a" || e.key === "ArrowLeft") player.desiredDirection = dir.LEFT
    if (e.key === "s" || e.key === "ArrowDown") player.desiredDirection = dir.DOWN
    if (e.key === "d" || e.key === "ArrowRight") player.desiredDirection = dir.RIGHT
})

function draw() {
    c.fillStyle = "blue"
    c.fillRect(0, 0, canvas.width, canvas.height)

    player.update()

    TileMap.draw(c)
    player.draw(c)

    window.requestAnimationFrame(draw)
}
draw()
