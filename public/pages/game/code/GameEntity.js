import {GameState} from "./GameState.js"
import { DraggableSceneNode_Textured } from "../../shared_resources/EmeraldUtils/draggable.js";
import { Camera } from "../../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import { f } from "../../shared_resources/EmeraldUtils/browser_key_codes.js";
import * as EmeraldUtils from "../../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import { texturedQuadFactory } from "../../shared_resources/EmeraldUtils/emerald_easy_shapes.js";

import { mat4, vec3, vec4 } from "../../shared_resources/gl-matrix_esm/index.js";

let staticTextures = null;
let staticTextureQuad = null;

const tileShader_vs =
`
    attribute vec4 vertPos;
    attribute vec3 vertNormal;
    attribute vec2 texUVCoord; //probably don't need this

    uniform mat4 model;
    uniform mat4 view_model;
    uniform mat4 normalMatrix; //the inverse transpose of the view_model matrix
    uniform mat4 projection;

    uniform vec2 tileIdx;
    uniform float uvWidth;

    varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+

    void main(){
        gl_Position = projection * view_model * vertPos;

        // float scaleDownFactor = 64.0/1024.0; // [0,1]
        // vec2 testStartUV = vec2(0.0*scaleDownFactor,2.0*scaleDownFactor);
        // uvCoord = (scaleDownFactor * texUVCoord) + testStartUV;

        vec2 testStartUV = vec2(tileIdx.x*uvWidth,    tileIdx.y*uvWidth);
        uvCoord = (uvWidth * texUVCoord) + testStartUV;
    }
`;

const tileShader_fs = `
    varying highp vec2 uvCoord;
    uniform sampler2D texSampler;

    void main(){
        gl_FragColor = texture2D(texSampler, uvCoord);
        if(gl_FragColor.a < 0.05)
        {
            discard;
        }
    }
`;

class AnimationTextureData
{
    constructor(animX, animY, framesPerTexture, frameTimeSec, srcTexture)
    {
        this.animX = animX;
        this.animY = animY;
        this.framesPerTexture = framesPerTexture;
        this.frameTimeSec = frameTimeSec;
        this.srcTexture = srcTexture;
    }
}

let warrior_WalkAnim_Front      = null; //new AnimationTextureData();
let warrior_WalkAnim_Back       = null; //new AnimationTextureData();
let warrior_AttackAnim_Front    = null; //new AnimationTextureData();
let warrior_AttackAnim_Back     = null; //new AnimationTextureData();
let warrior_DamagedAnim_Front   = null; //new AnimationTextureData();
let warrior_DamagedAnim_Back    = null; //new AnimationTextureData();
let warrior_GrabbedAnim         = null; //new AnimationTextureData();

let archer_WalkAnim_Front       = null; //new AnimationTextureData();
let archer_WalkAnim_Back        = null; //new AnimationTextureData();
let archer_AttackAnim_Front     = null; //new AnimationTextureData();
let archer_AttackAnim_Back      = null; //new AnimationTextureData();
let archer_DamagedAnim_Front    = null; //new AnimationTextureData();
let archer_DamagedAnim_Back     = null; //new AnimationTextureData();
let archer_GrabbedAnim          = null; //new AnimationTextureData();

let mage_WalkAnim_Front         = null;//new AnimationTextureData();
let mage_WalkAnim_Back          = null;//new AnimationTextureData();
let mage_AttackAnim_Front       = null;//new AnimationTextureData();
let mage_AttackAnim_Back        = null;//new AnimationTextureData();
let mage_DamagedAnim_Front      = null;//new AnimationTextureData();
let mage_DamagedAnim_Back       = null;//new AnimationTextureData();
let mage_GrabbedAnim            = null;//new AnimationTextureData();

let king_WalkAnim_Front         = null;// new AnimationTextureData();
let king_WalkAnim_Back          = null;// new AnimationTextureData();
let king_DamagedAnim            = null;// new AnimationTextureData();

