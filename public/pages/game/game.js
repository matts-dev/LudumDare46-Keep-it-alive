import * as EmeraldUtils from "../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import * as key from "../shared_resources/EmeraldUtils/browser_key_codes.js";
import {Camera} from "../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import {vec2, vec3, vec4, mat4, quat} from "../shared_resources/gl-matrix_esm/index.js";
import {isSafari} from "../shared_resources/EmeraldUtils/browser_key_codes.js";
import {coloredCubeFactory, UnitCube3D, texturedCubeFactory} from "../shared_resources/EmeraldUtils/emerald_easy_shapes.js";
import { DraggableSceneNode_Textured } from "../shared_resources/EmeraldUtils/draggable.js";
import { Montserrat_BMF } from "../shared_resources/EmeraldUtils/Montserrat_BitmapFontConfig.js";
import {TextBlockSceneNode} from "../shared_resources/EmeraldUtils/BitmapFontRendering.js";

import {GameState} from "./code/gamestate.js"

//////////////////////////////////////////////////////
//module level statics and globals
//////////////////////////////////////////////////////
var game = null;



//////////////////////////////////////////////////////
// Base Game Class
//////////////////////////////////////////////////////
class Game
{
    constructor(glCanvasId = "#glCanvas")
    {
        this.glCanvas = document.querySelector(glCanvasId);
        this.gl = this.glCanvas.getContext("webgl");
        this.prevFrameTimestampSec = 0;

        this.inputMonitor = new key.InputMonitor();
        this.boundGameLoop = this.tick_gameLoop.bind(this);
        this.textures = this._createTextures(this.gl);

        this.gameState = new GameState();

        ////////////////////////////////////////////////////////
        // game engine config
        ////////////////////////////////////////////////////////
        this.zoomSpeed = 1;
        this.bStopTicks = false;

        ////////////////////////////////////////////////////////
        // debug
        ////////////////////////////////////////////////////////
        this.bRenderLineTrace = false;
        this.lineRenderer = new EmeraldUtils.LineRenderer(this.gl);
        this.coloredCube = coloredCubeFactory(this.gl);
        
        ///////////////////////////////////////////////////////////////////////////
        //custom game code
        ///////////////////////////////////////////////////////////////////////////
        this.camera = new Camera(vec3.fromValues(0,0,1), vec3.fromValues(0,0,-1));
        this.camera.enableOrthoMode = true;
        this.camera.orthoHeight = 10;

        //subclass draggableSceneNode to define custom textures.
        this.draggableDemo = new DraggableSceneNode_Textured(this.gl, true, this.glCanvas, this.camera);
        this.bitmapFont = new Montserrat_BMF(this.gl, "../shared_resources/Textures/Fonts/Montserrat_ss_alpha_1024x1024_wb.png");

        this.textSceneNodeDemo = new TextBlockSceneNode(this.gl, this.bitmapFont, "This is a text scene node; it is a child of draggable above!" );
        this.textSceneNodeDemo.setLocalScale(vec3.fromValues(10,10,10));
        this.textSceneNodeDemo.setLocalPosition(vec3.fromValues(0,-1,0));
        this.textSceneNodeDemo.setParent(this.draggableDemo);

        ///////////////////////////////////////////////////////////////////////////
        // Bind handlers to events
        ///////////////////////////////////////////////////////////////////////////
        this._bindCallbacks();
    }

    _createTextures(gl){
        return {
            // grass : new EmeraldUtils.Texture(gl, "../shared_resources/Grass2.png"),
            montserratFontWhite : new EmeraldUtils.Texture(gl, "../shared_resources/Montserrat_ss_alpha_white_power2.png"),
            montserratFontBlack : new EmeraldUtils.Texture(gl, "../shared_resources/Montserrat_ss_alpha_black_power2.png"),
            montserratFont : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/Fonts/Montserrat_ss_alpha_1024x1024_wb.png"),
        }
    }

