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
import { GameEntitySpawner } from "./code/GameEntitySpawner.js";
import {GameEntity, testAnims} from "./code/GameEntity.js";
import { GameButton } from "./code/GameButton.js";


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
        this.bitmapFont = new Montserrat_BMF(this.gl, "../shared_resources/Textures/Fonts/Montserrat_ss_alpha_1024x1024_wb_invert.png");

        this.textSceneNodeDemo = new TextBlockSceneNode(this.gl, this.bitmapFont, "This is a text scene node; it is a child of draggable above!" );
        this.textSceneNodeDemo.setLocalScale(vec3.fromValues(10,10,10));
        this.textSceneNodeDemo.setLocalPosition(vec3.fromValues(0,-1,0));
        this.textSceneNodeDemo.setParent(this.draggableDemo);

        this.scoreText = new TextBlockSceneNode(this.gl, this.bitmapFont, "Score:" );

        ///////////////////////////////////////////////////////////////////////////
        // Bind handlers to events
        ///////////////////////////////////////////////////////////////////////////
        this._bindCallbacks();

        this._initGame();
        
    }

    _initGame()
    {
        ////////////////////////////////////////////////////////
        // initialize game state
        ////////////////////////////////////////////////////////
        this.gamestate = new GameState();
        this.gamestate.canvas = this.glCanvas;
        this.gamestate.gl = this.gl;
        this.gamestate.camera = this.camera;

        this._setupPaperBG(); //init before anything can so paper can be in the background

        //init after set up 
        this.gamestate.init(); //doing this after initing background
        this.gamestate.king = new GameEntity(this.gamestate, this.gamestate.CONST_KING);
        this.gamestate.king.makeKingEntity();
        this.lastKingPos = vec3.fromValues(0,0,0);

        this.resetButton = new GameButton("Restart?", this.gamestate, this.bitmapFont);
        this.resetButton.setLocalPosition(vec3.fromValues(0,-50,0));
        this.resetButton.onClicked = this._initGame.bind(this);

        ////////////////////////////////////////////////////////
        // debug
        ////////////////////////////////////////////////////////
        this.testAnimEntity = new GameEntity(this.gamestate);
        this.testAnimEntity.setLocalPosition(vec3.fromValues(5, -20, 0)); //easter egg
        this.testAnimEntity.setLocalPosition(vec3.fromValues(5, -0, 0)); //test
        this.testAnimEntity.setLocalScale(vec3.fromValues(3, 3, 3));
        this.testAnimIndex = 0;

        this.camera.enableInput = this.gamestate.CONST_ENABLE_DEBUG;


        ////////////////////////////////////////////////////////
        // initialize starting objects
        ////////////////////////////////////////////////////////
        this.gamestate.entitySpawner = new GameEntitySpawner(this.gamestate);

        this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_MAGE);
        //this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_MAGE);
        //this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_MAGE);

        this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_WARRIOR);
        //this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_WARRIOR);
        //this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_WARRIOR);

        this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_ARCHER);
        //this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_ARCHER);
        //this.gamestate.entitySpawner.spawnFriend(this.gamestate, this.gamestate.CONST_ARCHER);
    }

    _resetGame()
    {

    }

    _setupPaperBG()
    {
        let paperSize = this.gamestate.CONST_PAPERSIZE;
        let scale = vec3.fromValues(paperSize,paperSize,paperSize);

        this.paperTileMiddle = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileMiddle.makePaperEntity(); //not great but gamejam!
        this.paperTileMiddle.setLocalScale(scale);

        this.paperTileTop = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileTop.makePaperEntity(); //not great but gamejam!
        this.paperTileTop.setLocalScale(scale);
        this.paperTileTop.setLocalPosition(vec3.fromValues(0,paperSize,0));
        
        this.paperTileBottom = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileBottom.makePaperEntity(); //not great but gamejam!
        this.paperTileBottom.setLocalScale(scale);
        this.paperTileBottom.setLocalPosition(vec3.fromValues(0,-paperSize,0));

        this.paperTileMiddleLEFT = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileMiddleLEFT.makePaperEntity(); //not great but gamejam!
        this.paperTileMiddleLEFT.setLocalScale(scale);
        this.paperTileMiddleLEFT.setLocalPosition(vec3.fromValues(-paperSize,0,0));
        this.paperTileTopLEFT = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileTopLEFT.makePaperEntity(); //not great but gamejam!
        this.paperTileTopLEFT.setLocalScale(scale);
        this.paperTileTopLEFT.setLocalPosition(vec3.fromValues(-paperSize,paperSize,0));
        this.paperTileBottomLEFT = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileBottomLEFT.makePaperEntity(); //not great but gamejam!
        this.paperTileBottomLEFT.setLocalScale(scale);
        this.paperTileBottomLEFT.setLocalPosition(vec3.fromValues(-paperSize,-paperSize,0));

        this.paperTileMiddleRIGHT = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileMiddleRIGHT.makePaperEntity(); //not great but gamejam!
        this.paperTileMiddleRIGHT.setLocalScale(scale);
        this.paperTileMiddleRIGHT.setLocalPosition(vec3.fromValues(paperSize,0,0));
        this.paperTileTopRIGHT = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileTopRIGHT.makePaperEntity(); //not great but gamejam!
        this.paperTileTopRIGHT.setLocalScale(scale);
        this.paperTileTopRIGHT.setLocalPosition(vec3.fromValues(paperSize,paperSize,0));
        this.paperTileBottomRIGHT = new GameEntity(this.gamestate, this.gamestate.CONST_PAPERTYPE);
        this.paperTileBottomRIGHT.makePaperEntity(); //not great but gamejam!
        this.paperTileBottomRIGHT.setLocalScale(scale);
        this.paperTileBottomRIGHT.setLocalPosition(vec3.fromValues(paperSize,-paperSize,0));

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
        if(this.gamestate && this.gamestate.CONST_ENABLE_DEBUG)
        {
            let normalizedY = e.deltaY / Math.abs(e.deltaY);
            this.updateZoom(normalizedY);
        }
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
        let gs = this.gamestate;

        ////////////////////////////////////////////////////////
        // Camera stuff and matrix stuff
        ////////////////////////////////////////////////////////

        ////////////////////////////////////////////////////////
        // input
        ////////////////////////////////////////////////////////
        if(this.testAnimEntity)
        {
            if(this.inputMonitor.pressedStateArray[key.z])
            {
                // this.inputMonitor.pressedStateArray[key.z] = false;
                this.testAnimIndex -= 1;
                if(this.testAnimIndex < 0) this.testAnimIndex = 0;
                this.testAnimEntity.setAnimationData(testAnims[this.testAnimIndex]);

            }
            if(this.inputMonitor.pressedStateArray[key.x])
            {
                // this.inputMonitor.pressedStateArray[key.x] = false;
                this.testAnimIndex += 1;
                if(this.testAnimIndex >= testAnims.length) this.testAnimIndex = testAnims.length - 1;
                this.testAnimEntity.setAnimationData(testAnims[this.testAnimIndex]);
            }
        }

        ////////////////////////////////////////////////////////
        // Entity Ticking (must come after camera and input)
        ////////////////////////////////////////////////////////
        gs.dt_sec = this.deltaSec;
        gs.currentTimeSec += this.deltaSec;

        ////////////////////////////////////////////////////////
        // king
        gs.king.tick(gs);
        if(gs.king)
        {
            let kingPos = vec3.create();
            gs.king.getLocalPosition(kingPos);
            this.camera.position[0] = kingPos[0];
            this.camera.position[1] = kingPos[1] + this.gamestate.CONST_CAMERA_KING_Y_OFFSET;
            // this.camera.position[2] = kingPos[2];
            gs.kingMoveDeltaX = kingPos[0] - this.lastKingPos[0];
            gs.kingMoveDeltaY = kingPos[1] - this.lastKingPos[1];
            this.lastKingPos[0] = kingPos[0];
            this.lastKingPos[1] = kingPos[1];
        }
        ////////////////////////////////////////////////////////
        this.paperTileTop.tick(this.gamestate);
        this.paperTileMiddle.tick(this.gamestate);
        this.paperTileBottom.tick(this.gamestate);
        this.paperTileTopLEFT.tick(this.gamestate);
        this.paperTileMiddleLEFT.tick(this.gamestate);
        this.paperTileBottomLEFT.tick(this.gamestate);
        this.paperTileTopRIGHT.tick(this.gamestate);
        this.paperTileMiddleRIGHT.tick(this.gamestate);
        this.paperTileBottomRIGHT.tick(this.gamestate);

        gs.entitySpawner.tick(gs);


        for(let friend of gs.friendList)
        {
            friend.tick(gs);
        }

        for(let enemy of gs.enemyList)
        {
            enemy.tick(gs);
        }

        for (let prop of gs.propRenderList)
        {
            prop.tick(gs);
        }

        /////////////////////////////////////////////////////////////////////////////
        // collison section
        // warrior beats archer
        // archer beats mage
        // mage beats warrior
        let offsetEnemyLambda = function(enemy, gamestate){
            let enemyPos = vec3.create();
            enemy.getLocalPosition(enemyPos);
            enemyPos[1]+= gamestate.CONST_BUMP_ENEMY_OFFSET;
            enemy.setLocalPosition(enemyPos);
        };
        for(let enemy of gs.enemyList)
        {
            let enemyPosition = vec3.create();
            enemy.getLocalPosition(enemyPosition);
            for(let friend of gs.friendList)
            {
                let friendPosition = vec3.create();
                friend.getLocalPosition(friendPosition);
                let dist = vec3.distance(enemyPosition, friendPosition);
                if (dist <= 1 && !enemy.dead)
                {
                    // TODO: destroy the game entities that needs to be destroyed
                    if (enemy.type == gs.CONST_WARRIOR)
                    {
                        if (friend.type == gs.CONST_ARCHER)
                        {
                            friend.setDamage(1)
                            enemy.notify_thisGuyJustAttacked();
                            offsetEnemyLambda(enemy, this.gamestate);
                        }
                        else if (friend.type == gs.CONST_MAGE)
                        {
                            enemy.setDamage(1);
                            friend.notify_thisGuyJustAttacked();
                        }
                        else
                        {
                            friend.setDamage(1)
                            enemy.setDamage(1);
                            offsetEnemyLambda(enemy, this.gamestate);
                        }
                    }
                    else if (enemy.type == gs.CONST_ARCHER)
                    {
                        if (friend.type == gs.CONST_MAGE)
                        {
                            friend.setDamage(1)
                            enemy.notify_thisGuyJustAttacked();
                            offsetEnemyLambda(enemy, this.gamestate);
                        }
                        else if (friend.type == gs.CONST_WARRIOR)
                        {
                            enemy.setDamage(1);
                            friend.notify_thisGuyJustAttacked();
                        }
                        else
                        {
                            friend.setDamage(1)
                            enemy.setDamage(1);
                            offsetEnemyLambda(enemy, this.gamestate);
                        }
                    }
                    else if (enemy.type == gs.CONST_MAGE)
                    {
                        if (friend.type == gs.CONST_WARRIOR)
                        {
                            friend.setDamage(1);
                            enemy.notify_thisGuyJustAttacked();
                            offsetEnemyLambda(enemy, this.gamestate);
                        }
                        else if (friend.type == gs.CONST_ARCHER)
                        {
                            enemy.setDamage(1);
                            friend.notify_thisGuyJustAttacked();
                        }
                        else
                        {
                            friend.setDamage(1);
                            enemy.setDamage(1);
                            offsetEnemyLambda(enemy, this.gamestate);
                        }
                    }
                }
            }
        }

        let kingPosition = vec3.create();
        gs.king.getLocalPosition(kingPosition);

        for(let enemy of gs.enemyList)
        {
            let enemyPosition = vec3.create();
            enemy.getLocalPosition(enemyPosition);

            let dist = vec3.distance(enemyPosition, kingPosition);
            if (dist <= 1 && !enemy.dead)
            {
                if(!gs.king.tryDefeatKing())
                {
                    //did not default, king defeats this unit
                    enemy.setDamage(100);
                }
            }
        }

        // end collision section
        /////////////////////////////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////////////////////
        // CLEAN UP SECTION

        // mark game entities for deletion

        for(let friend of gs.friendList)
        {
            let friendPosition = vec3.create();
            friend.getLocalPosition(friendPosition);
            if (friend.dead && friendPosition[1] <= kingPosition[1] - 15)
            {
                friend.markForDelete = true;
            }
        }
        
        for(let enemy of gs.enemyList)
        {
            let enemyPosition = vec3.create();
            enemy.getLocalPosition(enemyPosition);

            if (enemy.dead && enemyPosition[1] <= kingPosition[1] - 15)
            {
                enemy.markForDelete = true;
            }
        }

        for (let prop of gs.propRenderList)
        {
            let propPosition = vec3.create();
            prop.getLocalPosition(propPosition);
            
            if (propPosition[1] <= kingPosition[1] - 15)
            {
                prop.markForDelete = true;
            }
        }

        // update friend and enemy list for gameplay

        let updatedFriendList = [];
        for(let friend of gs.friendList)
        {
            if (!friend.dead)
            {
                updatedFriendList.push(friend);
            }
        }
        gs.friendList = updatedFriendList;

        let updatedEnemyList = [];
        for(let enemy of gs.enemyList)
        {
            if (!enemy.dead)
            {
                updatedEnemyList.push(enemy);
            }
        }

        gs.friendList = updatedFriendList;
        gs.enemyList = updatedEnemyList;

        // actually delete game entites
        let newRenderList= [];
        for (let entity of gs.renderList)
        {
            if (!entity.markForDelete)
            {
                newRenderList.push(entity);
            }
        }

        let updatedPropRenderList = [];
        for (let prop of gs.propRenderList)
        {
            if (!prop.markForDelete)
            {
                updatedPropRenderList.push(prop);
            }
        }

        gs.propRenderList = updatedPropRenderList;
        gs.renderList = newRenderList;

        // END CLEAN UP SECTION
        /////////////////////////////////////////////////////////////////////////////


        this.bShowTestAnim = true;
        if(this.bShowTestAnim)
        {
            this.testAnimEntity.tick(gs);
            this.testAnimEntity.speed = gs.CONST_KING_SPEED;
        }

        this.camera.tick(this.deltaSec);
        
        if(this.gamestate.king.dead)
        {
            this.resetButton.bEnableDrag = true;
            this.resetButton.tick(this.gamestate);
        }
        else
        {
            this.resetButton.bEnableDrag = false;
        }
    }

    render(dt_ms)
    {
        let gl = this.gl;
        gl.enable(gl.DEPTH_TEST); 
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(0.5, 0.5, 0.5, 1);
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

        this.gamestate.projectionMat = perspectiveMat;
        this.gamestate.viewMat = viewMat;

        ////////////////////////////////////////////////////////
        // render examples
        ////////////////////////////////////////////////////////
        // this.draggableDemo.render(viewMat, perspectiveMat);
        // this.textSceneNodeDemo.render( perspectiveMat, viewMat);

        ////////////////////////////////////////////////////////
        // Render all renables
        ////////////////////////////////////////////////////////
        for(let bg of this.gamestate.backgroundRenderList)
        {
            bg.renderEntity(this.gamestate);
        }
        for (let renderable of this.gamestate.propRenderList)
        {
            renderable.renderEntity(this.gamestate);
        }

        for(let renderable of this.gamestate.renderList)
        {
            renderable.renderEntity(this.gamestate);
        }

        if(this.gamestate.king.dead)
        {
            //only render reset when game over
            this.resetButton.render(this.gamestate);
        }
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