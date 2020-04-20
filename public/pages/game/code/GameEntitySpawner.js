import { GameEntity } from "./GameEntity.js";
import { mat4, vec3, vec4 } from "../../shared_resources/gl-matrix_esm/index.js";

// Gets a random int between 0 and max - 1
function GetRandomInt(max)
{
    return Math.floor(Math.random() * Math.floor(max));
}

function clamp(val, min, max)
{
    if(val < min)
    {
        return min;
    }
    if(val > max)
    {
        return max;
    }
    return val;
}

export class GameEntitySpawner
{
    constructor(gamestate) 
    {
        this.lastSpawnTime = 0;
        this.lastPropSpawnTime = 0;
        this.spawnRate = 4;
        this.chosenFriendPositionsX = [];
    }

    GetRandomNumberInRange(min, max)
    {
        return Math.floor(Math.random() * (max - min) + min);
    }

    GetRandomNumberInRangeFloat(min, max)
    {
        return Math.random() * (max - min) + min; 
    }



    GetCurrentSpawnRate(gamestate)
    {
        let gs = gamestate;

        let score = gamestate.score;

        let currProgressPerc = gs.MAX_SPEED_KILL_COUNT - gs.score_since_king_damaged;
        currProgressPerc = clamp(currProgressPerc, 0, gs.MAX_SPEED_KILL_COUNT); //[0,MAX_SPEED_KILL_COUNT]
        currProgressPerc = currProgressPerc / gs.MAX_SPEED_KILL_COUNT; //[0,1]  //it becoems a percent here, but not before :3

        currProgressPerc = 1.0 - currProgressPerc; //flip current progress 

        let deltaSpeed = /*bignumber*/gs.CONST_SPAWN_SLOWEST - /*smallnum*/gs.CONST_SPAWN_FASTEST;
        deltaSpeed *= currProgressPerc; //linear interpolation, hacky way to write it, sorry.

        let rate = gamestate.CONST_SPAWN_SLOWEST - deltaSpeed; //take away some stuff from slowest, to make it nearer fastest
        return rate;
    }

    GetRandomEntityType(gamestate)
    {
        let randomTypeIndex = this.GetRandomNumberInRange(0, 2);
        let typeToSpawn = "invalid";

        switch(randomTypeIndex)
        {
            case 0:
                typeToSpawn = gamestate.CONST_WARRIOR;
                break;
            case 1:
                typeToSpawn = gamestate.CONST_ARCHER;
                break;
            case 2:
                typeToSpawn = gamestate.CONST_MAGE;
                break;
            default:
                // Fail Safe
                typeToSpawn = gamestate.CONST_WARRIOR;
        }

        return typeToSpawn;
    }

    GetOpposingEntityType(gamestate, type)
    {
        let typeToSpawn = "invalid";
        switch(type)
        {
            case gamestate.CONST_WARRIOR:
                typeToSpawn = gamestate.CONST_MAGE;
                break;
            case gamestate.CONST_ARCHER:
                typeToSpawn = gamestate.CONST_WARRIOR;
                break;
            case gamestate.CONST_MAGE:
                typeToSpawn = gamestate.CONST_ARCHER;
                break;
            default:
                break;
        }

        return typeToSpawn;
    }

