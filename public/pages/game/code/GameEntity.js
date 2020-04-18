import {GameState} from "./GameState.js"
import { DraggableSceneNode_Textured } from "../../shared_resources/EmeraldUtils/draggable.js";
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
        this.speed = 3;
        this.movementDirection = vec3.fromValues(0, -1, 0);
        this.grabbed = false;
        this.markForDelete = false;

        this.currentAnimationTickRateSecs = 0.1;
        this.framesInCurrentAnimation = 4;
        this.animationFrameIdx = 0;
        this.lastAnimationTickTime = 0.0;
        this.animX = 1;
        this.animY = 0;

        this.initStaticAnimations();

        this.setAnimation(warrior_WalkAnim_Front);

        ////////////////////////////////////////////////////////
        // logic and initialization
        ////////////////////////////////////////////////////////
        //set up automatic rendering
        gamestate.renderList.push(this);
    }

    tryCreateTextures()
    {
        if(!staticTextures)
        {
            staticTextures = {}
        }        
    }

    setAnimation(animData)
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
        //Not sure how to get auto completion.... use hinter object to get auto complete lol.
        // let hinter = new GameState();
        // hinter.friendList
        // console.log(hinter.friendList);


        ////////////////////////////////////////////////////////
        // Kinematics
        ////////////////////////////////////////////////////////
        if (!this.grabbed) // if not grabbed
        {
            let deltaMovement  = vec3.scale(vec3.create(), this.movementDirection, this.speed * gamestate.dt_sec);
            let currentLocalPosition = vec3.create();
            this.getLocalPosition(currentLocalPosition);
            let newLocalPosition = vec3.add(vec3.create(), currentLocalPosition, deltaMovement);
            this.setLocalPosition(newLocalPosition);
            //if !grabbed..if. don't move
            //unit vector that is the movement direction
            //float that is the speed
            //tick should be 
            //  deltaMovement = (speed * unitVector * dt_sec);
            // localPosition += deltaMovent 
        }
    
        
        ////////////////////////////////////////////////////////
        // animation
        ////////////////////////////////////////////////////////
        if(this.lastAnimationTickTime + this.currentAnimationTickRateSecs < gamestate.currentTimeSec)
        {
            this.lastAnimationTickTime = gamestate.currentTimeSec;
            this.animationFrameIdx = (this.animationFrameIdx + 1) % this.framesInCurrentAnimation;
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
                paper : new EmeraldUtils.Texture(gl, "./art/textures/paper_tile_128.png"),
                stacey_texture : new EmeraldUtils.Texture(gl, "./art/textures/stacey_texture_1024_64x64.png"),
                amanda_texture : new EmeraldUtils.Texture(gl, "./art/textures/amanda_texture_1024_64x64.png"),
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
            gl.uniform1f(this.texturedQuad.shader.uniforms.uvWidth, 64.0/1024.0); //don't need to set this every tick
            gl.uniform2f(this.texturedQuad.shader.uniforms.tileIdx, this.animX, this.animationFrameIdx + this.animY);

            this.render(gs.viewMat, gs.projectionMat);
        }
    }
}