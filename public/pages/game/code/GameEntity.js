import {GameState} from "./gamestate.js"
import { DraggableSceneNode_Textured } from "../../shared_resources/EmeraldUtils/draggable.js";
import { Camera } from "../../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import { f } from "../../shared_resources/EmeraldUtils/browser_key_codes.js";
import * as EmeraldUtils from "../../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import { texturedQuadFactory } from "../../shared_resources/EmeraldUtils/emerald_easy_shapes.js";

import { mat4, vec3, vec4, quat } from "../../shared_resources/gl-matrix_esm/index.js";

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


    ////////////////////////////////////////////////////////
    // CODE FROM C++ GAME UTILS
    ////////////////////////////////////////////////////////
    function float_equals(value, compareValue, epsilon = 0.001)
    {
        let delta = Math.abs(value - compareValue);
        let result = delta < epsilon;
        return result;
    }

    function vectorsAreSame(first,second,epsilon = 0.001)
    {
        return float_equals(first[0], second[0], epsilon)
            && float_equals(first[1], second[1], epsilon)
            && float_equals(first[2], second[2], epsilon);
    }
    function getDifferentVector(vec)
    {
        let x = vec[0];
        let y = vec[1];
        let z = vec[2];
        if (x < y && x < z)
        {
            x = 1.0;
        }
        else if (y < x && y < z)
        {
            y = 1.0;
        }
        else if (z < x && z < y)
        {
            z = 1.0;
        }
        else //all are equal
        {
            if (x > 0.0)
            {
                x = -1;
            }
            else
            {
                x = 1;
            }
        }
        return vec3.fromValues(x,y,z);
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

    function getRotationBetweenVectors(from_n, to_n)
    {
        let rot = quat.identity(quat.create()); //unit quat

        let cosTheta = clamp(vec3.dot(from_n, to_n), -1.0, 1.0); //clamp to be safe for acos

        let bVectorsAre180 = float_equals(cosTheta, -1.0);
        let bVectorsAreSame = float_equals(cosTheta, 1.0);

        if (!bVectorsAreSame && !bVectorsAre180)
        {
            let rotAxis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), from_n, to_n));
            let rotAngle_rad = Math.acos(cosTheta);
            rot = quat.setAxisAngle(quat.create(), rotAxis, rotAngle_rad);
        }
        else if (bVectorsAre180)
        {
            //if tail end and front of projectile are not the same, we need a 180 rotation around ?any? axis
            let temp = getDifferentVector(from_n);

            let bTemp180 = float_equals(clamp(vec3.dot(from_n, temp), -1.0, 1.0), -1.0);
            if (bTemp180) { 
                let offsetVec = vec3.fromValues(1,1,1);
                temp = vec3.add(temp, temp, offsetVec);
            }

            let rotAxisFor180 = vec3.normalize(vec3.create() ,vec3.cross(vec3.create(), from_n, temp));

            rot = quat.setAxisAngle(quat.create(), rotAxisFor180, 3.1415);
        }

        return rot;
    }

    ////////////////////////////////////////////////////////
    // END CODE FROM C++ UTILS
    ////////////////////////////////////////////////////////


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

let prop_rockAnim            = null;
let prop_bushAnim            = null;
let prop_waterAnim            = null;
let prop_grassAnim            = null;

let buttonAnimData            = null;
let arrowAnimData            = null;

let pencil_anim            = null;


export let testAnims = [];