    tick(gamestate)
    {   
        if (gamestate.currentTimeSec > this.lastPropSpawnTime + 2.0)
        {
            this.spawnProp(gamestate);
            this.lastPropSpawnTime = gamestate.currentTimeSec;
        }


        if(gamestate.currentTimeSec > this.lastSpawnTime + this.GetCurrentSpawnRate(gamestate) )
        {
            if (gamestate.friendList.length <= 0)
            {
                // spawn in random areas to try and destroy the king

                let randomTypeIndex = this.GetRandomNumberInRange(0, 2);
                let typeToSpawn = this.GetRandomEntityType(gamestate);

                let cam = gamestate.camera;
                let x = this.GetRandomNumberInRangeFloat(-10.0, 11.0);
                let y = cam.position[1] + gamestate.CONST_SPAWN_Y_OFFSET;

                let newEnemy = new GameEntity(gamestate, typeToSpawn);
                newEnemy.setLocalPosition(vec3.fromValues(x, y, 0));
                newEnemy.isFriend = false;
                newEnemy.movementDirection = vec3.fromValues(0, -1, 0);
                newEnemy.speed = gamestate.CONST_ENEMY_SPEED;
                newEnemy.bEnableDrag = false;

                gamestate.enemyList.push(newEnemy);
                
            }
            else
            {

                let shouldSpawnInRandomType = this.GetRandomNumberInRange(0, 2);


                let friendIndex = GetRandomInt(gamestate.friendList.length);
                let chosenFriend = gamestate.friendList[friendIndex];

                let typeToSpawn = "invalid";
                if (shouldSpawnInRandomType == 1)
                {
                    typeToSpawn = this.GetRandomEntityType(gamestate);
                    //console.log("random enemy type to spawn chosen!");
                }
                else
                {
                    typeToSpawn = this.GetOpposingEntityType(gamestate, chosenFriend.type);
                }

                if (typeToSpawn != "invalid")
                {
                    if(gamestate.camera) //camera in emerald-opengl-utils.js
                    {
                        let chosenFriendPosition = vec3.create();
                        chosenFriend.getLocalPosition(chosenFriendPosition);

                        let shouldPickRandomX = this.GetRandomNumberInRange(0, 2);

                        let cam = gamestate.camera;
                        let x = chosenFriendPosition[0];
                        let y = cam.position[1];
                        // let z = cam.position[2];

                        if (shouldPickRandomX == 1)
                        {
                            x = this.GetRandomNumberInRangeFloat(-5.0, 6.0);
                            //console.log("random X position for enemy chosen!");
                        }

                        let yOffset = gamestate.CONST_SPAWN_Y_OFFSET;

                        let newEnemy = new GameEntity(gamestate, typeToSpawn);
                        newEnemy.setLocalPosition(vec3.fromValues(x, y + yOffset, /*z*/ 0));
                        newEnemy.isFriend = false;
                        newEnemy.movementDirection = vec3.fromValues(0, -1, 0);
                        newEnemy.speed = gamestate.CONST_ENEMY_SPEED;
                        newEnemy.bEnableDrag = false;

                        gamestate.enemyList.push(newEnemy);
                        //console.log("Spawned an enemy!");
                    }
                }   
            }

            this.lastSpawnTime = gamestate.currentTimeSec;
        }
    }

    spawnFriend(gamestate, type)
    {
        let kingPosition = vec3.create();
        gamestate.king.getLocalPosition(kingPosition);

        let x = kingPosition[0];
        let y = kingPosition[1];

        let xOffset = this.GetRandomNumberInRange(-3, 4);
        let attempts = 0;
        while (this.chosenFriendPositionsX.includes(xOffset) && attempts <= 10)
        {
            xOffset = this.GetRandomNumberInRange(-3, 4);
            attempts++;
            //console.log("Choosing another friend spawn spot:", xOffset, this.chosenFriendPositionsX);
        }
        this.chosenFriendPositionsX.push(xOffset);

        let yOffset = 2;

        //console.log("Spawned friendly with offset X:", xOffset);


        let newFriend = new GameEntity(gamestate, type);
        newFriend.hp = gamestate.CONST_FRIEND_START_HP
        newFriend.setLocalPosition(vec3.fromValues(x + xOffset, y + yOffset, /*z*/ 0));
        gamestate.friendList.push(newFriend);
    }

    spawnProp(gamestate)
    {   
        let cam = gamestate.camera;
        let x = 0;
        let y = cam.position[1];

        let xOffset = this.GetRandomNumberInRangeFloat(-10.0, 11.0);
        let yOffset = gamestate.CONST_SPAWN_Y_OFFSET;

        let scaleFactor = this.GetRandomNumberInRangeFloat(1.0, 3.0);
        let scale = vec3.fromValues(scaleFactor, scaleFactor, scaleFactor);

        // This should automatically add the prop to the prop render list in gamestate
        let newProp = new GameEntity(gamestate, gamestate.CONST_PROP);
        newProp.setLocalPosition(vec3.fromValues(x + xOffset * gamestate.CONST_SEPARATE_FACTOR, y + yOffset, 0));
        newProp.bEnableDrag = false;
        newProp.speed = 0;
        newProp.setLocalScale(scale);
        //console.log("spawned a prop!");
        //console.log(gamestate.propRenderList);
    }


}


