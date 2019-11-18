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

let gamepadIndex = -1
function pollGamepadStart() {
    if (running) return
    if (gamepadIndex > -1) {
        const gamepad = navigator.getGamepads()[gamepadIndex]
        if (gamepad.buttons.some(b => b.pressed)) {
            resetGame()
            return
        }
    }
    requestAnimationFrame(pollGamepadStart)
}
pollGamepadStart()
const gameOverScreen = <HTMLElement>document.querySelector(".gameOverScreen")
const gameOverText = <HTMLElement>document.querySelector(".gameOverText")
let startGameIntCount = 0
const startGameInt = setInterval(() => {
    switch (++startGameIntCount) {
        case 0: {
            gameOverText.textContent = "PUSH START!";
            gameOverText.style.display = "block";
            break;
        }
        case 1: gameOverText.style.display = "none"; break;
        case 2: {
            gameOverText.textContent = "PRESS ENTER!";
            gameOverText.style.display = "block";
            break;
        }
        case 3: gameOverText.style.display = "none"; startGameIntCount = -1; break;

    }
}, 1000)

window.addEventListener("keydown", (e) => {
    if (running) {
        if (e.key === "Enter" || e.key === "Escape") togglePause()
        if (e.key === "w" || e.key === "ArrowUp") player.desiredDirection = dir.UP
        if (e.key === "a" || e.key === "ArrowLeft") player.desiredDirection = dir.LEFT
        if (e.key === "s" || e.key === "ArrowDown") player.desiredDirection = dir.DOWN
        if (e.key === "d" || e.key === "ArrowRight") player.desiredDirection = dir.RIGHT
    } else if (e.key === "Enter" || e.key === " ")  {
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

window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
    gamepadIndex = e.gamepad.index
})

let touchX: number
let touchY: number
window.addEventListener("touchstart", (e) => {
    if (!running) resetGame()
    let touch = e.touches[0]
    touchX = touch.clientX
    touchY = touch.clientY
})

window.addEventListener("touchmove", (e) => {
    if (!running) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchX
    const deltaY = touch.clientY - touchY
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            player.desiredDirection = dir.RIGHT
        } else {
            player.desiredDirection = dir.LEFT
        }
    } else {
        if (deltaY > 0) {
            player.desiredDirection = dir.DOWN
        } else {
            player.desiredDirection = dir.UP
        }
    }
})

function togglePause() {
    paused = !paused
    if (paused) {
        gameOverText.textContent = "PAUSED"
        gameOverText.style.display = "block"
        gameOverScreen.style.display = "block"
    } else {
        gameOverScreen.style.display = "none"
    }
}

let startBtnPressed = false
function updateGamepadControls(gamepad: Gamepad) {
    const buttons = gamepad.buttons

    if (!startBtnPressed && buttons[9].pressed) togglePause()
    startBtnPressed = buttons[9].pressed

    if (buttons[12].pressed) player.desiredDirection = dir.UP
    else if (buttons[13].pressed) player.desiredDirection = dir.DOWN
    else if (buttons[14].pressed) player.desiredDirection = dir.LEFT
    else if (buttons[15].pressed) player.desiredDirection = dir.RIGHT
    // Get active analogue stick
    const deadzone = 0.8
    let xAxis: number, yAxis: number
    if (Math.hypot(gamepad.axes[0], gamepad.axes[1]) >= deadzone) {
        xAxis = gamepad.axes[0]
        yAxis = gamepad.axes[1]
    } else if (Math.hypot(gamepad.axes[2], gamepad.axes[3]) >= deadzone) {
        xAxis = gamepad.axes[2]
        yAxis = gamepad.axes[3]
    } else {
        return
    }
    if (Math.abs(xAxis) > Math.abs(yAxis)) {
        if (xAxis < 0) {
            player.desiredDirection = dir.LEFT
        } else {
            player.desiredDirection = dir.RIGHT
        }
    } else {
        if (yAxis < 0) {
            player.desiredDirection = dir.UP
        } else {
            player.desiredDirection = dir.DOWN
        }

    }
}

function levelWin() {
    globalFrameHalt = 180
    setTimeout(() => {
        let i = 0
        const interval = setInterval(() => {
            draw((++i % 2 === 0) ? "rgb(0,0,150)" : "rgb(150,150,150)")
        }, 175)
        setTimeout(() => {
            setLevel(level+1)
            clearInterval(interval)
        }, 1500)
    }, 1500)
}

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
    if (startGameInt) clearInterval(startGameInt)
    gameOverScreen.style.display = "none"
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
    // Check Gamepad controls
    if (gamepadIndex > -1) updateGamepadControls(navigator.getGamepads()[gamepadIndex])

    if (paused) {
        // Do nothing if paused
    } else if (globalFrameHalt > 0) {
        globalFrameHalt--
    } else if (resetReq) {
        resetAll()
        globalFrameHalt = 120
        draw()
    } else {
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

function draw(bkgColor = "rgb(0,0,150)") {
    c.fillStyle = bkgColor
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
