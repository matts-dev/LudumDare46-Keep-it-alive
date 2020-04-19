import { DraggableSceneNode_Textured } from "../../shared_resources/EmeraldUtils/draggable.js";
import {TextBlockSceneNode} from "../../shared_resources/EmeraldUtils/BitmapFontRendering.js";
import { GameEntity } from "./GameEntity.js";
import {vec2, vec3, vec4, mat4, quat} from "../../shared_resources/gl-matrix_esm/index.js";

export class GameButton extends DraggableSceneNode_Textured
{
    constructor(text, gamestate, bitmapfont)
    {
        super(gamestate.gl, /*register draggable events*/true, gamestate.canvas, gamestate.camera);
        
        this.bitmapFont = bitmapfont;

        this.textSceneNodeDemo = new TextBlockSceneNode(this.gl, this.bitmapFont, text );
        this.textSceneNodeDemo.setLocalScale(vec3.fromValues(10,10,10));
        this.textSceneNodeDemo.setLocalPosition(vec3.fromValues(0,0,0));
        this.textSceneNodeDemo.setParent(this);

        this.backgroundImage = new GameEntity(gamestate, gamestate.CONST_BUTTONTYPE);
        this.backgroundImage.bEnableDrag = false;
        this.backgroundImage.setTextureToButton();
        this.backgroundImage.setParent(this);
        this.backgroundImage.speed = 0;
        // this.backgroundImage.setLocalPosition(vec3.fromValues(0,-1,0));
        this.backgroundImage.setLocalScale(vec3.fromValues(3,2,1));
        this.buttomCameraOffsetY = 3.0;

    }

    onDragStarted()
    {
        this.bDragging = false;
        this.onClicked();
    }

    onClicked()
    {
        console.log("clicked")
    }

    tick(gamestate)
    {
        let myPos = vec3.create();
        this.getLocalPosition(myPos);
        myPos[1] = gamestate.camera.position[1] + this.buttomCameraOffsetY;
        this.setLocalPosition(myPos);

        this.backgroundImage.tick(gamestate);
    }

    render(gamestate)
    {
        this.textSceneNodeDemo.render( gamestate.projectionMat, gamestate.viewMat);

        this.backgroundImage.renderEntity(gamestate);
    }
}