export let testAnims = [];

export class GameEntity extends DraggableSceneNode_Textured
{
    constructor(gamestate, type) 
    {
        super(gamestate.gl, /*register draggable events*/true, gamestate.canvas, gamestate.camera);

        ////////////////////////////////////////////////////////
        // fields
        ////////////////////////////////////////////////////////
        this.type = type;
        this.isFriend = true;
        this.speed = gamestate.CONST_KING_SPEED;
        this.movementDirection = vec3.fromValues(0, 1, 0);
        this.markForDelete = false;
        this.gamestate = gamestate; //just caching this because it is easier for now! gamejam hacks!

        this.currentAnimationTickRateSecs = 0.1;
        this.framesInCurrentAnimation = 4;
        this.animationFrameIdx = 0;
        this.lastAnimationTickTime = 0.0;
        this.animX = 1;
        this.animY = 0;
        this.uvScale = 64.0/1024.0;

        this.initStaticAnimations();

        this.setAnimation(gamestate, this.type, false);

        ////////////////////////////////////////////////////////
        // logic and initialization
        ////////////////////////////////////////////////////////
        //set up automatic rendering
        gamestate.renderList.push(this);
    }

    setAnimation(gamestate, type, isGrab)
    {
        if (this.type == gamestate.CONST_WARRIOR)
        {
            if (isGrab)
            {
                this.setAnimationData(warrior_GrabbedAnim);
            }
            else
            {
                this.setAnimationData(warrior_WalkAnim_Front);
            }
            
        }
        else if (this.type == gamestate.CONST_ARCHER)
        {
            if (isGrab)
            {
                this.setAnimationData(archer_GrabbedAnim);
            }
            else
            {
                this.setAnimationData(archer_WalkAnim_Front);
            }
        }
        else if (this.type == gamestate.CONST_MAGE)
        {
            if (isGrab)
            {
                this.setAnimationData(mage_GrabbedAnim);
            }
            else
            {
                this.setAnimationData(mage_WalkAnim_Front);
            }
        }
        else if (this.type == gamestate.CONST_KING)
        {
            this.setAnimationData(king_WalkAnim_Front);
        }
        else
        {
            // FAIL SAFE
            this.setAnimationData(warrior_GrabbedAnim);
        }
    }

    defeatKing()
    {
        this.setAnimationData(king_DamagedAnim);
    }

    tryCreateTextures()
    {
        if(!staticTextures)
        {
            staticTextures = {}
        }        
    }

    setAnimationData(animData)
    {
        if(animData)
        {
            this.animationFrameIdx = 0;
            this.currentAnimationTickRateSecs = animData.frameTimeSec;
            this.framesInCurrentAnimation = animData.framesPerTexture;
            this.lastAnimationTickTime = animData.frameTimeSec;
            this.animX = animData.animX;
            this.animY = animData.animY;
            this.activeTexture =animData.srcTexture;
        }
    }

    _getActiveTexture()
    {
        return this.activeTexture;
    }

