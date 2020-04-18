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
        
        if(this.lastSpawnTime + 1.0 < gamestate.currentTimeSec)
        {
            let friendIndex = GetRandomInt(gamestate.friendList.length);

            let typeToSpawn = "invalid";

            switch(gamestate.friendList[friendIndex].type)
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
                    let cam = gamestate.camera;
                    let x = cam.position[0];
                    let y = cam.position[1];
                    // let z = cam.position[2];

                    let xOffset = GetRandomInt(11) - 5;
                    let yOffset = GetRandomInt(11) - 5;

                    let newEnemy = new GameEntity(gamestate, typeToSpawn);
                    newEnemy.setLocalPosition(vec3.fromValues(x + xOffset, y + yOffset, /*z*/ 0));

                    gamestate.enemyList.push(newEnemy);
                    console.log("Spawned an enemy!");
                }
  
            }
            //gamestate.friendList.push(new GameEntity(gamestate, this.CONST_WARRIOR));
            this.lastSpawnTime = gamestate.currentTimeSec;
        }   
    }


}


