// Determine # of pixels per tile for game calculations
const TILE_SIZE = Math.floor(Math.min(window.innerHeight/36, window.innerWidth/28))
// Determine # of pixels per tile for drawing to the canvas
let C_TILE_SIZE = TILE_SIZE
const MAX_SPEED = TILE_SIZE * 0.16
enum dir {
    UP,
    LEFT,
    DOWN,
    RIGHT
}
enum STATE {
    CHASE,
    SCATTER,
    FRIGHTENED,
    EATEN,
    WAITING,
    EXITING
}
function shuffle(arr: any[]): any[] {
    const array = arr.slice()
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * i)
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
    return array
}
