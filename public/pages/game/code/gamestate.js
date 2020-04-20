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
        this.score = 0;

        ////////////////////////////////////////////////////////
        // HELPERS
        ////////////////////////////////////////////////////////
        this.kingMoveDeltaX = 0.0; //used to fix dragable offset issues while camera moving
        this.kingMoveDeltaY = 0.0; //used to fix dragable offset issues while camera moving

        this.score_since_king_damaged = 0;

        ////////////////////////////////////////////////////////
        // constants
        ////////////////////////////////////////////////////////
        this.CONST_WARRIOR = "Warrior";
        this.CONST_ARCHER = "Archer";
        this.CONST_MAGE = "Mage";
        this.CONST_KING = "King";
        this.CONST_PAPERTYPE = "Paper";
        this.CONST_PROP = "Prop";
        this.CONST_BACKGROUND = "Background";
        this.CONST_BUTTONTYPE = "Button";

        this.CONST_SPAWN_SLOWEST = 4.0;
        // this.CONST_SPAWN_FASTEST = 1.5;
        // this.CONST_SPAWN_FASTEST = 1.0;
        // this.CONST_SPAWN_FASTEST = 1.25;
        this.CONST_SPAWN_FASTEST = 1.125;
        this.MAX_SPEED_KILL_COUNT = 10;
        this.CONST_DISABLED_SPEED_BOOST = 3;
        this.CONST_DISABLE_DURATION = 1.5;
        this.CONST_ARROW_MAX_DIST = 7

        this.CONST_ENABLE_DEBUG = false;
        this.CONST_ENABLE_ARROW = true;
        this.CONST_ARROW_OFFSET = 0.75;
        this.CONST_PAPERSIZE = 10;
        this.CONST_KING_SPEED = 1;
        this.CONST_ENEMY_SPEED = 1.1;
        this.CONST_ENEMY_CHASE_KING_SPEED = 2;
        this.CONST_CAMERA_KING_Y_OFFSET = 3;
        this.CONST_STUN_TIME = 0.2;
        this.CONST_SPAWN_Y_OFFSET = 7;
        this.CONST_FRIEND_START_HP = 1;
        this.CONST_KING_START_HP = 3;
        this.CONST_BUMP_ENEMY_OFFSET = 1;
        this.CONST_SEPARATE_FACTOR = 1; //value of 1 does nothing

        //test timings
        this.CONST_MAGE_HINT_START_TIME = 0.5;
        this.CONST_ARCHER_HINT_START_TIME = 1.5;
        this.CONST_WARRIOR_HINT_START_TIME = 2.5;
        this.CONST_CAT_HINT_START_TIME = 3.5;

        this.CONST_MAGE_HINT_END_TIME = 3.5;
        this.CONST_ARCHER_HINT_END_TIME = 4.0;
        this.CONST_WARRIOR_HINT_END_TIME = 4.5;
        this.CONST_CAT_HINT_END_TIME = 5.0;

        this.filteredEnemyArchers = [];
        this.filteredEnemyWarriors = [];
        this.filteredEnemyMages = [];

        ////////////////////////////////////////////////////////
        // rendering
        ////////////////////////////////////////////////////////
        this.projectionMat = null;
        this.viewMat = null;
        this.renderList = [];
        this.propRenderList = [];
        this.backgroundRenderList = [];
    }

    init()
    {
        ////////////////////////////////////////////////////////
        // extra logic, try to avoid spawning stuff here; do in other classes
        ////////////////////////////////////////////////////////

        /*

        // reset
        this.dt_sec = 0;
        this.friendList = [];
        this.enemyList = [];
        this.currentTimeSec = 0;
        this.king = null;

        this.renderList = [];
        this.propRenderList = [];

        // setup
        this.king = new GameEntity(this, this.CONST_KING);
        this.king.makeKingEntity();
        */

    }
}






































































































































































