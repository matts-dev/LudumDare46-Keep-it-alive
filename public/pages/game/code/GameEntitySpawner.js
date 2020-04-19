import { GameEntity } from "./GameEntity.js";
import { mat4, vec3, vec4 } from "../../shared_resources/gl-matrix_esm/index.js";

// Gets a random int between 0 and max - 1
function GetRandomInt(max)
{
    return Math.floor(Math.random() * Math.floor(max));
}

export class GameEntitySpawner
{
    constructor(gamestate) 
    {
        this.lastSpawnTime = 0;
    }

    tick(gamestate)
    {   

        if (gamestate.friendList.length <= 0)
        {
            // early out
            this.lastSpawnTime = gamestate.currentTimeSec;
            return;
        }
        
        if(this.lastSpawnTime + 1.0 < gamestate.currentTimeSec)
        {
            let typeToSpawn = "invalid";
            let friendIndex = GetRandomInt(gamestate.friendList.length);
            let chosenFriend = gamestate.friendList[friendIndex];

            switch(chosenFriend.type)
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
                    // do nothing
            }

            if (typeToSpawn != "invalid")
            {
                if(gamestate.camera) //camera in emerald-opengl-utils.js
                {
                    let chosenFriendPosition = vec3.create();
                    chosenFriend.getLocalPosition(chosenFriendPosition);

                    let cam = gamestate.camera;
                    let x = chosenFriendPosition[0];
                    let y = cam.position[1];
                    // let z = cam.position[2];

                    //let xOffset = GetRandomInt(11) - 5;
                    let yOffset = 15;

                    let newEnemy = new GameEntity(gamestate, typeToSpawn);
                    newEnemy.setLocalPosition(vec3.fromValues(x, y + yOffset, /*z*/ 0));
                    newEnemy.isFriend = false;
                    newEnemy.movementDirection = vec3.fromValues(0, -1, 0);
                    newEnemy.speed = gamestate.CONST_ENEMY_SPEED;
                    newEnemy.bEnableDrag = false;

                    gamestate.enemyList.push(newEnemy);
                    console.log("Spawned an enemy!");
                }
            }   
            this.lastSpawnTime = gamestate.currentTimeSec;
        }
    }

    spawnFriend(gamestate, type)
    {
        let cam = gamestate.camera;
        let x = cam.position[0];
        let y = cam.position[1];

        let xOffset = GetRandomInt(11) - 5;
        let yOffset = GetRandomInt(6);

        let newFriend = new GameEntity(gamestate, type);
        newFriend.setLocalPosition(vec3.fromValues(x + xOffset, y + yOffset, /*z*/ 0));
        gamestate.friendList.push(newFriend);
    }


}


