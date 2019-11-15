/// <reference path="helper.ts"/>
/// <reference path="TileMap.ts" />
/// <reference path="Player.ts" />
/// <reference path="Ghost.ts"/>
/// <reference path="Blinky.ts"/>
/// <reference path="Pinky.ts"/>
/// <reference path="Inky.ts"/>
/// <reference path="Clyde.ts"/>
const canvas = <HTMLCanvasElement>document.getElementById("canvas")
canvas.height = 36 * TILE_SIZE
canvas.width = 28 * TILE_SIZE
const c = canvas.getContext("2d")
//Adjust UI to TILE_SIZE
const body = document.querySelector("body")
body.style.fontSize = TILE_SIZE + "px"
const gameOverScreen = <HTMLElement>document.querySelector(".gameOverScreen")
const gameOverText = <HTMLElement>document.querySelector(".gameOverText")
const readyLabel = <HTMLElement>document.querySelector(".ready")
const scoreElem = document.querySelector(".score")
const highscoreElem = document.querySelector(".highscore")
try {
    highscoreElem.textContent = localStorage.getItem("highscore") || "0"
} catch (e) {
    console.error(e)
}
let highscore = parseInt(highscoreElem.textContent)

let statePatterns = {CHASE: [420, 2040, 3540, 5040], SCATTER: [1620, 3240, 4740]}
let level = 1
let globalState = STATE.SCATTER
let score = 0
let frameCount = 0
let globalFrameHalt = 0
let paused = false
let resetReq = true
let running = false
const player = new Player()
let blinky: Blinky, pinky: Pinky, inky: Inky, clyde: Clyde
const ghosts = [
    blinky = new Blinky(),
    pinky = new Pinky(),
    inky = new Inky(),
    clyde = new Clyde()
]

window.addEventListener("keydown", (e) => {
    if (running) {
        if (e.key === "Enter" || e.key === "Escape") paused = !paused
        if (e.key === "w" || e.key === "ArrowUp") player.desiredDirection = dir.UP
        if (e.key === "a" || e.key === "ArrowLeft") player.desiredDirection = dir.LEFT
        if (e.key === "s" || e.key === "ArrowDown") player.desiredDirection = dir.DOWN
        if (e.key === "d" || e.key === "ArrowRight") player.desiredDirection = dir.RIGHT
    } else {
        gameOverScreen.style.display = "none"
        resetGame()
    }
})

window.addEventListener("resize", () => {
    //Adjust UI font-size
    body.style.fontSize = (canvas.offsetHeight/36) + "px"
})

window.addEventListener("beforeunload", () => {
    try {
        localStorage.setItem("highscore", highscore.toString())
    } catch (e) {
        console.error(e)
    }
})

function setLevel(l: number) {
    level = l
    if (level === 1) {
        statePatterns = {CHASE: [420, 2040, 3540, 5040], SCATTER: [1620, 3240, 4740]}
    } else if (level <= 4) {
        statePatterns = {CHASE: [420, 2040, 3540, 65521], SCATTER: [1620, 3240, 65520]}
    } else {
        statePatterns = {CHASE: [300, 1800, 3300, 65521], SCATTER: [1500, 3000, 65520]}
    }
    TileMap.reset()
    resetReq = true
}

function setGlobalState(state: STATE) {
    globalState = state
    ghosts.forEach((g) => {
        if (g.active && g.state !== STATE.FRIGHTENED) g.setState(state)
    })
}

function addPoints(points: number) {
    if (Math.floor(score/10000) !== Math.floor((score+points)/10000)) player.lives++
    score += points
    scoreElem.textContent = score.toString()
    if (score > highscore) {
        highscore = score
        highscoreElem.textContent = score.toString()
    }
}

function resetGame() {
    score = 0
    player.lives = 3
    scoreElem.textContent = score.toString()
    setLevel(1)
    if (!running) {
        running = true
        tick()
    }
}

function resetAll() {
    readyLabel.style.display = "block"
    setTimeout(() => { readyLabel.style.display = "none" }, 2000)
    setGlobalState(STATE.SCATTER)
    player.reset()
    ghosts.forEach((g) => g.reset())
    frameCount = 0
    resetReq = false
}

function tick() {
    if (!running) return
    if (globalFrameHalt > 0) {
        globalFrameHalt--
    } else if (resetReq) {
        resetAll()
        globalFrameHalt = 120
        draw()
    } else if (!paused) {
        frameCount++
        if (statePatterns.CHASE.includes(frameCount)) setGlobalState(STATE.CHASE)
        else if (statePatterns.SCATTER.includes(frameCount)) setGlobalState(STATE.SCATTER)

        player.update()
        ghosts.forEach((g) => g.update())
        if (!resetReq) {
            // If the player didn't hit anything, check again
            player.checkCollision()
            draw()
        }
    }

    window.requestAnimationFrame(tick)
}

function draw() {
    c.fillStyle = "rgb(0,0,150)"
    c.fillRect(0, 0, canvas.width, canvas.height)
    TileMap.draw(c)

    //Draw UI Bars
    c.fillStyle = "#000"
    c.fillRect(0, 0, 28*TILE_SIZE, 3*TILE_SIZE)
    c.fillRect(0, 34*TILE_SIZE, 28*TILE_SIZE, 2*TILE_SIZE)

    //Draw monster pen exit
    c.fillRect(13.5*TILE_SIZE, 15*TILE_SIZE, TILE_SIZE, TILE_SIZE)
    c.fillStyle = "#e2cba9"
    c.fillRect(13.5*TILE_SIZE, 15.25*TILE_SIZE, TILE_SIZE, TILE_SIZE/2)

    player.draw(c)
    ghosts.forEach((g) => g.draw(c))
}
