import {GameEntity} from "./GameEntity.js"

/** A class that acts as storage for all shared state  */
export class GameState
{
    constructor() 
    {
        this.dt_sec = 0;
        this.gl = null;
        this.canvas = null;
        this.camera = null;
        this.friendList = [];
        this.enemyList = [];
        this.currentTimeSec = 0;
        this.entitySpawner = null;

        ////////////////////////////////////////////////////////
        // extra logic, try to avoid spawning stuff here; do in other classes
        ////////////////////////////////////////////////////////
    }
}


