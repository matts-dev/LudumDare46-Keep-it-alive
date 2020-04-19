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
        this.king = null;

        ////////////////////////////////////////////////////////
        // HELPERS
        ////////////////////////////////////////////////////////
        this.kingMoveDeltaX = 0.0; //used to fix dragable offset issues while camera moving
        this.kingMoveDeltaY = 0.0; //used to fix dragable offset issues while camera moving

        ////////////////////////////////////////////////////////
        // constants
        ////////////////////////////////////////////////////////
        this.CONST_WARRIOR = "Warrior";
        this.CONST_ARCHER = "Archer";
        this.CONST_MAGE = "Mage";
        this.CONST_KING = "King";
        this.CONST_PAPERTYPE = "Paper";
        this.CONST_PROP = "Prop";

        this.CONST_ENABLE_DEBUG = false;
        this.CONST_PAPERSIZE = 10;
        this.CONST_KING_SPEED = 1;
        this.CONST_ENEMY_SPEED = 1.1;
        this.CONST_CAMERA_KING_Y_OFFSET = 3;
        this.CONST_STUN_TIME = 0.2;

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
    }
}




























































































































