    initStaticAnimations()
    {
        //if first animation is present, assume they all have already been initialized
        if(!warrior_WalkAnim_Front)
        {
            warrior_WalkAnim_Front      = new AnimationTextureData(2,  0,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            warrior_WalkAnim_Back       = new AnimationTextureData(3,  0,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            warrior_AttackAnim_Front    = null; //new AnimationTextureData();
            warrior_AttackAnim_Back     = null; //new AnimationTextureData();
            warrior_DamagedAnim_Front   = null; //new AnimationTextureData();
            warrior_DamagedAnim_Back    = null; //new AnimationTextureData();
            warrior_GrabbedAnim         = new AnimationTextureData(2,  5,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            
            archer_WalkAnim_Front       = new AnimationTextureData(0,  0,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            archer_WalkAnim_Back        = new AnimationTextureData(2,  0,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            archer_AttackAnim_Front     = null; //new AnimationTextureData();
            archer_AttackAnim_Back      = null; //new AnimationTextureData();
            archer_DamagedAnim_Front    = null; //new AnimationTextureData();
            archer_DamagedAnim_Back     = null; //new AnimationTextureData();
            archer_GrabbedAnim          = null; //new AnimationTextureData();
            
            mage_WalkAnim_Front         = new AnimationTextureData(0,  0,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            mage_WalkAnim_Back          = new AnimationTextureData(1,  0,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            mage_AttackAnim_Front       = null;//new AnimationTextureData();
            mage_AttackAnim_Back        = null;//new AnimationTextureData();
            mage_DamagedAnim_Front      = null;//new AnimationTextureData();
            mage_DamagedAnim_Back       = null;//new AnimationTextureData();
            mage_GrabbedAnim            = new AnimationTextureData(0,  5,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            
            king_WalkAnim_Front         = new AnimationTextureData(1,  0,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            king_WalkAnim_Back          = new AnimationTextureData(3,  0,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            king_DamagedAnim            = new AnimationTextureData(4,  0,  1,  0.1, staticTextures.stacey_texture.glTextureId);


            //debug set anim data
            testAnims.push( warrior_WalkAnim_Front    );
            testAnims.push( warrior_WalkAnim_Back     );
            testAnims.push( warrior_AttackAnim_Front  );
            testAnims.push( warrior_AttackAnim_Back   );
            testAnims.push( warrior_DamagedAnim_Front );
            testAnims.push( warrior_DamagedAnim_Back  );
            testAnims.push( warrior_GrabbedAnim       );
            testAnims.push( archer_WalkAnim_Front     );
            testAnims.push( archer_WalkAnim_Back      );
            testAnims.push( archer_AttackAnim_Front   );
            testAnims.push( archer_AttackAnim_Back    );
            testAnims.push( archer_DamagedAnim_Front  );
            testAnims.push( archer_DamagedAnim_Back   );
            testAnims.push( archer_GrabbedAnim        );
            testAnims.push( mage_WalkAnim_Front       );
            testAnims.push( mage_WalkAnim_Back        );
            testAnims.push( mage_AttackAnim_Front     );
            testAnims.push( mage_AttackAnim_Back      );
            testAnims.push( mage_DamagedAnim_Front    );
            testAnims.push( mage_DamagedAnim_Back     );
            testAnims.push( mage_GrabbedAnim          );
            testAnims.push( king_WalkAnim_Front       );
            testAnims.push( king_WalkAnim_Back        );
            testAnims.push( king_DamagedAnim          );
        }

    }
    
    tick(gamestate)
    {   
        //fix issue where when moving draggables slide; this is mostly a bandaid rather than real fix (probably using scene nodes)
        if(this.bDragging)  //hacks
        {
            this.startParentLocalPos[0] += gamestate.kingMoveDeltaX;
            this.startParentLocalPos[1] += gamestate.kingMoveDeltaY;

            let currPos = vec3.create();
            this.getLocalPosition(currPos);
            currPos[0] += gamestate.kingMoveDeltaX;
            currPos[1] += gamestate.kingMoveDeltaY;
            this.setLocalPosition(currPos);
        }

        ////////////////////////////////////////////////////////
        // Kinematics
        ////////////////////////////////////////////////////////
        if (!this.bDragging 
            && !this.bIsPaperEntity
            ) // if not grabbed
        {
            let deltaMovement  = vec3.scale(vec3.create(), this.movementDirection, this.speed * gamestate.dt_sec);
            let currentLocalPosition = vec3.create();
            this.getLocalPosition(currentLocalPosition);
            let newLocalPosition = vec3.add(vec3.create(), currentLocalPosition, deltaMovement);
            this.setLocalPosition(newLocalPosition);
        }
    
        
        ////////////////////////////////////////////////////////
        // animation
        ////////////////////////////////////////////////////////
        if(this.lastAnimationTickTime + this.currentAnimationTickRateSecs < gamestate.currentTimeSec
             && !this.bIsPaperEntity
            )
        {
            this.lastAnimationTickTime = gamestate.currentTimeSec;
            this.animationFrameIdx = (this.animationFrameIdx + 1) % this.framesInCurrentAnimation;
        }

        ////////////////////////////////////////////////////////
        // paper
        ////////////////////////////////////////////////////////
        if(this.bIsPaperEntity)
        {
            let myPos = vec3.create();
            this.getLocalPosition(myPos);

            if(myPos[1] + gamestate.CONST_PAPERSIZE * 1  < gamestate.camera.position[1])
            {
                myPos[1] = myPos[1] + gamestate.CONST_PAPERSIZE * 3;
                this.setLocalPosition(myPos);
            }
        }
    }

    _createTextures(gl)
    {
        if(!staticTextures)
        {
            staticTextures = {
                // depad : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/Icons/DepadIcon3.png"),
                // rockpaperscissors : new EmeraldUtils.Texture(gl, "./art/Examples/RockPaperScissor.png"),
                depad : new EmeraldUtils.Texture(gl, "./art/Examples/RockPaperScissors.png"),
                paper : new EmeraldUtils.Texture(gl, "./art/textures/paper_tile_256.png"),
                stacey_texture : new EmeraldUtils.Texture(gl, "./art/textures/stacey_texture_1024_64x64.png"),
                // amanda_texture : new EmeraldUtils.Texture(gl, "./art/textures/amanda_texture_1024_64x64.png"),
                amanda_texture : new EmeraldUtils.Texture(gl, "./art/textures/rt_amanda_texture_1024_64x64.png"),
            };
        }
        return staticTextures;
    }

    _createTextureQuad()
    {
        if(!staticTextureQuad)
        {
            staticTextureQuad = texturedQuadFactory(
                this.gl,
                tileShader_vs,
                tileShader_fs);
        }
        this.texturedQuad = staticTextureQuad;
        this.texturedQuad.shader.uniforms["uvWidth"] = this.gl.getUniformLocation(this.texturedQuad.shader.program, "uvWidth");
        this.texturedQuad.shader.uniforms["tileIdx"] = this.gl.getUniformLocation(this.texturedQuad.shader.program, "tileIdx");
    }

    makePaperEntity()
    {
        this.activeTexture = staticTextures.paper.glTextureId;
        this.bEnableDrag = false;
        this.bIsPaperEntity = true;
        this.speed = 0;

        //don't need to animate at all, but set up an animation state
        this.currentAnimationTickRateSecs = 1;
        this.framesInCurrentAnimation = 0;
        this.animationFrameIdx = 0;
        this.lastAnimationTickTime = 0.0;
        this.animX = 0;
        this.animY = 0;
        this.uvScale = 3.0;

    }

    makeKingEntity()
    {
        // this.curremtAm
        this.bEnableDrag = false;
        this.setAnimation(this.gamestate, this.gamestate.CONST_KING, false);
        this.speed = this.gamestate.CONST_KING_SPEED;
        this.movementDirection = vec3.fromValues(0, 1, 0);
    }

    renderEntity(gamestate)
    {
        let gs = gamestate;

        if(gs.projectionMat && gs.viewMat)
        {
            ////////////////////////////////////////////////////////
            // update shader
            ////////////////////////////////////////////////////////
            let gl = gamestate.gl;
    
            gl.useProgram(staticTextureQuad.shader.program);
            
            // gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
            gl.uniform1f(this.texturedQuad.shader.uniforms.uvWidth, this.uvScale); 
            gl.uniform2f(this.texturedQuad.shader.uniforms.tileIdx, this.animX, this.animationFrameIdx + this.animY);

            this.render(gs.viewMat, gs.projectionMat);
        }
    }
}