import { GameEntity } from "./GameEntity.js";

export class GameEntitySpawner
{
    constructor(gamestate) 
    {
        this.testEntity = new GameEntity(gamestate);
        this.lastSpawnTime = 0;
    }

    tick(gamestate)
    {   
        if(this.lastSpawnTime + 10.0 < gamestate.currentTimeSec)
        {
            gamestate.friendList.push(new GameEntity(gamestate));
        }
    }
}