let staticArrowRenderer = null;

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
        this.dead = false;
        this.gamestate = gamestate; //just caching this because it is easier for now! gamejam hacks!
        this.hp = 1;
        this.disabledStartTime = -500;  //don't disable from start

        this.currentAnimationTickRateSecs = 0.1;
        this.framesInCurrentAnimation = 4;
        this.animationFrameIdx = 0;
        this.lastAnimationTickTime = 0.0;
        this.animX = 1;
        this.animY = 0;
        this.uvScale = 64.0/1024.0;
        this.stunTimeStamp = -500; //don't stun at spawn
        this.preStunAnimation = null;
        this.previousDragAnim = null;
        this.dragAnimation = null;
        this.stunAnimation = null;
        this.bClearStunAnim = false;

        // this.hurtSound = new EmeraldUtils.Sound( "../shared_resources/Sounds/PianoKeySounds/A2.wav");
                                                                        

        this.initStaticAnimations();
        if(!staticArrowRenderer)
        {
            staticArrowRenderer = "Hi, i'm a hack.";    //set to SOME value so we don't recurse to oblivion when creating the shared arrow entity; total hack
            staticArrowRenderer = new GameEntity(gamestate, "ARROW");
            staticArrowRenderer.setAnimationData(arrowAnimData);
            staticArrowRenderer.setLocalScale(vec3.fromValues(0.25,0.25,0.25));
            staticArrowRenderer.bEnableDrag = false;
            staticArrowRenderer.speed = 0;
        }

        if (type != gamestate.CONST_PROP)
        {
            this.setAnimation(gamestate, this.type, false);   
        }
        else
        {
            this.setPropAnimation(gamestate);
        }

        ////////////////////////////////////////////////////////
        // logic and initialization
        ////////////////////////////////////////////////////////
        //set up automatic rendering

        if (type == gamestate.CONST_PROP)
        {
            gamestate.propRenderList.push(this);
        }
        else if (type == gamestate.CONST_PAPERTYPE)
        {
            gamestate.backgroundRenderList.push(this);
        }
        else if(type == gamestate.CONST_BUTTONTYPE || type == "ARROW")
        {
            //button type needs to be rendered manually!
        }
        else
        {
            gamestate.renderList.push(this);   
        }
    }

    setPropAnimation(gamestate)
    {
        let randomPropIndex = gamestate.entitySpawner.GetRandomNumberInRange(0, 3);

        switch(randomPropIndex)
        {
            case 0:
                this.setAnimationData(prop_rockAnim);
                break;
            case 1:
                this.setAnimationData(prop_bushAnim);
                break;
            case 2:
                this.setAnimationData(prop_waterAnim);
                break;
            case 3:
                this.setAnimationData(prop_grassAnim);
                break;
            default:
                // FAIL SAFE
                this.setAnimationData(prop_rockAnim);
                break;
        }
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
            // FAIL SAFE, currently props
            this.setAnimationData(warrior_GrabbedAnim);
        }
    }

    tryDefeatKing()
    {
        this.setDamage(1);
        this.gamestate.score_since_king_damaged = 0;

        if(this.hp <= 0)
        {
            for(let friend of this.gamestate.friendList)
            {
                friend.die();
            }
            return true;
        }
        return false
    }

    tryCreateTextures()
    {
        if(!staticTextures)
        {
            staticTextures = {}
        }        
    }

    onDragStarted() 
    {
        this.setAnimation(this.gamestate, this.type, /*drag*/true);
    }
    onDragStopped() 
    {
        // if(this.previousDragAnim)
        // {
        //     this.setAnimationData(this.previousDragAnim);
        // }
        this.setAnimation(this.gamestate, this.type, /*drag*/false);
    }

    setAnimationData(animData, cachePreStun=true)
    {
        if(animData)
        {
            if(cachePreStun)
            {
                this.preStunAnimation = animData;
                this.previousDragAnim = animData;
            }

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
            warrior_DamagedAnim_Front   = new AnimationTextureData(2,  10,  2,  0.1, staticTextures.amanda_texture.glTextureId)
            warrior_DamagedAnim_Back    = null; //new AnimationTextureData();
            warrior_GrabbedAnim         = new AnimationTextureData(2,  5,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            
            archer_WalkAnim_Front       = new AnimationTextureData(0,  0,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            archer_WalkAnim_Back        = new AnimationTextureData(2,  0,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            archer_AttackAnim_Front     = null; //new AnimationTextureData();
            archer_AttackAnim_Back      = null; //new AnimationTextureData();
            archer_DamagedAnim_Front    = null; //new AnimationTextureData();
            archer_DamagedAnim_Back     = null; //new AnimationTextureData();
            archer_GrabbedAnim          = new AnimationTextureData(0,  13,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            
            mage_WalkAnim_Front         = new AnimationTextureData(0,  0,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            mage_WalkAnim_Back          = new AnimationTextureData(1,  0,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            mage_AttackAnim_Front       = null;//new AnimationTextureData();
            mage_AttackAnim_Back        = null;//new AnimationTextureData();
            mage_DamagedAnim_Front      = new AnimationTextureData(0,  10,  2,  0.1, staticTextures.amanda_texture.glTextureId);
            mage_DamagedAnim_Back       = null;//new AnimationTextureData();
            mage_GrabbedAnim            = new AnimationTextureData(0,  5,  4,  0.1, staticTextures.amanda_texture.glTextureId);
            
            king_WalkAnim_Front         = new AnimationTextureData(1,  0,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            king_WalkAnim_Back          = new AnimationTextureData(3,  0,  3,  0.1, staticTextures.stacey_texture.glTextureId);
            king_DamagedAnim            = new AnimationTextureData(4,  0,  1,  0.1, staticTextures.stacey_texture.glTextureId);

            prop_rockAnim            = new AnimationTextureData(7,  0,  3,  0.4, staticTextures.stacey_texture.glTextureId);
            prop_bushAnim            = new AnimationTextureData(6,  0,  2,  0.4, staticTextures.stacey_texture.glTextureId);
            prop_waterAnim            = new AnimationTextureData(5,  4,  2,  0.4, staticTextures.stacey_texture.glTextureId);
            prop_grassAnim          = new AnimationTextureData(8,  9,  2,  0.4, staticTextures.stacey_texture.glTextureId);
            pencil_anim            = new AnimationTextureData(8,  3,  4,  0.075, staticTextures.stacey_texture.glTextureId);

            buttonAnimData = new AnimationTextureData(2,  13,  3,  0.2, staticTextures.stacey_texture.glTextureId);

            arrowAnimData = new AnimationTextureData(9,  0,  1,  0.2, staticTextures.stacey_texture.glTextureId);

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
            testAnims.push(prop_rockAnim     );
            testAnims.push(prop_bushAnim     );
            testAnims.push(prop_waterAnim    );
            testAnims.push(prop_grassAnim    );
            testAnims.push(pencil_anim       );
            testAnims.push(buttonAnimData       );
            
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
        let isNotStunned = this.stunTimeStamp < this.gamestate.currentTimeSec - this.gamestate.CONST_STUN_TIME;
        let disableStun = this.isDisabled();
        
        if (!this.bDragging 
            && !this.bIsPaperEntity
            && !disableStun
            && isNotStunned
            ) // if not grabbed
        {

            let currentLocalPosition = vec3.create();
            this.getLocalPosition(currentLocalPosition);

            if (!this.isFriend)
            {
                let kingPosition = vec3.create();
                gamestate.king.getLocalPosition(kingPosition);
                
                if (currentLocalPosition[1] <= kingPosition[1])
                {
                    let result = vec3.create();
                    vec3.subtract(result, kingPosition, currentLocalPosition);
                    vec3.normalize(result, result);
                    this.movementDirection = result;
                    this.speed = this.gamestate.CONST_ENEMY_CHASE_KING_SPEED;
                }
            }

            let deltaMovement  = vec3.scale(vec3.create(), this.movementDirection, this.speed * gamestate.dt_sec);
            let newLocalPosition = vec3.add(vec3.create(), currentLocalPosition, deltaMovement);
            this.setLocalPosition(newLocalPosition);
        }
        
        //reset animation after stun is up
        if(this.bClearStunAnim && !this.isStunnedThisFrame && this.preStunAnimation && !this.dead)
        {
            this.bClearStunAnim = false;
            this.setAnimationData(this.preStunAnimation);
        }
        
        ////////////////////////////////////////////////////////
        // animation
        ////////////////////////////////////////////////////////
        if(this.lastAnimationTickTime + this.currentAnimationTickRateSecs < gamestate.currentTimeSec
             && !this.bIsPaperEntity
             && !disableStun
             && !this.dead
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

    isDisabled()
    {
        // console.log("currTime:",this.gamestate.currentTimeSec, " disStartTime:", this.disabledStartTime, "DISABLE_DUR:",  this.gamestate.CONST_DISABLE_DURATION);
        return this.gamestate.currentTimeSec < this.disabledStartTime + this.gamestate.CONST_DISABLE_DURATION;
    }

    setDamage(amount)
    {
        let disabledFriend = false;
        
        // if(this.hurtSound) { this.hurtSound.play;} 
        //this.hurtSound.play();

        this.stun();
        if(this.stunAnimation)
        {
            this.setAnimationData(this.stunAnimation, false);
            this.stun();
            this.bClearStunAnim = true;
        }
        this.hp -= amount;
        if(this.hp <= 0)
        {
            if(this.isFriend && !(this.type == this.gamestate.CONST_KING))
            {
                disabledFriend = true;
                this.startDisableStun(); //don't kill friendlys anymore, should be funner this way
            }
            else
            {
                this.die();
            }
        }
        return disabledFriend;
    }

    startDisableStun()
    {
        // console.log("startDisableStun");
        this.disabledStartTime = this.gamestate.currentTimeSec;
    }

    notify_thisGuyJustAttacked(disabledFriend)
    {
        if(!disabledFriend)
        {
            //may need to make sure we tick entities after collision is done so stun will apply before move
            this.stun();
        }
        else if(!this.isFriend)
        {
            this.speed = this.gamestate.CONST_DISABLED_SPEED_BOOST;
        }
    }

    stun()
    {
        this.stunTimeStamp = this.gamestate.currentTimeSec;
    }

    die()
    {
        this.dead = true;
        this.bDragging = false;
        this.bEnableDrag = false;
        this.speed = 0;
        if (!this.isFriend)
        {
            this.gamestate.score++;
            this.gamestate.score_since_king_damaged++;
            //console.log(this.gamestate.score);
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
        this.hp = this.gamestate.CONST_KING_START_HP;

        this.stunAnimation = king_DamagedAnim;
        // this.setAnimationData(king_DamagedAnim, false);
        // this.stun();
    }

    setTextureToButton()
    {
        this.setAnimationData(buttonAnimData, false);
    }

    renderEntity(gamestate)
    {
        let gs = gamestate;

        if(gs.CONST_ENABLE_ARROW)
        {
            let listToRenderTo = null;
            if(this.type == gs.CONST_WARRIOR) { listToRenderTo = gs.filteredEnemyArchers;}
            else if(this.type == gs.CONST_ARCHER) {listToRenderTo = gs.filteredEnemyMages;}
            else if(this.type == gs.CONST_MAGE){listToRenderTo = gs.filteredEnemyWarriors;}
            if(listToRenderTo && this.isFriend)
            {
                let myPos = vec3.create();
                this.getLocalPosition(myPos);

                let arrowDefaultDir = vec3.fromValues(1,0,0); //points in x dir

                let enemyPos = vec3.create();
                let kingToEnemy = vec3.create();
                let vecToEnemy = vec3.create();
                let offsetNodeVec = vec3.create();
                let arrowPos = vec3.create();
                let kingPos = vec3.create();
                this.gamestate.king.getLocalPosition(kingPos);
                for(let weakEnemy of listToRenderTo)
                {
                    if(weakEnemy && !weakEnemy.dead) //not sure if it is possible to have null, but we tick this very early so one might have been cleaned up, best to check
                    {
                        weakEnemy.getLocalPosition(enemyPos);
                        vec3.subtract(kingToEnemy,kingPos, enemyPos)
                        let distToEnemy = vec3.length(kingToEnemy);
                        if(distToEnemy < gamestate.CONST_ARROW_MAX_DIST)
                        {
                            vec3.subtract(vecToEnemy, enemyPos, myPos);
                            vec3.normalize(vecToEnemy, vecToEnemy);
    
                            vec3.copy(offsetNodeVec, vecToEnemy);
                            vec3.scale(offsetNodeVec, vecToEnemy, gs.CONST_ARROW_OFFSET);
    
                            vec3.add(arrowPos, myPos, offsetNodeVec);
                            staticArrowRenderer.setLocalPosition(arrowPos);
                            staticArrowRenderer.setLocalRotation(getRotationBetweenVectors(arrowDefaultDir,vecToEnemy));
                            staticArrowRenderer.renderEntity(gs);
                        }
                    }
                }
            }
        }

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