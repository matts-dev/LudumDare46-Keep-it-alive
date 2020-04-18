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
        // constants
        ////////////////////////////////////////////////////////
        this.CONST_WARRIOR = "Warrior";
        this.CONST_ARCHER = "Archer";
        this.CONST_MAGE = "Mage";

        ////////////////////////////////////////////////////////
        // rendering
        ////////////////////////////////////////////////////////
        this.projectionMat = null;
        this.viewMat = null;
        this.renderList = [];
    }

    init()
    {
        ////////////////////////////////////////////////////////
        // extra logic, try to avoid spawning stuff here; do in other classes
        ////////////////////////////////////////////////////////

        this.friendList.push(new GameEntity(this, this.CONST_MAGE));
        this.friendList.push(new GameEntity(this, this.CONST_MAGE));
        this.friendList.push(new GameEntity(this, this.CONST_MAGE));
        this.friendList.push(new GameEntity(this, this.CONST_WARRIOR));
        this.friendList.push(new GameEntity(this, this.CONST_WARRIOR));
        this.friendList.push(new GameEntity(this, this.CONST_WARRIOR));
        this.friendList.push(new GameEntity(this, this.CONST_ARCHER));
        this.friendList.push(new GameEntity(this, this.CONST_ARCHER));
        this.friendList.push(new GameEntity(this, this.CONST_ARCHER));
    }
}



























































































