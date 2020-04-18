import {GameState} from "./GameState.js"
import { DraggableSceneNode_Textured } from "../../shared_resources/EmeraldUtils/draggable.js";

export class GameEntity extends DraggableSceneNode_Textured
{
    constructor(gamestate) 
    {
        super(gamestate.gl, /*register draggable events*/true, gamestate.canvas, gamestate.camera);
    }
    
    tick(gamestate)
    {   
        //Not sure how to get auto completion.... use hinter object to get auto complete lol.
        // let hinter = new GameState();
        // hinter.friendList
        // console.log(hinter.friendList);

    }
}