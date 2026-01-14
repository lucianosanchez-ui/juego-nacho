# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Pacman-style game where the player controls a Labrador dog (🐕) and avoids/eats cats (🐱) instead of ghosts. Built with vanilla HTML5 Canvas, CSS, and JavaScript - no build process or dependencies required.

## Architecture

### Core Game Loop
The game uses `requestAnimationFrame` for the main loop (game.js:476-497). The loop runs continuously when `gameRunning` is true, updating all entities and checking collisions each frame.

### Coordinate System
- Grid-based: 20x20 cells (GRID_WIDTH × GRID_HEIGHT)
- Each cell is 28px (CELL_SIZE)
- Canvas size: 560×620px
- Map values: 0=empty, 1=wall, 2=pellet, 3=power pill
- Entity positions stored in pixel coordinates, converted to grid coords for collision detection

### Entity Classes

**Player (game.js:46-151)**
- Position starts at (10, 15) in grid coords
- Uses `direction` (current movement) and `nextDirection` (queued input)
- Movement validated before committing (allows smooth cornering)
- Collision detection checks all 4 corners of player bounding box

**Ghost (game.js:154-360)**
- Each ghost has a `personality` type that determines AI behavior:
  - `'chase'`: Pathfinds directly toward player
  - `'random'`: Moves randomly at intersections
  - `'ambush'`: Predicts player position 4 cells ahead
  - `'patrol'`: Continues straight, occasional random turns
- In power mode, all ghosts flee from player
- Speed increases by 0.1 per level

### Collision System
- Player-wall: Checks 4 corners of bounding box against map grid
- Player-pellet: Center point collection
- Player-ghost: Distance-based (< CELL_SIZE/2)
- Ghost-wall: Same as player-wall

### Game States
- Power mode: Activated by power pills, lasts 300 frames (5 sec @ 60fps)
- Lives system: Start with 3, reset positions on hit, game over at 0
- Victory condition: All pellets (type 2 and 3) collected from map

## Key Files

- `index.html` - Minimal structure, canvas + UI elements
- `game.js` - All game logic (entities, AI, collision, game loop)
- `style.css` - Responsive styling with mobile media queries

## Running the Game

Simply open `index.html` in a browser. No build step, no server required. Game starts automatically on load.

## Mobile Support

The game currently uses keyboard arrow keys only. Touch controls need to be added for mobile play.