    _bindCallbacks()
    {
        document.addEventListener('keydown', this.handleKeyDown.bind(this), /*useCapture*/ false);
        document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        document.addEventListener('wheel', this.handleMouseWheel.bind(this), false);

        this.glCanvas.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        this.glCanvas.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        this.glCanvas.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        this.glCanvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), false);
        
        // document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        if(EmeraldUtils.supportPointerLock)
        {
            this.glCanvas.addEventListener("click", this.handleCanvasClicked.bind(this), false);
            EmeraldUtils.configureMultiBrowserPointerLock(this.glCanvas);
            EmeraldUtils.addEventListener_pointerlockchange(this.handlePointerLockChange.bind(this));
        }

        //when user right clicks
        window.addEventListener("contextmenu", this.handleContextMenuRequested.bind(this));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Event Handling
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    handleContextMenuRequested(e)
    {
        // this can be used to prevent the right click menu from popping up
        // but calling e.preventDefault(); in touch events prevents upcoming mouses
        // it appears that if touch events cancel the right-click mouse event, then
        // no context menu will appear. Hence no longer needing to handle it here.
    }

    handleKeyDown(event)
    {
        ////////////////////////////////////////////////////////
        // toggle between orthographic and perspective
        ////////////////////////////////////////////////////////
        if(event.keyCode == key.t)
        {
            this.camera.enableOrthoMode = !this.camera.enableOrthoMode;
            this.camera.enableMouseFollow = false;
            vec3.set(this.camera.forward, 0, 0, -1);
            vec3.set(this.camera.up, 0, 1, 0);
            this.camera._squareBases(); //make basis vectors orthogonal and normal
            // this.glCanvas.exitPointerLock();
        }

        ////////////////////////////////////////////////////////
        // zoom in/out
        ////////////////////////////////////////////////////////
        if(event.keyCode == key.minus_underscore)
        {
            this.updateZoom(1); //this should probably be handled by camera
        }
        if(event.keyCode == key.equals_plus)
        {
            this.updateZoom(-1);
        }

        ////////////////////////////////////////////////////////
        // update position based on keyboard input
        ////////////////////////////////////////////////////////
        let deltaMovement = vec3.fromValues(0,0,0);
        // if(event.keyCode == key.up)
        // {
        //     deltaMovement[0] = deltaMovement[0] + this.camera.up[0];
        //     deltaMovement[1] = deltaMovement[1] + this.camera.up[1];
        //     deltaMovement[2] = deltaMovement[2] + this.camera.up[2];
        // }
        // if(event.keyCode == key.down)
        // {
        //     deltaMovement[0] = deltaMovement[0] + -this.camera.up[0];
        //     deltaMovement[1] = deltaMovement[1] + -this.camera.up[1];
        //     deltaMovement[2] = deltaMovement[2] + -this.camera.up[2];
        // }
        // if(event.keyCode == key.left)
        // {
        //     deltaMovement[0] = deltaMovement[0] + -this.camera.right[0];
        //     deltaMovement[1] = deltaMovement[1] + -this.camera.right[1];
        //     deltaMovement[2] = deltaMovement[2] + -this.camera.right[2];
        // }
        // if(event.keyCode == key.right)
        // {
        //     deltaMovement[0] = deltaMovement[0] + this.camera.right[0];
        //     deltaMovement[1] = deltaMovement[1] + this.camera.right[1];
        //     deltaMovement[2] = deltaMovement[2] + this.camera.right[2];
        // }
        vec3.scale(deltaMovement, deltaMovement, this.camera.speed * this.deltaSec);
        vec3.add(this.camera.position, this.camera.position, deltaMovement);
    }

    handleMouseDown(e)
    {
        this.notifyInputDownEvent(e);
    }

    notifyInputDownEvent(e)
    {
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Boilerplate for othrographic ray cast
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // canvas click will only happen when click is released
        let elementClicked = document.elementFromPoint(e.clientX, e.clientY);
        if(elementClicked && elementClicked == this.glCanvas && this.camera.enableOrthoMode)
        {
            let canvas = this.gl.canvas;
            let canvasHalfWidth = canvas.clientWidth / 2.0;
            let canvasHalfHeight = canvas.clientHeight / 2.0;

            //x-y relative to center of canvas; assuming 0 padding
            let x = (e.clientX - canvas.offsetLeft) - (canvasHalfWidth);
            let y = -((e.clientY - canvas.offsetTop) - (canvasHalfHeight));

            let fractionWidth = x / canvasHalfWidth;
            let fractionHeight = y / canvasHalfHeight;
            
            let aspect = canvas.clientWidth / canvas.clientHeight;
            let orthoHalfHeight = this.camera.orthoHeight / 2.0
            let orthoHalfWidth = (aspect * this.camera.orthoHeight) / 2.0; 

            let numCameraUpUnits = fractionHeight * orthoHalfHeight;
            let numCameraRightUnits = fractionWidth * orthoHalfWidth;

            let rayStart = vec3.clone(this.camera.position);

            { //calculate start point
                let scaledCamUp = vec3.clone(this.camera.up);
                let scaledCamRight = vec3.clone(this.camera.right);
    
                vec3.scale(scaledCamUp, scaledCamUp, numCameraUpUnits);
                vec3.scale(scaledCamRight, scaledCamRight, numCameraRightUnits);
    
                vec3.add(rayStart, rayStart, scaledCamUp);
                vec3.add(rayStart, rayStart, scaledCamRight);
            }

            let rayEnd = vec3.clone(rayStart);
            vec3.add(rayEnd, rayEnd, this.camera.forward);
            
            this.rayStart = rayStart;
            this.rayEnd = rayEnd;

            //if we generated a valid ray, do ray test!
            if(this.rayEnd && this.rayStart)
            {
                let rayDir = vec3.sub(vec3.create(), this.rayEnd, this.rayStart);
                vec3.normalize(rayDir, rayDir);

                //see if ray hits anything
            }
        }
    }

    handleMouseWheel(e)
    {
        //wheel event is not supported by safari
        let normalizedY = e.deltaY / Math.abs(e.deltaY);
        this.updateZoom(normalizedY);
    }

    handleTouchEnd(event)
    {
        event.preventDefault(); //stop mouse event from happening too, don't want double events

        for(const touch of event.changedTouches)
        {
            // console.log("released touch", touch.identifier);
        }
    }

    handleTouchStart(event)
    {
        event.preventDefault(); //stop mouse event

        for(const touch of event.changedTouches)
        {   
            // console.log("added touch", touch.identifier);
            this.notifyInputDownEvent(touch);
        }

    }
    handleTouchMove(event)
    {
        event.preventDefault(); //stop mouse event
    }
    
    handleTouchCancel(event)
    {
        event.preventDefault(); //stop mouse event
    }


    handleCanvasClicked( e )
    {
        if(this.camera.enableOrthoMode)
        {
            //moved to on clickdown so sound is immediate
            // let canvas = this.gl.canvas;
            // let canvasHalfWidth = canvas.clientWidth / 2.0;
            // let canvasHalfHeight = canvas.clientHeight / 2.0;

            // //x-y relative to center of canvas; assuming 0 padding
            // let x = (e.clientX - canvas.offsetLeft) - (canvasHalfWidth);
            // let y = -((e.clientY - canvas.offsetTop) - (canvasHalfHeight));
            // // console.log(x, y);

            // let fractionWidth = x / canvasHalfWidth;
            // let fractionHeight = y / canvasHalfHeight;
            
            // let aspect = canvas.clientWidth / canvas.clientHeight;
            // let orthoHalfHeight = this.camera.orthoHeight / 2.0
            // let orthoHalfWidth = (aspect * this.camera.orthoHeight) / 2.0; 

            // let numCameraUpUnits = fractionHeight * orthoHalfHeight;
            // let numCameraRightUnits = fractionWidth * orthoHalfWidth;

            // let rayStart = vec3.clone(this.camera.position);

            // { //calculate start point
            //     let scaledCamUp = vec3.clone(this.camera.up);
            //     let scaledCamRight = vec3.clone(this.camera.right);
    
            //     vec3.scale(scaledCamUp, scaledCamUp, numCameraUpUnits);
            //     vec3.scale(scaledCamRight, scaledCamRight, numCameraRightUnits);
    
            //     vec3.add(rayStart, rayStart, scaledCamUp);
            //     vec3.add(rayStart, rayStart, scaledCamRight);
            // }

            // let rayEnd = vec3.clone(rayStart);
            // vec3.add(rayEnd, rayEnd, this.camera.forward);
            
            // this.rayStart = rayStart;
            // this.rayEnd = rayEnd;
        }
        else
        {
            //not using ortho... do pointerlock for perspective camera
            this.glCanvas.requestPointerLock();
        }
    }

    handlePointerLockChange()
    {
        if(!this.camera.enableOrthoMode)
        {
            this.camera.enableMouseFollow = EmeraldUtils.isElementPointerLocked(this.glCanvas);
        }
    }

    updateZoom(normalizedY)
    {
        this.camera.orthoHeight = this.camera.orthoHeight + normalizedY * this.zoomSpeed;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Game Logic 
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    run()
    {
        requestAnimationFrame(this.boundGameLoop);
    }

    tick_gameLoop(nowMS)
    {
        let gl = this.gl;

        ////////////////////////////////////////////////////////
        // calculate delta time in seconds
        ////////////////////////////////////////////////////////
        let nowTimeSec = (nowMS * 0.001);
        let deltaSec = nowTimeSec - this.prevFrameTimestampSec;
        this.deltaSec = deltaSec;
        this.prevFrameTimestampSec = nowTimeSec;


        
        this.tick(this.deltaSec);

        this.render(this.deltaSec);

        ////////////////////////////////////////////////////////
        // requet another tick from browser
        ////////////////////////////////////////////////////////
        if(!this.bStopTicks)
        {
            requestAnimationFrame(this.boundGameLoop);
        }
    }

    tick(dt_ms)
    {
        this.gameState.dt_sec = this.deltaSec;

        this.camera.tick(this.deltaSec);
    }

    render(dt_ms)
    {
        let gl = this.gl;
        gl.enable(gl.DEPTH_TEST); 
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(0.0, 0.0, 0.0, 1);
        gl.clearDepth(1.0);
        gl.depthFunc(gl.LEQUAL);  
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        ////////////////////////////////////////////////////////
        // calculate shared rendering data
        ////////////////////////////////////////////////////////
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let perspectiveMat = null;
        if(this.camera.enableOrthoMode) { perspectiveMat = this.camera.getOrtho(aspect * this.camera.orthoHeight, this.camera.orthoHeight);}
        else                            { perspectiveMat = this.camera.getPerspective(aspect); }
        let viewMat = this.camera.getView();

        ////////////////////////////////////////////////////////
        //render ray traces for debugging - 
        ////////////////////////////////////////////////////////
        if(this.bRenderLineTrace && this.rayStart && this.rayEnd)
        {
            this.lineRenderer.renderLine(this.rayStart, this.rayEnd, vec3.fromValues(1,0,0), viewMat, perspectiveMat);
        }
        if(this.bRenderLineTrace && this.rayEnd) //render cube at end of ray to aid visualization in orthographic mode
        {
            let coloredCubeModel = mat4.create();
            mat4.translate(coloredCubeModel, coloredCubeModel, this.rayEnd);
            mat4.scale(coloredCubeModel, coloredCubeModel, vec3.fromValues(0.1, 0.1, 0.1));
            let cubeColor = vec3.fromValues(1,0,0);
            this.coloredCube.bindBuffers();
            this.coloredCube.updateShader(coloredCubeModel, viewMat, perspectiveMat, cubeColor);
            this.coloredCube.render();
        }

        ////////////////////////////////////////////////////////
        // render examples
        ////////////////////////////////////////////////////////
        this.draggableDemo.render(viewMat, perspectiveMat);
        this.textSceneNodeDemo.render( perspectiveMat, viewMat);
    }
}

function handleIphoneWorkaround()
{
    // !!!!!!!! this is apparently not enough to load audio. :\ !!!!!!!!!!!!!!
    //see
    //  https://stackoverflow.com/questions/31776548/why-cant-javascript-play-audio-files-on-iphone-safari
    //  https://www.ibm.com/developerworks/library/wa-ioshtml5/wa-ioshtml5-pdf.pdf
    //  https://community.esri.com/thread/159378

    console.log("iphone workaround");
    // game.bStopTicks = true;
    // game = null; 
    
    game = new Game();
    game.run();

    let iphoneBtn = document.getElementById("enableIphoneAudioButton");
    if(iphoneBtn)
    {
        iphoneBtn.style.display="none";
    }
}

function main()
{
    let iphoneBtn = document.getElementById("enableIphoneAudioButton");

    let suppressStart = false;
    if(iphoneBtn)
    {
        if(!isSafari())
        {
            iphoneBtn.style.display="none";
        } 
        else 
        {
            iphoneBtn.onclick = handleIphoneWorkaround;
            suppressStart = true;
        }
    }

    if(!suppressStart)
    {
        game = new Game();
        game.run();
    }
}


main()