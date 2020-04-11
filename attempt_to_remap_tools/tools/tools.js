////////////////////////////////////////////////////////
// 3D Utils
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
////////////////////////////////////////////////////////

import { vec3,vec4, mat4,quat} from "../gl-matrix_esm/index.js";
import {coloredCubeFactory} from "./emerald_easy_shapes.js";
import * as Utils from "../EmeraldUtils/emerald-opengl-utils.js"

/**
 * 
 */
export class SceneNode
{
    constructor(parentNode)
    {
        this._bDirty = false;

        this._localXform = new Utils.Transform();

        //#todo add _score to implemenation specific fields; like below
        this.cached_WorldPos = vec4.create();
        this.cached_LocalModelMat = mat4.create();
        this.cached_ParentWorldModelMat = mat4.create();
        this.cached_WorldModelMat = mat4.create();
        this.cached_InverseWorldModel = null; //lazy calculate

        this.dirtyEvent = new Utils.Delegate("dirty");
        this._boundDirtyHandler = this._handleParentDirty.bind(this);

        this.setParent(parentNode);

        this._cleanState();
    }

    /////////////////////////
    //virtuals
    /////////////////////////
    /** Called when resolving dirty flag. For updating child local caches only; cleaning is not complete when this method is called. */
    v_ChildUpdateCachedPostClean() {}
    /** A safe method to query things that have a dirty flag immediately after cleaned*/
    v_CleanComplete() {}
    
    /////////////////////////
    // Base functionality
    /////////////////////////
    isDirty() { return this._bDirty}

    makeDirty()
    {
        this._bDirty = true;
        this.dirtyEvent.dispatchEvent(new Event("dirty"));
    }
    
    getWorldMat()
    {
        if(this.isDirty())
        {
            this._cleanState();
        }
        
        return this._getCachedWorldMat();
    }

    getLocalModelMat()
    {
        if(this.isDirty()) { this._cleanState();}
        return mat4.copy(mat4.create(), this.cached_LocalModelMat);
    }

    requestClean()
    {
        if(this.isDirty())
        {
            this._cleanState();
        }
    }

    getLocalPosition(out) { return vec3.copy(out, this._localXform.pos); }
    setLocalPosition(pos)
    {
        vec3.copy(this._localXform.pos, pos);
        this.makeDirty();
    }

    getLocalRotation(out) { return quat.copy(out, this._localXform.rot); }
    setLocalRotation(newLocalRotQuat)
    {
        quat.copy(this._localXform.rot, newLocalRotQuat);
        this.makeDirty();
    }

    getLocalScale(out) { return vec3.copy(out, this._localXform.scale); }
    setLocalScale(newScale)
    {
        vec3.copy(this._localXform.scale, newScale);
        this.makeDirty();
    }

    getWorldPosition() 
    {
        if(this.isDirty())
        {
            this._cleanState();
        }
        return this.cached_WorldPos;
    }

    getInverseWorldMat()
    {
        this._cleanState();
        if(!this.cached_InverseWorldModel)
        {
            this.cached_InverseWorldModel = mat4.invert(mat4.create(), this.cached_WorldModelMat);
        }
        return this.cached_InverseWorldModel;
    }

    setParent(newParentSceneNode)
    {
        if(this._parentNode)
        {
            //remove previous event listener
            this._parentNode.dirtyEvent.removeEventListener("dirty", this._boundDirtyHandler);
        }

        this.makeDirty();
        this._parentNode = newParentSceneNode;
        if(this._parentNode) //pass null to clear parent.
        {
            this._parentNode.dirtyEvent.addEventListener("dirty", this._boundDirtyHandler,);
        }
    }

    getTopParent()
    {
        let child = this;
        while(child._parentNode)
        {
            child = child._parentNode;
        }
        return child;
    }

    /** Doesn't do recursive checks; should only be called if checks have already been done. */
    _getCachedWorldMat(out)
    {
        if(out == null)
        {
            out = mat4.create();
        }
        return mat4.copy(out, this.cached_WorldModelMat);
    }
    
    /** Updates current node and any dirty parents. */
    _cleanState()
    {
        let bWasDirty = false;

        if(this.isDirty())
        {
            bWasDirty = true;
            this.cached_LocalModelMat = this._localXform.toMat4(this.cached_LocalModelMat);
            this.cached_ParentWorldModelMat =  this._parentNode ? this._parentNode.getWorldMat() : mat4.identity(mat4.create());
            mat4.multiply(/*outparam*/this.cached_WorldModelMat, /*lhs*/this.cached_ParentWorldModelMat, /*rhs*/this.cached_LocalModelMat);
            this.cached_InverseWorldModel = null;
            this._updateCachesPostClean();

            this._bDirty = false;
            this.bForceNextClean = false;

            this.v_CleanComplete();
        }

        //return true if recalculation happened
        return bWasDirty;
    }

    _handleParentDirty()
    {
        this.makeDirty();
    }

    _updateCachesPostClean()
    {
        let worldXform = this._getCachedWorldMat();
        this.cached_WorldPos = vec4.transformMat4(this.cached_WorldPos, vec4.fromValues(0,0,0,1), worldXform);
        this.v_ChildUpdateCachedPostClean();
    }
}

/** Used to make non-scene node based classes behave like scene child scene nodes*/
// export class SceneNodeWrapper extends SceneNode
// {
//     constructor()
//     {
//         super();
//         this.wrappedObject = null; //wrappedObject;
//         this.updateWrappedItem = null; //updateFunction;
//     }

//     requestClean()
//     {
//         this._cleanState();
//     }

//     _updateCachesPostClean()
//     {
//         super._updateCachesPostClean();
//         this.updateWrappedItem(this.wrappedObject);
//     }
// }






















////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 2D Utils
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
/**
 * From http://www.ambrsoft.com/TrigoCalc/Circles2/circle2intersection/CircleCircleIntersection.htm
 * Which I found from https://math.stackexchange.com/questions/256100/how-can-i-find-the-points-at-which-two-circles-intersect
 * modified slightly for my purposes.
 * 
 * From site:
 *      example: if circle center is at the point (-2 , 3) then the circle equation is:    (x + 2)2 + (y – 3)2 = 0
 *      ∂ is the area of the triangle formed by the two circle centers and one of the intersection point. The sides of this triangle are S, r0 and r1 , the area is calculated by Heron' s formula.
 * 
 * my notes:
 *      a = x coordinate of 2d circle
 *      b = y coordinate of 2d circle
 * 
 *      It doesn't appear to account for when there is a singlular intersection point.
 */
export class Circle_ambrsoft { constructor(a, b, r) { this.a = a; this.b = b; this.r = r; }}
export function twoCirclesIntersection_ambrsoft(c1, c2)
{
    //**************************************************************
    //Calculating intersection coordinates (x1, y1) and (x2, y2) of
    //two circles of the form (x - c1.a)^2 + (y - c1.b)^2 = c1.r^2
    //                        (x - c2.a)^2 + (y - c2.b)^2 = c2.r^2
    //
    // Return value:   obj if the two circles intersects
    //                 null if the two circles do not intersects
    //**************************************************************
    var val1, val2, test;
    // Calculating distance between circles centers
    var D = Math.sqrt((c1.a - c2.a) * (c1.a - c2.a) + (c1.b - c2.b) * (c1.b - c2.b));
    if (((c1.r + c2.r) >= D) && (D >= Math.abs(c1.r - c2.r)))
    {
        // Two circles intersects or tangent
        // Area according to Heron's formula
        //----------------------------------
        var a1 = D + c1.r + c2.r;
        var a2 = D + c1.r - c2.r;
        var a3 = D - c1.r + c2.r;
        var a4 = -D + c1.r + c2.r;
        var area = Math.sqrt(a1 * a2 * a3 * a4) / 4;
        // Calculating x axis intersection values
        //---------------------------------------
        val1 = (c1.a + c2.a) / 2 + (c2.a - c1.a) * (c1.r * c1.r - c2.r * c2.r) / (2 * D * D);
        val2 = 2 * (c1.b - c2.b) * area / (D * D);
        let x1 = val1 + val2;
        let x2 = val1 - val2;
        // Calculating y axis intersection values
        //---------------------------------------
        val1 = (c1.b + c2.b) / 2 + (c2.b - c1.b) * (c1.r * c1.r - c2.r * c2.r) / (2 * D * D);
        val2 = 2 * (c1.a - c2.a) * area / (D * D);
        let y1 = val1 - val2;
        let y2 = val1 + val2;
        // Intersection pointsare (x1, y1) and (x2, y2)
        // Because for every x we have two values of y, and the same thing for y,
        // we have to verify that the intersection points as chose are on the
        // circle otherwise we have to swap between the points
        test = Math.abs((x1 - c1.a) * (x1 - c1.a) + (y1 - c1.b) * (y1 - c1.b) - c1.r * c1.r);
        if (test > 0.0000001) 
        {
            // point is not on the circle, swap between y1 and y2
            // the value of 0.0000001 is arbitrary chose, smaller values are also OK
            // do not use the value 0 because of computer rounding problems
            var tmp = y1;
            y1 = y2;
            y2 = tmp;
        }
        return {first: [x1, y1], second:[x2, y2]};
    }
    else
    {
        // circles are not intersecting each other
        return null;
    }
}












































////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Bitmap font rendering
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
import {vec3, mat4} from "../gl-matrix_esm/index.js"
import {initShaderProgram, Texture, Transform} from "./emerald-opengl-utils.js"
import { SceneNode } from "./3d_utils.js";



//////////////////////////////////////////////////////////////////////////////////////
// shaders
//////////////////////////////////////////////////////////////////////////////////////

export const glyphShader_vs =
`
    attribute vec4 vertPos;
    attribute vec2 texUVCoord;

    uniform mat4 projection;
    uniform mat4 view;
    uniform mat4 model;

    //-1.0 flips, 1.0 does not flip
    uniform float flipV;

    varying highp vec2 uvCoord;

    void main(){
        gl_Position = projection * view * model * vertPos;
        uvCoord = texUVCoord;
        uvCoord.y = uvCoord.y * flipV;
    }
`;

export const glyphShader_fs = `
    uniform sampler2D texture0;
    uniform highp vec3 color;

    varying highp vec2 uvCoord;

    void main(){
        gl_FragColor = texture2D(texture0, uvCoord);
        gl_FragColor = gl_FragColor * vec4(color, 1.0);
        if(gl_FragColor.a == 0.0) {
            discard;
        }
    }
`;

export function createGlyphShader(gl)
{
    let shaderProgram = initShaderProgram(gl, glyphShader_vs, glyphShader_fs);

    return {
        program : shaderProgram,
        attribs : {
            pos: gl.getAttribLocation(shaderProgram, "vertPos"),
            uv: gl.getAttribLocation(shaderProgram, "texUVCoord"),
        },
        uniforms :
        {
            projection : gl.getUniformLocation(shaderProgram, "projection"),
            view : gl.getUniformLocation(shaderProgram, "view"),
            model : gl.getUniformLocation(shaderProgram, "model"),
            texSampler : gl.getUniformLocation(shaderProgram, "texture0"),
            flipV : gl.getUniformLocation(shaderProgram, "flipV"),
            color : gl.getUniformLocation(shaderProgram, "color"),
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////
// vert data
//////////////////////////////////////////////////////////////////////////////////////

//quad indices
// 2---3
// | \ |
// 0---1
export const quadIndices = [
    0, 1, 2,        1, 3, 2,
]


export const quad3DPositions_idx = [
    0.0,0.0,0.0,    1.0,0.0,0.0,    0.0,1.0,0.0,   1.0,1.0,0.0
];
export const quad2DPositions_idx = [
    0.0,0.0,     1.0,0.0,     1.0,0.0,    1.0,1.0 
];


//////////////////////////////////////////////////////////////////////////////////////
// Glyph classes
//////////////////////////////////////////////////////////////////////////////////////

export class UVRenderBox
{
    /** uv pos is bottom-left aligned */
    constructor(uvPos, width, height)
    {
        this.pos = uvPos;
        this.width = width;
        this.height = height;
    }    
}

export class Glyph
{
    constructor()
    {
        //TODO make this the actual glyph, and have the renderer use this data instead
    }

}

//information on idiomatic ways of achiving enums in JS
//https://stackoverflow.com/questions/44447847/enums-in-javascript-with-es6
export const VAlignment = Object.freeze({
    TOP:   Symbol("top"),
    CENTER:  Symbol("center"),
    BOTTOM: Symbol("bottom")
});
export const HAlignment = Object.freeze({
    LEFT:   Symbol("left"),
    CENTER:  Symbol("center"),
    RIGHT: Symbol("right")
});

export class BitmapTextblock3D
{
    constructor(gl, bitMapFont, startText="", x=0, y=0, z=0)
    {
        this.gl = gl;
        this.bitMapFont = bitMapFont;
        this.text = startText;

        this.xform = new Transform();
        this.xform.pos = vec3.fromValues(x, y, z); 
        this.xform.scale = vec3.fromValues(1,1,1);
        this.parentModelMat = null;

        this.hAlignment = HAlignment.RIGHT;
        this.vAlignment = VAlignment.BOTTOM;
        this.localWidth = 0;

        //setup
        this.calculateLocalWidth();
    }

    //call this if tweaking any values regarding the font; this is the function resolve any "dirty" state about the bitmap font.
    refreshState()
    {
        this.calculateLocalWidth();
    }

    render(projection, view)
    {
        //this isn't the fastest text renderer as it renders each glyph separating rather than
        //caching them within a texture and rendering that texture each time.
        if(this.text)
        {
            let width_so_far = 0;

            //calculate width for pivot matrix
            for(let char_idx = 0; char_idx < this.text.length; ++char_idx)
            {
                let glyph = this.bitMapFont.getGlyphFor(this.text.charAt(char_idx));
                width_so_far += glyph.width;
            }

            let sizeReferenceGlyph = this.bitMapFont.getGlyphFor("A");

            let pivotMatrix = mat4.create();
            let pivotPos = vec3.fromValues(0,0,0);

            //BEFORE CHANING PIVOT ALIGNMENT: right alight means the cursor appears on the right; left align means
            //the cursor is on the left. Top align means an imaginary cursor would be on top. So, a left algined
            //text will actually have a pivot point on the right (think about: the text grows towards the right; where's the stationary point?)
            let hAlignFactor = 0.0;
            if      (this.hAlignment == HAlignment.LEFT)    { hAlignFactor = -1.0;}
            else if (this.hAlignment == HAlignment.CENTER)  { hAlignFactor = -0.5;} //move by half length

            let vAlignFactor = 0.0;
            if      (this.vAlignment == VAlignment.TOP)     { vAlignFactor = -1.0;}
            else if (this.vAlignment == VAlignment.CENTER)  { vAlignFactor = -0.5;} //move by half length
            pivotPos[0] = width_so_far * hAlignFactor;
            pivotPos[1] = sizeReferenceGlyph.height * vAlignFactor;
            mat4.translate(pivotMatrix, pivotMatrix, pivotPos);

            let sceneModelMat = mat4.create();
            if(this.parentModelMat)
            {
                mat4.mul(sceneModelMat, this.parentModelMat, sceneModelMat); 
            }
            let textBlockModelMat = this.xform.toMat4(mat4.create());
            mat4.mul(sceneModelMat, sceneModelMat, textBlockModelMat);

            //transform bitmap to parent space with pivot correction
            mat4.mul(sceneModelMat, sceneModelMat, pivotMatrix);

            let glyphPos = vec3.fromValues(0,0,0);
            let x_offset = 0;
            for(let char_idx = 0; char_idx < this.text.length; ++char_idx)
            {
                let glyph = this.bitMapFont.getGlyphFor(this.text.charAt(char_idx));
                glyphPos[0] = x_offset;
                glyphPos[1] = glyph.baselineOffsetY;
                x_offset += glyph.width; //be sure add width after we've calculated start pos

                let glyphModelMat = mat4.create();
                mat4.translate(glyphModelMat, glyphModelMat, glyphPos);

                //transform bitmap to parent space with pivot correction
                mat4.mul(glyphModelMat, sceneModelMat, glyphModelMat);

                glyph.render(view, projection, glyphModelMat);
            }
        }
    }

    calculateLocalWidth()
    {
        if(this.text)
        {
            let width_so_far = 0;
            
            //calculate width for pivot matrix
            for(let char_idx = 0; char_idx < this.text.length; ++char_idx)
            {
                let glyph = this.bitMapFont.getGlyphFor(this.text.charAt(char_idx));
                width_so_far += glyph.width;
            }

            this.localWidth = width_so_far;
        }
        else
        {
            this.localWidth = 0;
        }

    }

    getLocalWidth()
    {
        if(!this.localWidth)
        {
            this.calculateLocalWidth();
        }
        return this.localWidth;
    }
}

export class TextBlockSceneNode extends SceneNode
{
    constructor(gl, font, text)
    {
        super(null);
        this.wrappedText = new BitmapTextblock3D(this.gl, font, text);
        this.wrappedText.hAlignment = HAlignment.CENTER;
        this.wrappedText.vAlignment = VAlignment.CENTER;
        
        this.v_CleanComplete();
        // this.makeDirty();
        // this.requestClean();
    }

    v_CleanComplete()
    {
        if(this.wrappedText)
        {
            this.wrappedText.parentModelMat = this.getWorldMat();
        }
    }

    render(projection, view)
    {
        this.requestClean();
        this.wrappedText.render(projection, view);
    }
    
}

export class GlyphRenderer
{
    /**
     * 
     * @param {*} gl 
     * @param {*} glyphShader 
     * @param {*} fontTextureObj 
     * @param {*} uvPos 
     * @param {*} width 
     * @param {*} height 
     */
    constructor(gl, glyphShader, fontTextureObj, uvPos, width, height, baselineOffsetY=0.0)
    {
        this.gl = gl;
        this.glyphShader = glyphShader;
        this.fontTextureObj = fontTextureObj;
        this.uvPos = uvPos;
        this.width = width;
        this.height = height;
        this.baselineOffsetY = baselineOffsetY;
        this.color = vec3.fromValues(1,1,1);

        this.buffers = this._createBuffers(gl)
    }

    _createBuffers(gl)
    {
        const posVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);

        // transform this by scale [0.0,0.0,0.0,    1.0,0.0,0.0,    0.0,1.0,0.0,   1.0,1.0,0.0]
        let correctedPos = [0.0,0.0,0.0,   this.width,0.0,0.0,    0.0,this.height,0.0,   this.width, this.height,0.0]
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(correctedPos), gl.STATIC_DRAW);

        //quad indices
        // 2---3
        // | \ |
        // 0---1
        this.UVs = [
            this.uvPos[0],                  this.uvPos[1],                 //idx 0
            this.uvPos[0] + this.width,     this.uvPos[1],                 //idx 1
            this.uvPos[0],                  this.uvPos[1] + this.height,   //idx 2
            this.uvPos[0] + this.width,     this.uvPos[1] + this.height,   //idx 3
        ];
        const uvVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.UVs), gl.STATIC_DRAW);

        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadIndices), gl.STATIC_DRAW);

        return {
            posVBO : posVBO,
            uvVBO : uvVBO,
            ebo : ebo
        }
    }

    render(view, projection, model)
    {
        //#TODO support color override via uniform
        let gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.posVBO);
        gl.vertexAttribPointer(this.glyphShader.attribs.pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.glyphShader.attribs.pos);

        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uvVBO);
        gl.vertexAttribPointer(this.glyphShader.attribs.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.glyphShader.attribs.uv);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.ebo);
        
        //generic matrices
        gl.useProgram(this.glyphShader.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fontTextureObj.glTextureId);
        gl.uniform1i(this.glyphShader.uniforms.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);
        
        let renderColor = this.color;
        gl.uniform3f(this.glyphShader.uniforms.color, renderColor[0], renderColor[1], renderColor[2]);
        gl.uniform1f(this.glyphShader.uniforms.flipV, -1.0);
        gl.uniformMatrix4fv(this.glyphShader.uniforms.projection, false, projection);
        gl.uniformMatrix4fv(this.glyphShader.uniforms.view, false, view);
        gl.uniformMatrix4fv(this.glyphShader.uniforms.model, false, model);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, /*offset*/0);
    }
}

/** A rendering utility for rendering a glpy */
export class GlyphInstance
{
    constructor(glyphData)
    {
        this.glyphData = glyphData;
    }
}

/**
 * Notes:
 *  -to make the math easy, font textures are expected to have a size that is a square power of 2; eg 1024 x 1024. Otherwise 
 *     there will be some stretching that will need to be accounted for.
 */
export class BitmapFont
{
    constructor(glContext, textureURL)
    {
        this.gl = glContext;
        this.shader = createGlyphShader(this.gl);
        this.fontTexture = new Texture(this.gl, textureURL);
        this.defaultGlyph = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0, 0.8), 0.1, 0.1); //perhaps should not show anything? Will probably be more useful when debugging to see something
        this._glyphTable = this._createLookupHashTable();
    }

    getGlyphShader(){
        return this.shader;
    }

    getGlyphFor(letter)
    {
        //TODO this should probably return a glyph instance, rather than the actual GlyphRenderer
        let glyph = this._glyphTable[letter];
        if(glyph == null)
        {
            return this.defaultGlyph;
        }
        return glyph
    }

    setFontColor(newColor = vec3.fromValues(1,1,1))
    {
        for(let key in this._glyphTable)
        {
            let glyph = this._glyphTable[key]
            if(glyph)
            {
                glyph.color = newColor;
            }
        }
    }

    _createLookupHashTable()
    {
        //I prefer to create this table upfront with null values, then have subclasses overwrite values.
        //that way, the structure of what this should look like is defined in the base class
        //NOTE: implementing this as a hashtable like map is probably inherently slower than using an array with index structure (where symbol is index)
        return {
            "a" : null,
            "b" : null,
            "c" : null,
            "d" : null,
            "e" : null,
            "f" : null,
            "g" : null,
            "h" : null,
            "i" : null,
            "j" : null,
            "k" : null,
            "l" : null,
            "m" : null,
            "n" : null,
            "o" : null,
            "p" : null,
            "q" : null,
            "r" : null,
            "s" : null,
            "t" : null,
            "u" : null,
            "v" : null,
            "w" : null,
            "x" : null,
            "y" : null,
            "z" : null,

            "A" : null,
            "B" : null,
            "C" : null,
            "D" : null,
            "E" : null,
            "F" : null,
            "G" : null,
            "H" : null,
            "I" : null,
            "J" : null,
            "K" : null,
            "L" : null,
            "M" : null,
            "N" : null,
            "O" : null,
            "P" : null,
            "Q" : null,
            "R" : null,
            "S" : null,
            "T" : null,
            "U" : null,
            "V" : null,
            "W" : null,
            "X" : null,
            "Y" : null,
            "Z" : null,

            //numeric row
            "0" : null,
            "1" : null,
            "2" : null,
            "3" : null,
            "4" : null,
            "5" : null,
            "6" : null,
            "7" : null,
            "8" : null,
            "9" : null,
            "-" : null,
            "=" : null, 

            //numeric row + shift
            "!" : null,
            "@" : null,
            "#" : null,
            "$" : null,
            "%" : null,
            "^" : null,
            "&" : null,
            "*" : null,
            "(" : null,
            ")" : null,
            "_" : null,
            "+" : null,
            
            //symbols within keyboard letters
            ";" : null,
            ":" : null,
            "'" : null,
            "\"" : null,
            "[" : null,
            "{" : null,
            "]" : null,
            "}" : null,
            "/" : null,
            "?" : null,
            "." : null,
            ">" : null,
            "," : null,
            "<" : null,
            "\\" : null,
            "|" : null,
            "`" : null, //backtick (beside 1)
            "~" : null,

            //mathematical symbols
            "÷" : null,

            //symbols
            "©" : null,
            "®" : null,

            //accents
            "ç" : null,          
            "â" : null,
            "à" : null,
            "é" : null,              
            "è" : null,
            "ê" : null,
            "ë" : null,
            "î" : null,
            "ï" : null,
            "ô" : null,
            "û" : null,
            "ù" : null,
            "ü" : null,
            //there exists more accent than these
            
        }


    }



}

export class RenderBox3D 
{
    constructor(bottomLeftPnt, width, height)
    {
        this.pos = bottomLeftPnt;
        this.width = width;
        this.height = height;
        this._calculatePoints();
    }

    _calculatePoints()
    {
        this._BR = vec3.fromValues(this.pos[0] + this.width, this.pos[1],               this.pos[2]);
        this._TR = vec3.fromValues(this.pos[0] + this.width, this.pos[1] + this.height, this.pos[2]);
        this._TL = vec3.fromValues(this.pos[0],              this.pos[1] + this.height, this.pos[2]);
    }

    toLines()
    {
        return [
            [vec3.clone(this.pos), vec3.clone(this._BR)], //bottom line
            [vec3.clone(this.pos), vec3.clone(this._TL)], //left line
            [vec3.clone(this._TL), vec3.clone(this._TR)], //top line
            [vec3.clone(this._BR), vec3.clone(this._TR)], //right line
        ];
    }
}













////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Draggable
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

import { mat4, vec3, vec4 } from "../gl-matrix_esm/index.js";
import { SceneNode } from "./3d_utils.js";
import { discard_simpleTexturedQuadShapeShader_fs, simpleTexturedQuadShapeShader_vs, texturedQuadFactory } from "./emerald_easy_shapes.js";
import * as EmeraldUtils from "../EmeraldUtils/emerald-opengl-utils.js";

/** Widget that reacts to being moved by updating its local position to the moved location */
export class DragWidget extends SceneNode
{
    constructor(bAutoRegisterToEvents = false, canvas = null, camera = null, stopTouchesFromInvokingMouseEvents = true)
    {
        super();
        this.bDragging = false;
        this.trackedTouch = null;
        this.draggingRightBasis = vec3.fromValues(0,0,0);
        this.draggingUpBasis = vec3.fromValues(0,0,0);
        this.startDragClientX = 0;
        this.startDragClientY = 0;
        this.clientToCameraConversionX = 0;
        this.clientToCameraConversionY = 0;
        this.startParentLocalPos = vec3.fromValues(0,0,0);
        this._updatePositionBuffer = vec3.fromValues(0,0,0);
        this._scaledUpBuffer = vec3.fromValues(0,0,0);
        this._scaledRightBuffer = vec3.fromValues(0,0,0);

        this.stopTouchesFromInvokingMouseEvents = stopTouchesFromInvokingMouseEvents;
        this.bAutoRegisterHandlers = this.bAutoRegisterHandlers;
        if(bAutoRegisterToEvents && canvas && camera)
        {
            this.canvas = canvas;
            this.camera = camera;
            document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
            document.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
            document.addEventListener('mouseup', this.handleMouseUp.bind(this), false);
            canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
            canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
            canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
            // this.glCanvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), false);
        }
    }

    //these handlers can be optionally bound; if not boudn then user will be responsible for calling notifies
    handleMouseDown(e) { this.notifyInputDownEvent(e, this.canvas, this.camera);}
    handleMouseMove(e) { this.notifyInputMoveEvent(e);}
    handleMouseUp(e)   { this.notifyInputUpEvent(e);}
    handleTouchStart(e){ if(this.stopTouchesFromInvokingMouseEvents) { e.preventDefault();} this.notifyInputDownEvent(e,this.canvas, this.camera);}
    handleTouchMove(e) { if(this.stopTouchesFromInvokingMouseEvents) { e.preventDefault();} this.notifyInputMoveEvent(e);}
    handleTouchEnd(e)  { if(this.stopTouchesFromInvokingMouseEvents) { e.preventDefault();} this.notifyInputUpEvent(e);}

    v_rayHitTest(rayStart, rayDir){console.log("draggable did not implement hittest virtual", rayStart, rayDir)} //implement this to do hit tests

    notifyDeleted()
    {
        // if(this.bAutoRegisterHandlers && this.canvas && this.camera)
        // {
        //     document.removeEventListener()
        // }
    }

    notifyInputDownEvent(e, canvas, camera)
    {
        let touch = null;
        if (e.changedTouches && e.changedTouches.length > 0) 
        {
            touch = e.changedTouches[0]; 
        }

        let ray = camera.generateClickedRay(touch ? touch : e, canvas);
        if(ray)
        {
            if(this.v_rayHitTest(ray.rayStart, ray.rayDir))
            {
                let clientX = touch ? touch.clientX : e.clientX;
                let clientY = touch ? touch.clientY : e.clientY;

                this.bDragging = true;
                // if (e.changedTouches && e.changedTouches.length > 0) { this.trackedTouch = e.changedTouches[0]; }
                this.trackedTouch = touch;
                vec3.copy(this.draggingRightBasis,camera.right);
                vec3.copy(this.draggingUpBasis, camera.up);
                this.startDragClientX = clientX;
                this.startDragClientY = clientY;
                // let aspect = canvas.clientWidth / canvas.clientHeight;  //#note clientWidth may not be a great value to read here; scrolling considered?
                
                this.clientToCameraConversion = (camera.orthoHeight) / canvas.clientHeight; 
                // this.clientToCameraConversionY = 2*(camera.orthoHeight)          / canvas.clientHeight; 
                // this.clientToCameraConversionX = 2*(camera.orthoHeight * aspect) / canvas.clientWidth; 
                let topParent = this.getTopParent();
                topParent.getLocalPosition(this.startParentLocalPos);
            }
        }
    }

    notifyInputMoveEvent(e)
    {
        if(this.bDragging)
        {
            let clientX = 0;
            let clientY = 0;
            if(this.trackedTouch)
            {
                let foundTouch = false;
                //make sure this is same touch; object instances will be different
                if (e.changedTouches && e.changedTouches.length > 0) 
                {
                    for(const touch of event.changedTouches)
                    {
                        if(this.trackedTouch.identifier == touch.identifier)
                        {
                            clientX = touch.clientX;
                            clientY = touch.clientY;
                            foundTouch = true;
                            break;
                        }
                    }
                }
                if(!foundTouch) { return ;}
            }
            else
            {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            //convert the drag mouse coordinates to camera coordinates
            let deltaClientX = clientX - this.startDragClientX;
            let deltaClientY = clientY - this.startDragClientY;
            
            let deltaCamX = deltaClientX * this.clientToCameraConversion;
            let deltaCamY = deltaClientY * this.clientToCameraConversion;
            deltaCamY *= -1;

            //get toplevel parent (that is the local position we're going to transform)
            let topParent = this.getTopParent();

            //adjust the top-level parent's coordinates by the camera right and up vecs
            vec3.copy(this._updatePositionBuffer, this.startParentLocalPos);

            vec3.scale(this._scaledUpBuffer, this.draggingUpBasis, deltaCamY);
            vec3.add(this._updatePositionBuffer, this._updatePositionBuffer, this._scaledUpBuffer);

            vec3.scale(this._scaledRightBuffer, this.draggingRightBasis, deltaCamX);
            vec3.add(this._updatePositionBuffer, this._updatePositionBuffer, this._scaledRightBuffer);

            topParent.setLocalPosition(this._updatePositionBuffer);
        }
    }

    notifyInputUpEvent(e)
    {
        if(this.bDragging)
        {
            if(this.trackedTouch)
            {
                //check to make sure this is the same touch
                if (e.changedTouches && e.changedTouches.length > 0) 
                {
                    for(const touch of event.changedTouches)
                    {
                        if(this.trackedTouch.identifier == touch.identifier)
                        {
                            this.bDragging = false;
                            this.trackedTouch = null;
                            break;
                        }
                    }
                }
            }
            else
            {
                this.bDragging = false;
            }
        }
    }
}

export class DragWidgetTextured extends DragWidget
{
    constructor(gl, bAutoRegisterHandlers = false, canvas = null, camera = null)
    {
        super(bAutoRegisterHandlers, canvas, camera);
        this.gl = gl;

        this.textures = this._createTextures(this.gl);
        this.texturedQuad = texturedQuadFactory(this.gl, simpleTexturedQuadShapeShader_vs, discard_simpleTexturedQuadShapeShader_fs);
    }

    v_rayHitTest(rayStart, rayDir)
    {
        let inverseXform = this.getInverseWorldMat();

        let transformedRayStart = vec4.fromValues(rayStart[0], rayStart[1], rayStart[2], 1.0); //this is a point so 4th coordinate is a 1
        vec4.transformMat4(transformedRayStart, transformedRayStart, inverseXform);

        let transformedRayDir = vec4.fromValues(rayDir[0], rayDir[1], rayDir[2], 0.0);   //this is a dir, 4th coordinate is 0
        vec4.transformMat4(transformedRayDir, transformedRayDir, inverseXform);

        //the inverse transform will handle scaling etc; so the fast-box-collision test must use the normalized cube units
        //since this is a quad plane, we make a skinny box and use that for hit test (there's no triangle test currentlyk)
        let hit_t = EmeraldUtils.rayTraceFastAABB(-0.5, 0.5, -0.5, 0.5, -0.05, 0.05, transformedRayStart, transformedRayDir);
        if(hit_t)
        {
            return true;
        } 
        return false;
    } 

    render(viewMat, perspectiveMat)
    {
        let quadModelMat = this.getWorldMat();

        this.texturedQuad.bindBuffers();
        this.texturedQuad.bindTexture(this.gl.TEXTURE0, this.textures.depad.glTextureId, this.texturedQuad.shader.uniforms.texSampler);
        this.texturedQuad.updateShader(quadModelMat, viewMat, perspectiveMat);
        this.texturedQuad.render();

    }

    _createTextures(gl)
    {
        return {
            depad : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/Icons/DepadIcon3.png"),
        }
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Easy Shapes
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
import {vec3} from "../gl-matrix_esm/index.js"
import {vec4} from "../gl-matrix_esm/index.js"
import {quat} from "../gl-matrix_esm/index.js"
import {mat4} from "../gl-matrix_esm/index.js"
import * as key from "../EmeraldUtils/browser_key_codes.js";
import * as EmeraldUtils from "./emerald-opengl-utils.js"


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Cube
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class UnitCube3D{
    constructor(gl, shaderVertSrc, shaderFragSrc, uniformList)
    {
        ////////////////////////////////////////
        // buffers
        ////////////////////////////////////////
        const unitCube_PosVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_PosVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.unitCubePositions), gl.STATIC_DRAW);

        const unitCube_NormalsVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_NormalsVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.unitCubeNormals), gl.STATIC_DRAW);

        const unitCube_UVsVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_UVsVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.unitCubeUVs), gl.STATIC_DRAW);

        const unitCube_EBO = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, unitCube_EBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(EmeraldUtils.unitCubeIndices), gl.STATIC_DRAW);

        ///////////////////////////////////////////
        // shaders
        ///////////////////////////////////////////
        let cubeShader = EmeraldUtils.initShaderProgram(gl, shaderVertSrc, shaderFragSrc);

        /////////////////////////////////////////////
        //fields
        /////////////////////////////////////////////
        this.shader = {
            program : cubeShader,
            attribs : {
                pos: gl.getAttribLocation(cubeShader, "vertPos"),
                uv: gl.getAttribLocation(cubeShader, "texUVCoord"),
                normal: gl.getAttribLocation(cubeShader, "vertNormal"),
            },
            uniforms : {
                //populate from list
            }
        }
        //cache all provided uniform locations
        this._populateUniforms(gl, uniformList);

        this.buffers =  {
            posVBO : unitCube_PosVBO,
            normalVBO : unitCube_NormalsVBO,
            uvVBO : unitCube_UVsVBO,
            EBO : unitCube_EBO,
        };
        this.gl = gl;
    }

    _populateUniforms(gl, uniformList)
    {
        for(let uniform of uniformList)
        {
            this.shader.uniforms[uniform] = gl.getUniformLocation(this.shader.program, uniform);
        }
    }

    bindBuffers()
    {
        let gl = this.gl;

        //all shaders are expected to have this attribute, so no if checking to see if shader found its location
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.posVBO);
        gl.vertexAttribPointer(this.shader.attribs.pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attribs.pos);

        //see above vertex attribute to understand what parameters are
        if(this.shader.attribs.uv >= 0)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uvVBO);
            gl.vertexAttribPointer(this.shader.attribs.uv, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shader.attribs.uv);
        }
    
        //enable normal attribute
        if(this.shader.attribs.normal >= 0)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normalVBO);
            gl.vertexAttribPointer(this.shader.attribs.normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shader.attribs.normal);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.EBO);
        
    }

    /*
        @param GL_TEXTURE_NUM : eg "gl.TEXTURE0"
    */
    bindTexture(GL_TEXTURE_NUM /*= this.gl.TEXTURE0*/, glTextureId, shaderUniformName, )
    {
        this.gl.useProgram(this.shader.program);
        this.gl.activeTexture(GL_TEXTURE_NUM);
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTextureId);
        this.gl.uniform1i(this.shader.uniforms[shaderUniformName], GL_TEXTURE_NUM - this.gl.TEXTURE0/*0 corresponds to gl.TEXTURE0*/);
    }

    /* This method assumes you have aquired this cube's shader and configured its uniforms and bound buffers*/
    render()
    {
        let gl = this.gl;
        gl.drawElements(gl.TRIANGLES, /*vertexCount*/ 36, gl.UNSIGNED_SHORT, /*offset*/0);
    }

    deleteBuffers()
    {
        let gl = this.gl;

        gl.deleteBuffers(this.buffers.posVBO);
        gl.deleteBuffers(this.buffers.normalVBO);
        gl.deleteBuffers(this.buffers.uvVBO);
        gl.deleteBuffers(this.buffers.EBO);
    }
}

//////////////////////////////
// Unit cube that projects out of origin
//////////////////////////////


export const unitCubePositionsPivot = [
    // Front face
     0.0,  0.0,  -1.0,
     1.0,  0.0,  -1.0,
     1.0,  -1.0,  -1.0,
     0.0,  -1.0,  -1.0,
    
    // Back face
     0.0,  0.0,  0.0,
     0.0,  -1.0,  0.0,
     1.0,  -1.0,  0.0,
     1.0,  0.0,  0.0,
    
    // Top face
     0.0,  -1.0,  0.0,
     0.0,  -1.0,  -1.0,
     1.0,  -1.0,  -1.0,
     1.0,  -1.0,  0.0,
    
    // Bottom face
     0.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  -1.0,
     0.0,  0.0,  -1.0,
    
    // Right face
     1.0,  0.0,  0.0,
     1.0,  -1.0,  0.0,
     1.0,  -1.0,  -1.0,
     1.0,  0.0,  -1.0,
    
    // Left face
     0.0,  0.0,  0.0,
     0.0,  0.0,  -1.0,
     0.0,  -1.0,  -1.0,
     0.0,  -1.0,  0.0,
  ];

export class PivotUnitCube3D extends UnitCube3D {
    constructor(gl, shaderVertSrc, shaderFragSrc, uniformList)
    {
        super(gl, shaderVertSrc, shaderFragSrc, uniformList);
        gl.deleteBuffer(this.buffers.posVBO);

        const pivotPos_VBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pivotPos_VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unitCubePositionsPivot), gl.STATIC_DRAW);

        //update new attrib
        this.buffers.posVBO = pivotPos_VBO;
        this.shader.attribs.pos = gl.getAttribLocation(this.shader.program, "vertPos");

        this._populateUniforms(gl, uniformList);
    }
}


/////////////////////////////////////////////////////////////////////////////////////
// textured cube factory
////////////////////////////////////////////////////////////////////////////////////

const simpleTexturedShapeShader_vs =
`
    attribute vec4 vertPos;
    attribute vec3 vertNormal;
    attribute vec2 texUVCoord;

    uniform mat4 model;
    uniform mat4 view_model;
    uniform mat4 normalMatrix; //the inverse transpose of the view_model matrix
    uniform mat4 projection;

    varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+

    void main(){
        gl_Position = projection * view_model * vertPos;
        uvCoord = texUVCoord;
    }
`;

const simpleTexturedShapeShader_fs = `
    varying highp vec2 uvCoord;
    uniform sampler2D texSampler;

    void main(){
        gl_FragColor = texture2D(texSampler, uvCoord);
    }
`;
export function texturedCubeFactory(gl, vertShaderSrc = simpleTexturedShapeShader_vs, fragShaderSrc = simpleTexturedShapeShader_fs, uniformList = [])
{
    let uniforms = ["projection", "view_model", "normalMatrix", "texSampler"];
    uniforms = uniforms.concat(uniformList);

    let texturedCube = new UnitCube3D(gl,
        vertShaderSrc, fragShaderSrc,
        uniforms);

    // leavving below commented out in case this was in use in another test; but find references didn't turn up anything.
    // texturedCube.updateShader = function(cubePosition, viewMat, projectionMat){
    //     let gl = this.gl;
    //     gl.useProgram(this.shader.program);
    //     let modelMat = mat4.create();
    //     mat4.translate(modelMat, modelMat, cubePosition);
    //     let view_model = mat4.multiply(mat4.create(), viewMat, modelMat)
    //     gl.uniformMatrix4fv(this.shader.uniforms.view_model, false, view_model);
    //     let normMatrix = mat4.invert(mat4.create(), modelMat);
    //     mat4.transpose(normMatrix, normMatrix);
    //     gl.uniformMatrix4fv(this.shader.uniforms.normalMatrix, false, normMatrix);
    //     //this step shouldn't be done for every cube
    //     gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
    // }

    texturedCube.updateShader = function(modelMat, viewMat, projectionMat){
        let gl = this.gl;

        gl.useProgram(this.shader.program);
        
        
        let view_model = mat4.multiply(mat4.create(), viewMat, modelMat);
        gl.uniformMatrix4fv(this.shader.uniforms.view_model, false, view_model);
        
        // gl.uniformMatrix4fv(this.shader.uniforms.model, false, modelMat);
        // gl.uniformMatrix4fv(this.shader.uniforms.view, false, viewMat);
        gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
    }

    return texturedCube;
}

//example usage
/*
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let perspectiveMat = this.camera.getPerspective(aspect);
        let viewMat = this.camera.getView();

        this.texturedCubeTest.bindBuffers();
        this.texturedCubeTest.bindTexture(gl.TEXTURE0, this.textures.grass.glTextureId, this.texturedCubeTest.shader.uniforms.texSampler);
        this.texturedCubeTest.updateShader(vec3.fromValues(1, 1, -9), viewMat, perspectiveMat);
        this.texturedCubeTest.render();

*/

/////////////////////////////////////////////////////////////////////////////////////
// colored cube factory
////////////////////////////////////////////////////////////////////////////////////

const simpleColoredCube_vs =
`
    attribute vec4 vertPos;
    attribute vec3 vertNormal;
    attribute vec2 texUVCoord;

    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;

    void main(){
        gl_Position = projection * view * model * vertPos;
    }
`;

const simpleColoredCube_fs = `
    varying highp vec2 uvCoord;

    uniform highp vec3 color;

    void main(){
        gl_FragColor = vec4(color, 1.0);
    }
`;
export function coloredCubeFactory(gl)
{
    let colorCube = new UnitCube3D(gl,
        simpleColoredCube_vs, simpleColoredCube_fs,
        ["projection", "view", "model", "normalMatrix", "color"]);

    colorCube.updateShader = function(modelMat, viewMat, projectionMat, color){
        let gl = this.gl;

        gl.useProgram(this.shader.program);
        
        gl.uniform3f(this.shader.uniforms.color, color[0], color[1], color[2]);
        gl.uniformMatrix4fv(this.shader.uniforms.model, false, modelMat);
        gl.uniformMatrix4fv(this.shader.uniforms.view, false, viewMat);
        gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
    }

    return colorCube;
}

export function coloredCubeFactory_pivoted(gl)
{
    let colorCube = new PivotUnitCube3D(gl,
        simpleColoredCube_vs, simpleColoredCube_fs,
        ["projection", "view", "model", "normalMatrix", "color"]);

    colorCube.updateShader = function(modelMat, viewMat, projectionMat, color){
        let gl = this.gl;

        gl.useProgram(this.shader.program);
        
        gl.uniform3f(this.shader.uniforms.color, color[0], color[1], color[2]);
        gl.uniformMatrix4fv(this.shader.uniforms.model, false, modelMat);
        gl.uniformMatrix4fv(this.shader.uniforms.view, false, viewMat);
        gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
    }

    return colorCube;
}

//eample usage
/*
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let perspectiveMat = this.camera.getPerspective(aspect);
        let viewMat = this.camera.getView();

        let coloredCubeModel = mat4.create();
        mat4.translate(coloredCubeModel, coloredCubeModel, vec3.fromValues(-1, 1, -7));
        let cubeColor = vec3.fromValues(1,0,0);

        this.coloredCube.bindBuffers();
        this.coloredCube.updateShader(coloredCubeModel, viewMat, perspectiveMat, cubeColor);
        this.coloredCube.render();
*/


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  QUAD
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export class UnitQuad3D{
    constructor(gl, shaderVertSrc, shaderFragSrc, uniformList)
    {
        ////////////////////////////////////////
        // buffers
        ////////////////////////////////////////
        const unitCube_PosVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_PosVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.quad3DPositions), gl.STATIC_DRAW);

        const unitCube_NormalsVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_NormalsVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.quad3DNormals), gl.STATIC_DRAW);

        const unitCube_UVsVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_UVsVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.quadFlippedUVs), gl.STATIC_DRAW);

        // const unitCube_EBO = gl.createBuffer();
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, unitCube_EBO);
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(EmeraldUtils.unitCubeIndices), gl.STATIC_DRAW); no indices?

        ///////////////////////////////////////////
        // shaders
        ///////////////////////////////////////////
        let cubeShader = EmeraldUtils.initShaderProgram(gl, shaderVertSrc, shaderFragSrc);

        /////////////////////////////////////////////
        //fields
        /////////////////////////////////////////////
        this.shader = {
            program : cubeShader,
            attribs : {
                pos: gl.getAttribLocation(cubeShader, "vertPos"),
                uv: gl.getAttribLocation(cubeShader, "texUVCoord"),
                normal: gl.getAttribLocation(cubeShader, "vertNormal"),
            },
            uniforms : {
                //populate from list
            }
        }
        //cache all provided uniform locations
        this._populateUniforms(gl, uniformList);

        this.buffers =  {
            posVBO : unitCube_PosVBO,
            normalVBO : unitCube_NormalsVBO,
            uvVBO : unitCube_UVsVBO,
        };
        this.gl = gl;
    }

    _populateUniforms(gl, uniformList)
    {
        for(let uniform of uniformList)
        {
            this.shader.uniforms[uniform] = gl.getUniformLocation(this.shader.program, uniform);
        }
    }

    bindBuffers()
    {
        let gl = this.gl;

        //all shaders are expected to have this attribute, so no if checking to see if shader found its location
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.posVBO);
        gl.vertexAttribPointer(this.shader.attribs.pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attribs.pos);

        //see above vertex attribute to understand what parameters are
        if(this.shader.attribs.uv >= 0)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uvVBO);
            gl.vertexAttribPointer(this.shader.attribs.uv, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shader.attribs.uv);
        }
    
        //enable normal attribute
        if(this.shader.attribs.normal >= 0)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normalVBO);
            gl.vertexAttribPointer(this.shader.attribs.normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shader.attribs.normal);
        }
    }

    /*
        //#future probably should refactor this into a base class so Quad and Cube don't dupliate code.
        @param GL_TEXTURE_NUM : eg "gl.TEXTURE0"
    */
    bindTexture(GL_TEXTURE_NUM /*= this.gl.TEXTURE0*/, glTextureId, shaderUniformName, )
    {
        this.gl.useProgram(this.shader.program);
        this.gl.activeTexture(GL_TEXTURE_NUM);
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTextureId);
        this.gl.uniform1i(this.shader.uniforms[shaderUniformName], GL_TEXTURE_NUM - this.gl.TEXTURE0/*0 corresponds to gl.TEXTURE0*/);
    }

    /* This method assumes you have aquired this cube's shader and configured its uniforms and bound buffers*/
    render()
    {
        let gl = this.gl;
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    deleteBuffers()
    {
        let gl = this.gl;

        gl.deleteBuffers(this.buffers.posVBO);
        gl.deleteBuffers(this.buffers.normalVBO);
        gl.deleteBuffers(this.buffers.uvVBO);
        gl.deleteBuffers(this.buffers.EBO);
    }
}
/////////////////////////////////////////////////////////////////////////////////////
// textured quad factory
////////////////////////////////////////////////////////////////////////////////////

export const simpleTexturedQuadShapeShader_vs =
`
    attribute vec4 vertPos;
    attribute vec3 vertNormal;
    attribute vec2 texUVCoord;

    uniform mat4 model;
    uniform mat4 view_model;
    uniform mat4 normalMatrix; //the inverse transpose of the view_model matrix
    uniform mat4 projection;

    varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+

    void main(){
        gl_Position = projection * view_model * vertPos;
        uvCoord = texUVCoord;
    }
`;

export const simpleTexturedQuadShapeShader_fs = `
    varying highp vec2 uvCoord;
    uniform sampler2D texSampler;

    void main(){
        gl_FragColor = texture2D(texSampler, uvCoord);
    }
`;
export const discard_simpleTexturedQuadShapeShader_fs = `
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
export function texturedQuadFactory(gl, vs_src = simpleTexturedQuadShapeShader_vs, fs_src = simpleTexturedQuadShapeShader_fs)
{
    
    let texturedCube = new UnitQuad3D(gl,
        vs_src, fs_src,
        ["projection", "view_model", "normalMatrix", "texSampler"]);

    texturedCube.updateShader = function(modelMat, viewMat, projectionMat){
        let gl = this.gl;

        gl.useProgram(this.shader.program);
        
        let view_model = mat4.multiply(mat4.create(), viewMat, modelMat)
        gl.uniformMatrix4fv(this.shader.uniforms.view_model, false, view_model);
        
        let normMatrix = mat4.invert(mat4.create(), modelMat);
        mat4.transpose(normMatrix, normMatrix);
        gl.uniformMatrix4fv(this.shader.uniforms.normalMatrix, false, normMatrix);

        //this step shouldn't be done for every cube
        gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
    }

    return texturedCube;
}

//example usage
/*
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let perspectiveMat = this.camera.getPerspective(aspect);
        let viewMat = this.camera.getView();
        let modelMat = mat4.create();

        this.texturedQuad.bindBuffers();
        this.texturedQuad.bindTexture(gl.TEXTURE0, this.textures.grass.glTextureId, this.texturedCubeTest.shader.uniforms.texSampler);
        this.texturedQuad.updateShader(vec3.fromValues(1, 1, -9), viewMat, perspectiveMat);
        this.texturedQuad.render();

*/


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// OpenGL Utils
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
import {vec3} from "../gl-matrix_esm/index.js"
import {vec4} from "../gl-matrix_esm/index.js"
import {quat} from "../gl-matrix_esm/index.js"
import {mat4} from "../gl-matrix_esm/index.js"
import * as key from "../EmeraldUtils/browser_key_codes.js";

/////////////////////////////////////////////////////////////////////////////////
// Useful Geometries
/////////////////////////////////////////////////////////////////////////////////

/*
    Special thanks to mozzila for putting the tutorials on webgl1 together. That
    helped a lot to make the transition.
    https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial
    Some of the geometries below are based on that tutorial series.
*/
export const unitCubePositions = [
    // Front face
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,
    
    // Back face
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,
    
    // Top face
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,
    
    // Bottom face
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,
    
    // Right face
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,
    
    // Left face
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
  ];


export const unitCubeNormals = [
    // Front face
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Back face 
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Top face
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom face 
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right face
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left face 
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
];

// export const unitCubeUVs = [
//     // Front face
//     0.0,  0.0,
//     1.0,  0.0,
//     1.0,  1.0,
//     0.0,  1.0,
//     // Back face
//     0.0,  0.0,
//     1.0,  0.0,
//     1.0,  1.0,
//     0.0,  1.0,
//     // Top face
//     0.0,  0.0,
//     1.0,  0.0,
//     1.0,  1.0,
//     0.0,  1.0,
//     // Bottom face
//     0.0,  0.0,
//     1.0,  0.0,
//     1.0,  1.0,
//     0.0,  1.0,
//     // Right face
//     0.0,  0.0,
//     1.0,  0.0,
//     1.0,  1.0,
//     0.0,  1.0,
//     // Left face 
//     0.0,  0.0,
//     1.0,  0.0,
//     1.0,  1.0,
//     0.0,  1.0,
// ];
export const unitCubeUVs = [
    // Front face
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
    // Back face
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
    // Top face
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
    // Bottom face
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
    // Right face
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
    // Left face 
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
];

export const unitCubeIndices = [
    0,  1,  2,      0,  2,  3,    // front face
    4,  5,  6,      4,  6,  7,    // back face
    8,  9,  10,     8,  10, 11,   // top face
    12, 13, 14,     12, 14, 15,   // bottom face
    16, 17, 18,     16, 18, 19,   // right face
    20, 21, 22,     20, 22, 23,   // left face
];

export const quad2DPositions = [
    -0.5,-0.5,    0.5,-0.5,    0.5,0.5, //triangle 1
    -0.5,-0.5,    0.5,0.5,    -0.5,0.5, //triangle 2
];

export const quad3DPositions = [
    -0.5,-0.5,0.0,    0.5,-0.5,0.0,    0.5,0.5,0.0, //triangle 1
    -0.5,-0.5,0.0,    0.5,0.5,0.0,    -0.5,0.5,0.0, //triangle 2
];

export const quad3DPositions_pivotBottomLeft = [
    0.0,0.0,0.0,    1.0,0.0,0.0,    1.0,1.0,0.0, //triangle 1
    0.0,0.0,0.0,    1.0,1.0,0.0,    0.0,1.0,0.0, //triangle 2
];

export const quad3DNormals = [
    0.0,0.0,1.0,    0.0,0.0,1.0,    0.0,0.0,1.0, //triangle 1
    0.0,0.0,1.0,    0.0,0.0,1.0,    0.0,0.0,1.0, //triangle 2
];

export const quadFlippedUVs = [
    0.0,1.0,    1.0,1.0,    1.0,0.0, //triangle 1
    0.0,1.0,    1.0,0.0,    0.0,0.0, //triangle 2
];

/////////////////////////////////////////////////
// Shader Utils
/////////////////////////////////////////////////

export function loadShader(gl, glShaderType, srcStr)
{
    const shader = gl.createShader(glShaderType);
    gl.shaderSource(shader, srcStr);
    gl.compileShader(shader)
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert("FAILED TO COMPILE SHADER:" + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

export function initShaderProgram(gl, vertSrc, fragSrc)
{
    const vertShader = loadShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if(!vertShader || !fragShader) { return null;} //will be alerted in shader functions

    const shaderProg = gl.createProgram();
    gl.attachShader(shaderProg, vertShader);
    gl.attachShader(shaderProg, fragShader);
    gl.linkProgram(shaderProg);
    if(!gl.getProgramParameter(shaderProg, gl.LINK_STATUS))
    {
        alert("Failed to link shader program" + gl.getProgramInfoLog(shaderProg));
        gl.deleteProgram(shaderProg);
        return null;
    }
    return shaderProg;
}

///////////////////////////////////////////////////////
// Rendering Line Utils
///////////////////////////////////////////////////////

//for use with a shear shader that sets up where the first (x axis) and second (y axis) should land; see shader below
export const linePointPositions = 
[
    1.0, 0.0, 0.0, //x-axis to transform with shear; this is the start point in the line
    0.0, 1.0, 0.0  //y-axis to transform with shear; this is the end point in the line.
];



const simpleLineShader_vs = 
`
    attribute vec3 position;

    uniform mat4 model; //the shear matrix
    uniform mat4 view;
    uniform mat4 projection;

    //shear matrix has useful property, each column is where the cooresponding base
    //vector will land. So, if we draw a line from points [1,0,0] and [0,1,0], then
    //we can abuse the shear matrix to specify where we want those points to land.
    // we just specify the matrix with columns where we want the points to land!
    // | firstX secondX 0 0 |
    // | firstY secondY 0 0 |
    // | firstZ secondZ 1 0 |
    // | 0       0      0 1 |
    void main(){
        gl_Position = projection * view * model * vec4(position, 1);
    }
`;
const simpleLineShader_fs = 
`
    uniform highp vec3 color;

    void main(){
        gl_FragColor = vec4(color, 1);
    }
`;


export function createShearMatrixForPoints(pntA, pntB)
{
    return mat4.fromValues(
        pntA[0], pntA[1], pntA[2], 0, //col 1; transforms x-axis
        pntB[0], pntB[1], pntB[2], 0, //col 2; transforms y-axis
        0,          0,      1,     0, //col 3; transforms z-axis
        0,          0,      0,     1  //col 4
    );
}

/** This is somewhat-like immediate mod; which means it isn't the best way to render lines. The alternative
 *  way for rendering lines is to load the points you want up into a buffer, then draw that array buffer as lines
 *  This method uses a shear matrix trick to map the x-axis and y-axis basis vectors to the points provided and setting
 *  that matrix via a uniform. Thus, this really should be a debug tool or used sparingly because it will use a lot of draw
 *  calls to render simple line segements.
 */
export class LineRenderer
{
    constructor(gl)
    {
        if(!gl) { console.log("FAILURE: cannot create LineRender, gl is null"); return;}

        this.gl = gl;
        this.shader = this._generateShader(gl);
        this.lineVBO = this._generateBuffer(gl);
    }

    renderLine(pntA, pntB, color, view_mat, projection_mat)
    {
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineVBO);
        gl.vertexAttribPointer(this.shader.attribs.pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attribs.pos);

        let shearMat = createShearMatrixForPoints(pntA, pntB);

        gl.useProgram(this.shader.program);
        gl.uniformMatrix4fv(this.shader.uniforms.model, false, shearMat);
        gl.uniformMatrix4fv(this.shader.uniforms.view, false, view_mat);
        gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projection_mat);
        gl.uniform3f(this.shader.uniforms.color, color[0], color[1], color[2]);

        gl.drawArrays(gl.LINES, 0, 2);
    }

    _generateShader(gl)
    {
        let glProgram = initShaderProgram(gl, simpleLineShader_vs, simpleLineShader_fs);
        return { 
            program : glProgram,
            attribs : {
                pos: gl.getAttribLocation(glProgram, "position"),
            },
            uniforms : {
                model : gl.getUniformLocation(glProgram, "model"),
                view  : gl.getUniformLocation(glProgram, "view"),
                projection : gl.getUniformLocation(glProgram, "projection"),
                color : gl.getUniformLocation(glProgram, "color"),
            }
        }
    }
    _generateBuffer(gl)
    {
        const axisPosVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, axisPosVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linePointPositions), gl.STATIC_DRAW);
        return axisPosVbo
    }
}

///////////////////////////////////////////////////////
// Texture Utils
///////////////////////////////////////////////////////

export function isPowerOf2(value)
{
    //powers of 2 should only occupy a single bit; use bitwise operators to ensure this is true
    return (value & (value - 1)) == 0
}

export function loadTextureGL(gl, url)
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    //display error color until the image is loaded
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 0, 255, 255]); //basicaly [1,0,1,1] color becuase it is really obvious 
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width,  height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.onload = function(){ 
        //image is now loaded once this callback is hit
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
        
        if(isPowerOf2(image.width) && isPowerOf2(image.height))
        {
            //leave default texturing filtering? tutorial doesn't specify anything
            gl.generateMipmap(gl.TEXTURE_2D);
        } else 
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    }
    image.src = url;
    return texture;
}

export class Texture
{
    constructor(gl, fileURL)
    {
        this.gl;
        this.glTextureId = this._createTextureGL(gl);
        this.srcImage = this._createImage(gl, this.glTextureId, fileURL);
    }

    _createTextureGL(gl)
    {
        const textureID = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textureID);
        
        //display error color until the image is loaded
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 0, 255, 255]); //basicaly [1,0,1,1] color becuase it is really obvious 
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width,  height, border, srcFormat, srcType, pixel);

        return  textureID;
    }
    _createImage(gl, glTextureId, url)
    {
        let image = new Image();

        image.onload = function(){ 

            //image is now loaded once this callback is hit
            gl.bindTexture(gl.TEXTURE_2D, glTextureId);
            const level = 0;
            const internalFormat = gl.RGBA;
            const srcFormat = gl.RGBA;
            const srcType = gl.UNSIGNED_BYTE;
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
            
            if(isPowerOf2(image.width) && isPowerOf2(image.height))
            {
                //leave default texturing filtering? tutorial doesn't specify anything
                gl.generateMipmap(gl.TEXTURE_2D);
            } else 
            {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        }
        //start load through javascript setters
        image.src = url; 

        return image;
    }
}

/////////////////////////////////////////////////////////////////////////////////
// Shaders
/////////////////////////////////////////////////////////////////////////////////




/////////////////////////////////////////////////////////////////////////////////
// Browser Utils
/////////////////////////////////////////////////////////////////////////////////

export function getBrowserSize(){
    //newer browsers should support window.innerWidth, but returning all for backwards compatibility
    var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    return {
        width : w,
        height : h,
    }
}

///////////////////////
// pointer lock utils
///////////////////////

export const supportPointerLock =  "pointerLockElement" in document ||
    "mozPointerLockElement" in document ||
    "webkitPointerLockElement" in document;

export function configureMultiBrowserPointerLock(glCanvas)
{
    glCanvas.requestPointerLock = glCanvas.requestPointerLock || glCanvas.mozrequestPointerLock || glCanvas.webkitrequestPointerLock;
}

export function configureExitPoitnerLock()
{
    document.exitPointerLock = document.exitPointerLock || document.mozexitPointerLock || document.webkitexitPointerLock;
}

export function addEventListener_pointerlockchange(functionObj, useCapture = false)
{
    document.addEventListener("pointerlockchange",       functionObj, useCapture);
    document.addEventListener("mozpointerlockchange",    functionObj, useCapture);
    document.addEventListener("webkitpointerlockchange", functionObj, useCapture);
}

export function addEventListener_pointerlockerror(functionObj, useCapture = false)
{
    document.addEventListener("pointerlockerror",        this.handlePointerLockError.bind(this), useCapture);
    document.addEventListener("mozpointerlockerror",     this.handlePointerLockError.bind(this), useCapture);
    document.addEventListener("webkitpointerlockerror",  this.handlePointerLockError.bind(this), useCapture);
}

export function isElementPointerLocked(element)
{
    return document.pointerLockElement  === element 
        ||  document.mozpointerLockElement  === element
        ||  document.webkitpointerLockElement === element;
}
///////////////
// end pointer lock utils
///////////////


/////////////////////////////////////////////////////////////////////////////////
// Math Utils
/////////////////////////////////////////////////////////////////////////////////

export const radiansPerDegree = Math.PI / 180;
export const degreesPerRadian = 180 / Math.PI;

export function floatsAreSame(a, b, epsilon = 0.001)
{
    return Math.abs(a - b) < epsilon;
}

let vec3Same_buffer = vec3.create();
export function vec3AreSame(a, b, epsilon = 0.001)
{
    //create a vector between the two vectors, and theen see if its length is 0
    let length = vec3.length(vec3.subtract(vec3Same_buffer, a, b));
    return Math.abs(length) < epsilon;
}

let vec4Same_buffer = vec4.create();
export function vec4AreSame(a, b, epsilon = 0.001)
{
    //create a vector between the two vectors, and theen see if its length is 0
    let length = vec4.length(vec4.subtract(vec4Same_buffer, a, b));
    return Math.abs(length) < epsilon;
}

export function getDifferentVector(out, vec)
{
    
    let vecx = out[0] = vec[0];
    let vecy = out[1] = vec[1];
    let vecz = out[2] = vec[2];

    if (vecx < vecy && vecz)
    {
        out[0] = 1.0;
    }
    else if (vecy < vecx && vecz)
    {
        out[1] = 1.0;
    }
    else if (vecz < vecx && vecy)
    {
        out[2] = 1.0;
    }
    else //all are equal
    {
        if (vec.x > 0)
        {
            out[0] = -1.0;
        }
        else
        {
            out[0] = 1.0;
        }
    }
    return out;
}


export class Transform
{
    constructor()
    {
        this.pos = vec3.fromValues(0,0,0);
        this.scale = vec3.fromValues(1,1,1);
        this.rot = quat.create();
        this.model = mat4.create();
    }

    toMat4(out)
    {
        mat4.identity(this.model);
        mat4.translate(this.model, this.model, this.pos);
        mat4.mul(this.model, this.model, mat4.fromQuat(mat4.create(), this.rot));
        mat4.scale(this.model, this.model, this.scale);
        
        mat4.copy(out, this.model);
        return out;
    }
}

export function clamp(value, min, max)
{
    //not sure which of these is fastest without testing
    // return Math.min(Math.max(value, min), max);
    return (value > max) ? max : (value < min) ? min : value;
}

export function rayTraceFastAABB(xMin, xMax, yMin, yMax, zMin, zMax, rayStart, rayDir)
{
    
    //FAST RAY BOX INTERSECTION
    //intersection = s + t*d;		where s is the start and d is the direction
    //for an axis aligned box, we can look at each axis individually
    //
    //intersection_x = s_x + t_x * d_x
    //intersection_y = s_y + t_y * d_y
    //intersection_z = s_z + t_z * d_z
    //
    //for each of those, we can solve for t
    //eg: (intersection_x - s_x) / d_z = t_z
    //intersection_x can be easily found since we have an axis aligned box, and there are 2 yz-planes that represent x values a ray will have to pass through
    //
    //intuitively, a ray that DOES intersect will pass through 3 planes before entering the cube; and pass through 3 planes to exit the cube.
    //the last plane it intersects when entering the cube, is the t value for the box intersection.
    //		eg ray goes through X plane, Y plane, and then Z Plane, the intersection point is the t value associated with the Z plane
    //the first plane it intersects when it leaves the box is also its exit intersection t value
    //		eg ray goes leaves Y plane, X plane, Z plane, then the intersection of the Y plane is the intersection point
    //if the object doesn't collide, then it will exit a plane before all 3 entrance places are intersected
    //		eg ray Enters X Plane, Enters Y plane, Exits X PLane, Enters Z plane, Exits Y plane, Exits Z plane; 
    //		there is no collision because it exited the x plane before it penetrated the z plane
    //it seems that, if it is within the cube, the entrance planes will all have negative t values

    //f = floor, c = ceil
    let fX = xMin;
    let cX = xMax;
    let fY = yMin;
    let cY = yMax;
    let fZ = zMin;
    let cZ = zMax;

    if (fX == cX || fY == cY || fZ == cZ) { return null;}

    //use algbra to calculate T when these planes are hit; similar to above example -- looking at single components
    // pnt = s + t * d;			t = (pnt - s)/d
    //these calculations may produce infinity
    let tMaxX = (fX - rayStart[0]) / rayDir[0];
    let tMinX = (cX - rayStart[0]) / rayDir[0];
    let tMaxY = (fY - rayStart[1]) / rayDir[1];
    let tMinY = (cY - rayStart[1]) / rayDir[1];
    let tMaxZ = (fZ - rayStart[2]) / rayDir[2];
    let tMinZ = (cZ - rayStart[2]) / rayDir[2];

    let x_enter_t = Math.min(tMinX, tMaxX);
    let x_exit_t  = Math.max(tMinX, tMaxX);
    let y_enter_t = Math.min(tMinY, tMaxY);
    let y_exit_t  = Math.max(tMinY, tMaxY);
    let z_enter_t = Math.min(tMinZ, tMaxZ);
    let z_exit_t  = Math.max(tMinZ, tMaxZ);

    //handle cases where ray never crosses; TODO may need to account for when 1 boundary is infinity but not the other
    if(Math.abs(tMaxX) == Infinity && Math.abs(tMinX) == Infinity && (rayStart[0] > xMax || rayStart[0] < xMin)){ return null; }
    if(Math.abs(tMaxY) == Infinity && Math.abs(tMinY) == Infinity && (rayStart[1] > yMax || rayStart[1] < yMin)){ return null; }
    if(Math.abs(tMaxZ) == Infinity && Math.abs(tMinZ) == Infinity && (rayStart[2] > zMax || rayStart[2] < zMin)){ return null; }

    let enterTs = [x_enter_t, y_enter_t, z_enter_t ];
    enterTs.sort();

    let exitTs = [x_exit_t, y_exit_t, z_exit_t];
    exitTs.sort();

    //handle cases where infinity is within enterT
    let numElements = 3; //theoretically we can do fast AABB in dimensions higher than 3!
    for (let idx = numElements - 1; idx >= 0; --idx)
    {
        if (enterTs[idx] != Infinity)
        {
            //move a real value to the place where infinity was sorted
            enterTs[2] = enterTs[idx];
            break;
        }
    }

    let intersects = enterTs[2] <= exitTs[0];
    if (intersects)
    {
        //collision is that of the enter values
        let collisionT = enterTs[2];
        return collisionT;
    }

    return null;
}

/////////////////////////////////////////////////////////////////////////////////
// Camera
/////////////////////////////////////////////////////////////////////////////////

export function crossAndNormalize(a, b)
{
    let result = vec3.cross(vec3.create(), a, b);
    return vec3.normalize(result, result);
}

export class Camera
{
    constructor(
        position_vec3 = vec3.fromValues(0,0,0),
        forward_vec3 = vec3.fromValues(0,0,-1),
        up_vec3 = vec3.fromValues(0,1,0),
        speed_f = 10.0,
        inputMonitor = new key.InputMonitor()
    )
    {
        //fields
        this.position = position_vec3;
        this.forward = forward_vec3;
        this.up = up_vec3;
        this.speed = speed_f;
        this.right = null;
        this.rotation = quat.create();
        this.inputMonitor = inputMonitor;
        this.enableInput = true;
        this.enableMouseFollow = false;
        this.enableOrthoMode = false;
        this.orthoHeight = 10;
        
        //perspective fields
        this.FOV_degrees = 45 * (Math.PI/180);
        this.zNear = 0.1;
        this.zFar = 100;
        
        //fps camera mode
        this.yaw = 0;
        this.pitch = 0;
        this.fpsYawSensitivity = 0.1;
        this.fpsPitchSensitivity = 0.1;
        
        //free camera mode
        this._freeCameraSensitivity = 0.0025;
        
        //set the current mode
        this.notifyMouseMoved_fptr = this.notifyMouseMoved_fpsCamera;

        //helper fields to avoid large number of object creation
        this.vec3buffer1 = vec3.create();
        this.vec3buffer2 = vec3.create();
        this.vec3buffer3 = vec3.create();
        this.vec3buffer4 = vec3.create();
        this.vec3buffer5 = vec3.create();
        this._worldUp = vec3.fromValues(0, 1, 0);
        this._cachedStartForward = vec3.clone(forward_vec3);
        this._cachedStartUp = vec3.clone(up_vec3);
        this._cachedRight = crossAndNormalize(this._cachedStartForward, this._cachedStartUp);


        //initialize
        this._squareBases();
        this._bindCallbacks();
    }

    _squareBases()
    {
        if(vec3AreSame(this.forward, this.up, 0.00001))
        {
            this.up = getDifferentVector(this.up, this.up);
        } 

        this.right = vec3.cross(vec3.create(), this.forward, this.up);
        this.up = vec3.cross(this.up, this.right, this.forward);

        vec3.normalize(this.right, this.right);
        vec3.normalize(this.forward, this.forward);
        vec3.normalize(this.up, this.up);

    }

    _bindCallbacks()
    {
        document.addEventListener('mousemove', this.handleMouseMoved.bind(this));
    }

    handleMouseMoved(e)
    {
        if(this.enableMouseFollow)
        {
            var movX = e.movementX || e.mozMovementX || e.webkitMovementX || 0.0;
            var movY = e.movementY || e.mozMovementY || e.webkitMovementY || 0.0;
            this.notifyMouseMoved_fptr(movX, movY);
        }
    }


    notifyMouseMoved_freeCamera(deltaX, deltaY)
    {
        deltaY = -deltaY;
        if(deltaX == 0.0 && deltaY == 0.0)
        {
            return;
        }

        // there's probably a better way to do this, just creating off the top of my head
        let scaledU = vec3.copy(vec3.create(), this.right);
        vec3.scale(scaledU, scaledU, deltaX);

        let scaledV = vec3.copy(vec3.create(), this.up);
        vec3.scale(scaledV, scaledV, deltaY);

        let rotDir = vec3.add(vec3.create(), scaledU, scaledV);

        let rotationAxis = vec3.cross(vec3.create(), this.forward, rotDir);
        vec3.normalize(rotationAxis, rotationAxis);
        
        let rotMagnitude = (Math.abs(deltaX) + Math.abs(deltaY))  * this._freeCameraSensitivity;
        let rotQuat = quat.setAxisAngle(quat.create(), rotationAxis, rotMagnitude);

        vec3.transformQuat(this.forward, this.forward, rotQuat);
        this._squareBases();
    }

    notifyMouseMoved_fpsCamera(deltaX, deltaY)
    {
        //yaw and pitch are relative to the starting forward vector.
        this.yaw = this.yaw + (-deltaX * this.fpsYawSensitivity);
        this.pitch = this.pitch + (-deltaY * this.fpsPitchSensitivity);

        if(this.pitch > 89.0) {this.pitch = 89.0;}
        if(this.pitch < -89.0) {this.pitch = -89.0;}
        this.yaw = this.yaw % 360.0;

        // console.log("yaw %.2f, pitch %.2f", this.yaw, this.pitch);
        let yawRad = radiansPerDegree * this.yaw;
        let pitchRad = radiansPerDegree * this.pitch;
        let rotQuat = null;
        { //scope pitch/yaw quats so their memory can be reused in rotQuat
            let pitchQuat = quat.setAxisAngle(quat.create(), this._cachedRight, pitchRad);
            let yawQuat = quat.setAxisAngle(quat.create(), this._worldUp, yawRad);
            rotQuat = quat.multiply(pitchQuat, yawQuat, pitchQuat); //use pitchQuat as storage
        }

        vec3.transformQuat(this.forward, this._cachedStartForward, rotQuat);
        vec3.transformQuat(this.up, this._worldUp, rotQuat); //also rotate this since its used ins base squaring

        this._squareBases();
    }

    getPerspective(aspect)
    {
        return mat4.perspective(mat4.create(), this.FOV_degrees, aspect, this.zNear, this.zFar);
    }

    getOrtho(width, height)
    {
        let halfWidth = width / 2.0;
        let halfHeight = height / 2.0;
        return mat4.ortho(mat4.create(), -halfWidth, halfWidth, -halfHeight, halfHeight, this.zNear, this.zFar);
    }

    getView()
    {
        //set target to be right in front of the camera's position
        let target = vec3.add(vec3.create(), this.position, this.forward);
        return mat4.lookAt(mat4.create(), this.position, target, this.up);
    }

    generateClickedRay(inputEvent, canvas)
    {
        let elementClicked = document.elementFromPoint(inputEvent.clientX, inputEvent.clientY);
        if(elementClicked)
        {
            let rayEnd = null;
            let rayStart = null;

            if(elementClicked == canvas)
            {
                let canvasHalfWidth = canvas.clientWidth / 2.0;
                let canvasHalfHeight = canvas.clientHeight / 2.0;
    
                //x-y relative to center of canvas; assuming 0 padding
                let x = (inputEvent.clientX - canvas.offsetLeft) - (canvasHalfWidth);
                let y = -((inputEvent.clientY - canvas.offsetTop) - (canvasHalfHeight));
    
                let fractionWidth = x / canvasHalfWidth;
                let fractionHeight = y / canvasHalfHeight;

                let aspect = canvas.clientWidth / canvas.clientHeight;

                rayStart = vec3.clone(this.position);
                if(this.enableOrthoMode)
                {
                    let orthoHalfHeight = this.orthoHeight / 2.0
                    let orthoHalfWidth = (aspect * this.orthoHeight) / 2.0; 
        
                    let numCameraUpUnits = fractionHeight * orthoHalfHeight;
                    let numCameraRightUnits = fractionWidth * orthoHalfWidth;
        
                    { //calculate start point
                        let scaledCamUp = vec3.clone(this.up);
                        let scaledCamRight = vec3.clone(this.right);
            
                        vec3.scale(scaledCamUp, scaledCamUp, numCameraUpUnits);
                        vec3.scale(scaledCamRight, scaledCamRight, numCameraRightUnits);
            
                        vec3.add(rayStart, rayStart, scaledCamUp);
                        vec3.add(rayStart, rayStart, scaledCamRight);
                    }
        
                    rayEnd = vec3.clone(rayStart);
                    vec3.add(rayEnd, rayEnd, this.forward);
                }
                else //perspective ray 
                {
                    //#TODO generate perspective ray 
                }
            }

            if(rayEnd && rayStart)
            {
                let rayDir = vec3.sub(vec3.create(), rayEnd, rayStart);
                vec3.normalize(rayDir, rayDir);

                return {
                    rayStart : rayStart,
                    rayDir : rayDir
                }
            }
        }
        return null;
    }

    tick(deltaTimeSec)
    {
        if(this.enableInput)
        {
            let dir = this.vec3buffer1;
            vec3.set(dir, 0,0,0);
            if(this.inputMonitor.pressedStateArray[key.up] || this.inputMonitor.pressedStateArray[key.w])
            {
                if(this.enableOrthoMode)
                {
                    let upDir = vec3.copy(this.vec3buffer2, this.up);
                    dir = vec3.add(dir, dir, upDir);
                }
                else
                {
                    let upDir = vec3.copy(this.vec3buffer2, this.forward);
                    dir = vec3.add(dir, dir, upDir);
                }
            }
            if (this.inputMonitor.pressedStateArray[key.down]|| this.inputMonitor.pressedStateArray[key.s])
            {
                if(this.enableOrthoMode)
                {
                    let downDir = vec3.copy(this.vec3buffer2, this.up);
                    vec3.scale(downDir, downDir, -1);
                    dir = vec3.add(dir, dir, downDir);                    
                }
                else
                {
                    let downDir = vec3.copy(this.vec3buffer2, this.forward);
                    vec3.scale(downDir, downDir, -1);
                    dir = vec3.add(dir, dir, downDir);
                }
            }
            if (this.inputMonitor.pressedStateArray[key.right] || this.inputMonitor.pressedStateArray[key.d])
            {
                let rightDir = vec3.copy(this.vec3buffer2, this.right);
                dir = vec3.add(dir, dir, rightDir);
            }
            if (this.inputMonitor.pressedStateArray[key.left] || this.inputMonitor.pressedStateArray[key.a])
            {

                let leftDir = vec3.copy(this.vec3buffer2, this.right);
                vec3.scale(leftDir, leftDir, -1);
                dir = vec3.add(dir, dir, leftDir);
            }
            vec3.normalize(dir, dir);

            if(this.inputMonitor.pressedStateArray[key.shift]){ vec3.scale(dir, dir, (this.speed / 16) * deltaTimeSec);}
            else{vec3.scale(dir, dir, this.speed * deltaTimeSec);}
            

            vec3.add(this.position, this.position, dir);
        }
    }
}

/////////////////////////////////////////////////////////////////////////////////
// Audio
/////////////////////////////////////////////////////////////////////////////////

// let documentSoundMap = {}

export class Sound
{
    // static factory(soundURL)
    // {
    //     //see if any sounds have already been used and cached;
    //     let documentSounds = documentSoundMap[document]
    //     if(documentSounds)
    //     {
    //         let previousSoundLoad = documentSounds[soundURL];
    //         if(previousSoundLoad)
    //         {
    //             this.audioElement = previousSoundLoad;
    //         }
    //     } 
    //     else
    //     {
    //         documentSoundMap[document] = {};
    //     }        

    //      create one if not loaded

    //     //cache sound
    //     // documentSoundMap[document][soundURL] = this.audioElement;
    // }

    constructor(soundURL)
    {
        //use HTML5 audio element to hold the sound; each sound object will own a 
        if(!this.audioElement)
        {
            this.audioElement = document.createElement("audio");
            this.bLoaded = false;
            this.audioElement.addEventListener('loadeddata', this.loadedAudio.bind(this));
            this.audioElement.src = soundURL;
            this.audioElement.setAttribute("preload", "auto"); //indicates audio should be loaded when browser loads.
            this.audioElement.setAttribute("controls", "none"); //remove the play/stop/etc audio controls from owned element
            this.audioElement.style.display = "none"; //don't show this element on the page.
            this.url = soundURL;
            document.body.appendChild(this.audioElement);
        }
    }

    loadedAudio()
    {
        this.bLoaded = true;
        //console.log("Loaded sound file ", this.url);
    }

    play() 
    {
        if(this.bLoaded)
        {
            this.audioElement.currentTime = 0;
            this.audioElement.play();
        }
    }

    stop()
    {
        this.audioElement.pause();
    }

}


/////////////////////////////////////////////////////////////////////////////////////////////////
// Software Engineering Designs
/////////////////////////////////////////////////////////////////////////////////////////////////

/** Modeled after C# delegates;
 * Safari does not support extended EventTarget interface. 
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget provides a simplistic implementation for safari and IE
 * Implementation of event target below is a modified version of what was provided by mozilla (changed to es6 class syntax)
*/

/** Provided because ATIW safari/IE/IOSSafari do not support EventTarget constructor; this is mozilla's simple implementation*/
class EventTarget_Impl 
{
    constructor()
    {
        this.listeners = {};
    }

    addEventListener(type, callback) 
    {
        if (!(type in this.listeners)) 
        {
            this.listeners[type] = [];
        }
        this.listeners[type].push(callback);
    }

    removeEventListener(type, callback)
    {
        if (!(type in this.listeners)) 
        {
            return;
        }
        var stack = this.listeners[type];
        for (var i = 0, l = stack.length; i < l; i++) 
        {
            if (stack[i] === callback)
            {
                stack.splice(i, 1);
                return;
            }
        }
    }

    dispatchEvent(event)
    {
        if (!(event.type in this.listeners)) 
        {
            return true;
        }
        var stack = this.listeners[event.type].slice();
        for (var i = 0, l = stack.length; i < l; i++)
        {
            stack[i].call(this, event); //appears that when function is bound(eg function.bind(this)), the "this" keyword passed here doesn't stomp bound "this"; which is a good thing for oop
        }
        return !event.defaultPrevented;
    }
}

export class Delegate extends EventTarget_Impl
{
    constructor()
    {
        super();
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Monsterrat_BitmapFontConfig
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
// import * as BMF from "./BitmapFontRendering.js"
import {BitmapFont, GlyphRenderer} from "./BitmapFontRendering.js";
import {vec3} from "../gl-matrix_esm/index.js";

export class Montserrat_BMF extends BitmapFont
{
    constructor(glContext, textureURL)
    {
        super(glContext, textureURL);

        this._configureGlyphTable();
        this._configured = false;
    }

    _configureGlyphTable()
    {
        if(this._configured)
        {
            console.log("_configureGlyphTable called, but table already configured" );
            return;
        }
        this._configured = true;

        //steps to mapping characters:
        //1. align bottom left corner
        //2. align width
        //3. align height
        //4. align baseline offset (for letters like g, p, q, where part of letter goes below baseline)
        //starting point: new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.78, 0.965), 0.025, 0.025); 

        //this method should only ever be called once
        this._glyphTable["a"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7835, 0.966), 0.0155, 0.0169); 
        this._glyphTable["b"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.806, 0.966), 0.018, 0.02275); 
        this._glyphTable["c"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0122, 0.927), 0.0165, 0.0169); 
        this._glyphTable["d"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.074, 0.927), 0.0182, 0.02275); 
        this._glyphTable["e"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1215, 0.927), 0.0165, 0.0169); 
        this._glyphTable["f"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1420, 0.927), 0.0128, 0.0234); 
        this._glyphTable["g"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.157, 0.921), 0.0174, 0.0234, -0.007); 
        this._glyphTable["h"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1823, 0.927), 0.0167, 0.0234); 
        this._glyphTable["i"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.205, 0.927), 0.006, 0.0234); 
        this._glyphTable["j"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.213, 0.921), 0.010, 0.0287, -0.006); 
        this._glyphTable["k"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.230, 0.927), 0.0167, 0.0230); 
        this._glyphTable["l"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2515, 0.927), 0.004, 0.023); 
        this._glyphTable["m"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.263, 0.927), 0.028, 0.017); 
        this._glyphTable["n"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2985, 0.927), 0.0158, 0.017); 
        this._glyphTable["o"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3205, 0.927), 0.0177, 0.017); 
        this._glyphTable["p"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3443, 0.921), 0.0175, 0.0235, -0.006); 
        this._glyphTable["q"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3667, 0.921), 0.0175, 0.0235, -0.006); 
        this._glyphTable["r"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3922, 0.927), 0.010, 0.017); 
        this._glyphTable["s"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4058, 0.927), 0.014, 0.017); 
        this._glyphTable["t"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.442, 0.927), 0.0115, 0.021); 
        this._glyphTable["u"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4595, 0.927), 0.016, 0.017); 
        this._glyphTable["v"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.481, 0.927), 0.017, 0.017); 
        this._glyphTable["w"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.501, 0.927), 0.0268, 0.017); 
        this._glyphTable["x"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5307, 0.927), 0.016, 0.017); 
        this._glyphTable["y"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5485, 0.921), 0.0184, 0.0287, -0.006); 
        this._glyphTable["z"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5707, 0.927), 0.014, 0.017); 

        this._glyphTable["A"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.01125, 0.966), 0.0227, 0.0215); 
        this._glyphTable["B"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0395, 0.966), 0.0195, 0.0215); 
        this._glyphTable["C"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0641, 0.966), 0.0195, 0.02155); 
        this._glyphTable["D"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.14125, 0.966), 0.0205, 0.02155); 
        this._glyphTable["E"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1965, 0.966), 0.017, 0.0218); 
        this._glyphTable["F"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2202, 0.966), 0.017, 0.0218); 
        this._glyphTable["G"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.241, 0.966), 0.0205, 0.0218); 
        this._glyphTable["H"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.27, 0.966), 0.0185, 0.0218); 
        this._glyphTable["I"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2975, 0.966), 0.0038, 0.0218); 
        this._glyphTable["J"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3065, 0.966), 0.0134, 0.0218); 
        this._glyphTable["K"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.329, 0.966), 0.018, 0.0218); 
        this._glyphTable["L"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.353, 0.966), 0.016, 0.0218); 
        this._glyphTable["M"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3745, 0.966), 0.02325, 0.0218); 
        this._glyphTable["N"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4065, 0.966), 0.019, 0.0218); 
        this._glyphTable["O"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.432, 0.966), 0.024, 0.0218); 
        this._glyphTable["P"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4625, 0.966), 0.018, 0.0218); 
        this._glyphTable["Q"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4859, 0.962), 0.024, 0.0260, -0.0042); 
        this._glyphTable["R"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.51625, 0.966), 0.018, 0.0218); 
        this._glyphTable["S"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5395, 0.966), 0.0167, 0.0218); 
        this._glyphTable["T"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5817, 0.966), 0.0185, 0.0218); 
        this._glyphTable["U"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.606, 0.966), 0.0184, 0.0218); 
        this._glyphTable["V"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.6295, 0.966), 0.0221, 0.0218); 
        this._glyphTable["W"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.655, 0.966), 0.0323, 0.0218); 
        this._glyphTable["X"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.691, 0.966), 0.02, 0.0218); 
        this._glyphTable["Y"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7136, 0.966), 0.02, 0.0218); 
        this._glyphTable["Z"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.737, 0.966), 0.019, 0.0218); 
        
        //numeric row
        this._glyphTable["0"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.057, 0.771), 0.019, 0.0218); 
        this._glyphTable["1"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.683, 0.81), 0.0088, 0.0218); 
        this._glyphTable["2"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.698, 0.81), 0.017, 0.0218); 
        this._glyphTable["3"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7182, 0.81), 0.0166, 0.0218); 
        this._glyphTable["4"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7395, 0.81), 0.02, 0.0218); 
        this._glyphTable["5"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7625, 0.81), 0.0165, 0.0218); 
        this._glyphTable["6"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7838, 0.81), 0.017, 0.0218); 
        this._glyphTable["7"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.805, 0.81), 0.017, 0.0218); 
        this._glyphTable["8"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0132, 0.771), 0.0172, 0.0218); 
        this._glyphTable["9"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0352, 0.771), 0.017, 0.0218); 
        
        this._glyphTable["'"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.08, 0.771), 0.006, 0.0225); 
        this._glyphTable["?"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.09, 0.771), 0.016, 0.0218); 
        this._glyphTable["\""] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.121, 0.771), 0.0105, 0.0225); 
        this._glyphTable["!"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.137, 0.771), 0.005, 0.0218); 
        this._glyphTable["("] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.164, 0.765), 0.008, 0.0285, -0.003);  //dropped
        this._glyphTable["%"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1764, 0.771), 0.024, 0.0218); 
        this._glyphTable[")"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.204, 0.765), 0.008, 0.0285, -0.003); //dropped
        
        this._glyphTable["["] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.22, 0.765), 0.008, 0.0285, -0.003); //dropped
        this._glyphTable["#"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.23075, 0.771), 0.021, 0.0218); 
        this._glyphTable["]"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.255, 0.765), 0.008, 0.0285, -0.003);//dropped
        this._glyphTable["{"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.269, 0.765), 0.01, 0.0285, -0.003); //dropped
        this._glyphTable["@"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2825, 0.765), 0.0295, 0.0285,-0.006); //dropped
        this._glyphTable["}"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3155, 0.765), 0.0105, 0.0285, -0.003); //dropped

        //start here
        this._glyphTable["/"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3288, 0.768), 0.014, 0.029, -0.003); //slight drop
        this._glyphTable["&"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.343, 0.771), 0.0206, 0.0218); 
        this._glyphTable["\\"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.365, 0.768), 0.014, 0.029, -0.003); //slight drop
        this._glyphTable["<"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3825, 0.771), 0.015, 0.018); 
        this._glyphTable["-"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4028, 0.771), 0.01, 0.01);         
        this._glyphTable["+"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4185, 0.771), 0.0145, 0.0181); 
        this._glyphTable["÷"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.439, 0.771), 0.0146, 0.0182); 
        this._glyphTable["="] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4808, 0.771), 0.0145, 0.017); 
        this._glyphTable[">"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.501, 0.771), 0.015, 0.018); 

        this._glyphTable["®"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.521, 0.771), 0.0227, 0.0218); 
        this._glyphTable["©"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.549, 0.771), 0.0224, 0.0218); 
        this._glyphTable["$"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5765, 0.767), 0.0168, 0.0295, -0.0035); //dropped
        this._glyphTable[":"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.693, 0.771), 0.005, 0.017); 
        this._glyphTable[";"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7035, 0.7674), 0.005, 0.02, -0.0037); //dropped
        this._glyphTable[","] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7135, 0.7674), 0.005, 0.009, -0.0045); //droped
        this._glyphTable["."] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.724, 0.771), 0.005, 0.004); 
        this._glyphTable["*"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.733, 0.771), 0.012, 0.023); 

        this._glyphTable["^"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.424, 0.832), 0.011, 0.006, 0.018); //raised
        this._glyphTable["_"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5817, 0.9852), 0.0185, 0.0218); 
        this._glyphTable["|"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2595, 0.765), 0.002, 0.0285, -0.003); //drop like []
        this._glyphTable["`"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.059, 0.944), 0.009, 0.006, 0.02); //flip?
        this._glyphTable["~"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5907, 0.944), 0.012, 0.006, 0.01); //raised
        
        this._glyphTable[" "] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5907, 0.954), 0.012, 0.006); 

        //accents
        this._glyphTable["ç"] = null;
        this._glyphTable["â"] = null;
        this._glyphTable["à"] = null;
        this._glyphTable["é"] = null;
        this._glyphTable["è"] = null;
        this._glyphTable["ê"] = null;
        this._glyphTable["ë"] = null;
        this._glyphTable["î"] = null;
        this._glyphTable["ï"] = null;
        this._glyphTable["ô"] = null;
        this._glyphTable["û"] = null;
        this._glyphTable["ù"] = null;
        this._glyphTable["ü"] = null;
        //there exists more accent than these

        //make glyphs self-aware of the charactesr the glyph represents.
        for(let key in this._glyphTable)
        {
            let glyph = this._glyphTable[key]
            if(glyph)
            {
                glyph.symbol = key;
            }
        }
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Radial Picker
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
import * as EmeraldUtils from "./emerald-opengl-utils.js";
import { vec2, vec3, vec4, mat4 } from "../gl-matrix_esm/index.js";
import { SceneNode } from "./3d_utils.js";
import * as utils2d from "./2d_utils.js";
import { coloredCubeFactory, texturedCubeFactory} from "./emerald_easy_shapes.js";
import { fromRotationTranslation } from "../gl-matrix_esm/mat4.js";
import {TextBlockSceneNode} from "./BitmapFontRendering.js";
import {Montserrat_BMF} from "./Montserrat_BitmapFontConfig.js";

export class RadialButton extends SceneNode
{
    constructor(childButtons = [])
    {   
        super();
        this.childButtons = childButtons;
        this.radiusVector = vec4.fromValues(1,0,0,0); //transformations apply to this vector before getting length; update to define custom button's radius
        this.bExpands = true;
        this.bHasAction = false;
        this._bIsToggled = false;
        this.desiredScale = vec3.fromValues(1,1,1);    //radial picker may scale-down button; this is used to further tweak scaling
        this.customActionFunction = null;
    }

    //virtuals
    render(dt_sec)          { console.log("RadialButton::render() not implemented", dt_sec); }
    hitTest(rayStart, rayDir) { console.log("RadialButton::hitTest not implemented", rayStart, rayDir); return false;}
    
    takeAction()
    { 
        if(this.customActionFunction)    
        {
            this.customActionFunction();
        } 
        else 
        {
            console.log("no action function provided");
        }
        
    }
    actionExpandsLayer() {return this.childButtons.length > 0; }
    actionClosesLayer() {return true;} //only called if layer wasn't expanded
    isToggled(){ return this._bIsToggled;}
    setToggled(bIsToggled){this._bIsToggled = bIsToggled;}
    getButtonRadius() 
    {
        // let xform = this.getWorldMat();
        let xform = this.getLocalModelMat();
        let transformedRadiusVec = vec4.transformMat4(vec4.create(), this.radiusVector, xform);
        return vec4.length(transformedRadiusVec);
    }
}

/**
 * Radial button picker. Passed an open/close button that populates children. Layers are created around open-close button
 * within some specific angle (or circular if non is specified). Buttons are added in a recursive tree fashion; the 
 * open/close button has children buttons that make up layer 1. The layer1 buttons can either take an action and close
 * the radial picker menu, or can contain children and add those to layer2 for selection. This repeats for buttons in
 * layer 2 and so on. 
 */
export class RadialPicker extends SceneNode
{
    /** @param openButton expects RadialButton that has (uniquely-owned) children that will populate layers recursively. */
    constructor(openButton, spawnRegionAngleDegrees = 360 )
    {
        super();
        this.layers = [];                                   //a radial layer of buttons
        this.layerPivots = [];                              //The desired starting point of items in the layer
        this.layerRadii = [];
        this.openButton = openButton;
        this.startItemDir = vec3.fromValues(1,0,0);

        //radial behavior
        this.bClockWise = true;
        this.spawnRegionAngle_deg = spawnRegionAngleDegrees;    //angle in which to spawn buttons
        this.bCenterButtonsAtPivot = true;                  //should buttons spawn centered around their pivot; or grow clockwise/counter-clock-wise

        this.openButton.setParent(this);
    }

    hitTest(rayStart, rayDir)
    {
        //start from outter-most layer and work in; this gives priority to outter
        for(let layerIdx = this.layers.length - 1; layerIdx >= 0; --layerIdx)
        {
            let layer = this.layers[layerIdx];
            for(const button of layer)
            {
                if(button.hitTest(rayStart, rayDir))
                {
                    if(button.actionExpandsLayer())
                    {
                        for(const buttonToUnToggle of layer) {buttonToUnToggle.setToggled(false);}
                        button.setToggled(true);
                        button.takeAction();

                        shrinkArrayLength(this.layers, layerIdx + 1);
                        shrinkArrayLength(this.layerPivots, layerIdx + 1);
                        shrinkArrayLength(this.layerRadii, layerIdx + 1);

                        this.pushNewLayer(button.childButtons, button);

                        return true;
                    }
                    else
                    {
                        if(button.actionClosesLayer())
                        {
                            this.close();
                        }
                        else
                        {
                            for(const otherButtons of layer) { otherButtons.setToggled(false);}
                            button.setToggled(true); 
                        }
                        button.takeAction();
                        return true;
                    }
                }
            }
        }

        //check if open button was hit
        if(this.openButton.hitTest(rayStart, rayDir))
        {
            if (!this.openButton.isToggled()) { this.open(); } 
            else { this.close();}
            return;
        }

        //user clicked out of radial; collapse
        this.close();

        return false;
    }

    
    pushNewLayer(buttons, owningButton = null)
    {
        //add buttons at layer index
        let layerIdx = this.layers.length; //this will be index when we add the layer
        this.layers.push(buttons);

        //add pivot direction for this layer based on last button clicked
        if(owningButton)
        {
            this.layerPivots.push(this.calculateNewLayerPivot(owningButton));
        }
        else
        {
            this.layerPivots.push(this.startItemDir);
        }

        //calculate layer offset before pushing new layer size
        let previousRadiiDistance = this.openButton.getButtonRadius();
        for(const previousLayerRadius of this.layerRadii) { previousRadiiDistance += 2 * previousLayerRadius;}

        //calculate layer size and add it to this layer's index
        let maxLayerRadius = 0;
        for(const childBtn of buttons) 
        {
            childBtn.setToggled(false);
            childBtn.setLocalScale(childBtn.desiredScale); //clear out any previous scaling effects done by picker; must be done before radius calculated
            let childRadius = childBtn.getButtonRadius();
            if (childRadius > maxLayerRadius) { maxLayerRadius = childRadius;}
        }
        this.layerRadii.push(maxLayerRadius);

        //calculate center offset distance for each button
        let centerOffsetDistance = previousRadiiDistance + (maxLayerRadius);    //aka layer radius

        let pivotOffsetVec = vec3.clone(this.layerPivots[layerIdx]);
        vec3.normalize(pivotOffsetVec, pivotOffsetVec);
        vec3.scale(pivotOffsetVec, pivotOffsetVec, centerOffsetDistance);

        let pivotAngle_deg = (180 / Math.PI) * Math.atan2(/*y*/pivotOffsetVec[1], /*x*/pivotOffsetVec[0]) + 360; //+360 converts negative degrees into positive degrees
        let startAngle_deg = (180 / Math.PI) * Math.atan2(/*y*/this.startItemDir[1], /*x*/this.startItemDir[0]) + 360; 

        //prepare to place buttons along spawn angle
        let totalRequiredCircumference = 0;
        let totalRequiredAngle_deg = 0;
        let circumferenceAt360degrees = (2 * Math.PI * centerOffsetDistance);
        let availableCircumference = circumferenceAt360degrees * (this.spawnRegionAngle_deg/360.0); //circumference of whole circle scaled down to the sub-angle we're spawning in.
        let buttonAngles = [];
        let buttonPortionOfCircumference = [];
        for(const layerButton of buttons)
        {
            //we need to figure out what amount of circumference each button will occupy to correctly pack the buttons.
            //one way to do this is to calculate the intersections of the layer-circle and the button'circle. 
            //the angle between those intersection points can tell use the amount of required circumference. 
            //just make button circle at top of for calculation purposes; we just need 
            let intersectPnts = utils2d.twoCirclesIntersection_ambrsoft(
                new utils2d.Circle_ambrsoft(0,0,centerOffsetDistance), new utils2d.Circle_ambrsoft(0,centerOffsetDistance,layerButton.getButtonRadius()));
            if(intersectPnts)
            {
                let dirA = vec2.fromValues(intersectPnts.first[0], intersectPnts.first[1]);
                let dirB = vec2.fromValues(intersectPnts.second[0], intersectPnts.second[1]);
                vec2.normalize(dirA, dirA);
                vec2.normalize(dirB, dirB);

                let buttonRequiredAngle_deg = (180/Math.PI) * Math.acos(vec2.dot(dirA, dirB));
                let buttonRequiredCircumference = (buttonRequiredAngle_deg / 360) * circumferenceAt360degrees; //#future this can probably be optimized to only rely on angles and not circumference
                totalRequiredAngle_deg += buttonRequiredAngle_deg;
                totalRequiredCircumference += buttonRequiredCircumference
                
                buttonAngles.push(buttonRequiredAngle_deg);
                buttonPortionOfCircumference.push(buttonRequiredCircumference);
            }
            else
            {
                console.log("RadialPicker: Failed to find intersection between button and layer; this should be impossible");
                return;
            }
        }

        //scale down buttons if they're too big
        let buttonScaleDown = 1.0;
        if(totalRequiredCircumference > availableCircumference)
        {
            buttonScaleDown = availableCircumference / totalRequiredCircumference;
            totalRequiredAngle_deg *= buttonScaleDown;
            for(let btn = 0; btn < buttonAngles.length; ++btn)
            {
                buttonAngles[btn] *= buttonScaleDown;
                buttonPortionOfCircumference[btn] *= buttonScaleDown;
            }
        }

        //calculate spawn start angle
        let currentSpawnAngle = pivotAngle_deg;
        if(this.bCenterButtonsAtPivot)
        {
            //back spawn direction up by half of the region we're going to fill with buttons
            currentSpawnAngle += -this._spinDir() * (totalRequiredAngle_deg / 2.0);

            //clamp so items can't leave specific region
            if(this.bClockWise)
            {
                let halfSpawnRegion = this.spawnRegionAngle_deg / 2;
                let minAngle_deg = startAngle_deg - halfSpawnRegion + totalRequiredAngle_deg;
                let maxAngle_deg = startAngle_deg + halfSpawnRegion;
                currentSpawnAngle = EmeraldUtils.clamp(currentSpawnAngle, minAngle_deg, maxAngle_deg);
            }
            else
            {
                let halfSpawnRegion = this.spawnRegionAngle_deg / 2;
                let minAngle_deg = startAngle_deg - halfSpawnRegion;
                let maxAngle_deg = startAngle_deg + halfSpawnRegion - totalRequiredAngle_deg;
                currentSpawnAngle = EmeraldUtils.clamp(currentSpawnAngle, minAngle_deg, maxAngle_deg);
            }
        }
        else
        {
            //clamp so items can't leave specific region
            if(this.bClockWise)
            {
                let minAngle_deg = startAngle_deg
                let maxAngle_deg = startAngle_deg + this.spawnRegionAngle_deg - totalRequiredAngle_deg;
                currentSpawnAngle = EmeraldUtils.clamp(currentSpawnAngle, minAngle_deg, maxAngle_deg);
            }
            else
            {
                let minAngle_deg = startAngle_deg + this.spawnRegionAngle_deg - totalRequiredAngle_deg
                let maxAngle_deg = startAngle_deg;
                currentSpawnAngle = EmeraldUtils.clamp(currentSpawnAngle, minAngle_deg, maxAngle_deg);
            }
        }

        // let adjustedRequiredCircumference = totalRequiredCircumference * buttonScaleDown;
        // let spawnAngleIncrement = this.spawnRegionAngle / buttons.length;
        let btnIdx = 0;
        for(const layerButton of buttons)
        {
            let buttonCenterOffset = this._spinDir() * ((buttons.length == 1) ? 0 : (buttonAngles[btnIdx] / 2.0));
            let buttonSpawnAngle_rad = (currentSpawnAngle + buttonCenterOffset) * (Math.PI/180);
            let spawnDir = vec3.fromValues(Math.cos(buttonSpawnAngle_rad), Math.sin(buttonSpawnAngle_rad), 0);
            let spawnPos = vec3.clone(spawnDir);
            vec3.scale(spawnPos, spawnPos, centerOffsetDistance);

            let scaleOverride = vec3.clone(layerButton.desiredScale);
            vec3.scale(scaleOverride, scaleOverride, buttonScaleDown);

            layerButton.setLocalPosition(spawnPos);
            layerButton.setLocalScale(scaleOverride);
            layerButton.setParent(this);

            currentSpawnAngle += this._spinDir() * buttonAngles[btnIdx];
            btnIdx += 1;
        }
    }

    calculateNewLayerPivot(clickedButton)
    {
        let center = this.openButton.getLocalPosition(vec3.create());
        let clicked = clickedButton.getLocalPosition(vec3.create());

        let layerPivot = vec3.sub(vec3.create(), clicked, center); // clicked <--- center direction

        this.layerPivots.push(layerPivot);

        return layerPivot;
    }

    open()
    {
        this.openButton.setToggled(true);
        this.pushNewLayer(this.openButton.childButtons);
    }

    close()
    {
        this.openButton.setToggled(false);
        this.layers = [];                       
        this.layerPivots = [];    
        this.layerRadii = [];
    }

    render(projection_mat, view_mat)
    {
        if(this.openButton)
        {
            this.openButton.render(projection_mat, view_mat);
        }
        for(const layer of this.layers)
        {
            for(const button of layer)
            {
                button.render(projection_mat, view_mat);
            }
        }
    }

    /** All buttons will be parented to center, regardless of layer  */
    _setButtonParentToThis(buttons)
    {
        for(const button of buttons)
        {
            button.setParent(this);
            this._setButtonParentToThis(button.childButtons)
        }
    }

    
    _spinDir() { return this.bClockWise ? -1 : 1;}
}

function shrinkArrayLength(array, newLength)
{
    while(array.length > newLength && newLength >= 0) { array.pop(); }
}












/////////////////////////////////////////////////////////////////////
// Example Radial Tools
////////////////////////////////////////////////////////////////////
export class CubeRadialButton extends RadialButton
{
    constructor(gl)
    {
        super();

        this.gl = gl;
        this.clickCube = coloredCubeFactory(gl);
        this.bgColor = vec3.fromValues(1,1,1);
        this.toggleColor = vec3.fromValues(1,0,0);
        this.desiredScale = vec3.fromValues(0.4, 0.4, 0.4);
        this.setLocalScale(this.desiredScale);
        this.customActionFunction = function(){console.log("CubeRadialButton custom action function; please override")}
    }

    hitTest(rayStart, rayDir)
    {
        let inverseXform = this.getInverseWorldMat();

        let transformedRayStart = vec4.fromValues(rayStart[0], rayStart[1], rayStart[2], 1.0); //this is a point so 4th coordinate is a 1
        vec4.transformMat4(transformedRayStart, transformedRayStart, inverseXform);

        let transformedRayDir = vec4.fromValues(rayDir[0], rayDir[1], rayDir[2], 0.0);   //this is a dir, 4th coordinate is 0
        vec4.transformMat4(transformedRayDir, transformedRayDir, inverseXform);

        //the inverse transform will handle scaling etc; so the fast-box-collision test must use the normalized cube units
        let hit_t = EmeraldUtils.rayTraceFastAABB(-0.5, 0.5, -0.5, 0.5, -0.5, 0.5, transformedRayStart, transformedRayDir);
        if(hit_t)
        {
            return true;
        } 
    }

    render(projection_mat, view_mat)
    {
        this.clickCube.updateShader(this.getWorldMat(), view_mat, projection_mat, this.isToggled() ? this.toggleColor : this.bgColor);
        this.clickCube.bindBuffers();
        this.clickCube.render();
    }
}

/////////////////////////////////////////////////////////////////////
// Example Radial Tools
////////////////////////////////////////////////////////////////////

const coloredTexture_vs =
`
    attribute vec4 vertPos;
    attribute vec3 vertNormal;
    attribute vec2 texUVCoord;

    uniform mat4 model;
    uniform mat4 view_model;
    uniform mat4 normalMatrix; //the inverse transpose of the view_model matrix
    uniform mat4 projection;

    varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+

    void main(){
        gl_Position = projection * view_model * vertPos;
        uvCoord = texUVCoord;
    }
`;

const coloredTexture_fs = `
    varying highp vec2 uvCoord;
    uniform sampler2D texSampler;
    uniform highp vec3 color;

    void main(){
        gl_FragColor = texture2D(texSampler, uvCoord);
        gl_FragColor = gl_FragColor * vec4(color, 1);
    }
`;

class TexturedCubeStatics 
{
    constructor(gl)
    {
        //provide custom shaders so we can change the color of the texture when clicked.
        this.clickCube = texturedCubeFactory(gl, coloredTexture_vs, coloredTexture_fs, ["color"]);

        this.clickCube.updateShader = function(modelMat, viewMat, projectionMat, color = vec3.fromValues(1,1,1)){
            let gl = this.gl;
            gl.useProgram(this.shader.program);
            let view_model = mat4.multiply(mat4.create(), viewMat, modelMat);
            gl.uniformMatrix4fv(this.shader.uniforms.view_model, false, view_model);
            gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
            gl.uniform3f(this.shader.uniforms.color, color[0], color[1], color[2]);
        }
    }
}
let static_texturedClickCubePerGlInstance = new Map();
function getTexturedCubeStatics(gl)
{
    if(!static_texturedClickCubePerGlInstance.has(gl))
    {
        let textureCubeStatics = new TexturedCubeStatics(gl);
        static_texturedClickCubePerGlInstance.set(gl, textureCubeStatics);
    }
    return static_texturedClickCubePerGlInstance.get(gl);
}


export class TexturedCubeRadialButton extends RadialButton
{
    constructor(gl, textureObj)
    {
        super();

        let statics = getTexturedCubeStatics(gl);

        this.radiusVector = vec4.fromValues(0.75, 0, 0, 0);

        this.gl = gl;
        this.clickCube = statics.clickCube;
        this.bgColor = vec3.fromValues(1,1,1);
        this.toggleColor = vec3.fromValues(1, 0.9019, 0.6313);
        // this.toggleColor = vec3.fromValues(1, 1, 0.6313);
        this.desiredScale = vec4.fromValues(1,1,1);
        this.setLocalScale(this.desiredScale);
        // this.customActionFunction = function(){console.log("TexturedCubeRadialButton custom action function; please override")}
        this.customActionFunction = function(){}
        this.textureObj = textureObj;
    }

    hitTest(rayStart, rayDir)
    {
        let inverseXform = this.getInverseWorldMat();

        let transformedRayStart = vec4.fromValues(rayStart[0], rayStart[1], rayStart[2], 1.0); //this is a point so 4th coordinate is a 1
        vec4.transformMat4(transformedRayStart, transformedRayStart, inverseXform);

        let transformedRayDir = vec4.fromValues(rayDir[0], rayDir[1], rayDir[2], 0.0);   //this is a dir, 4th coordinate is 0
        vec4.transformMat4(transformedRayDir, transformedRayDir, inverseXform);

        //the inverse transform will handle scaling etc; so the fast-box-collision test must use the normalized cube units
        let hit_t = EmeraldUtils.rayTraceFastAABB(-0.5, 0.5, -0.5, 0.5, -0.5, 0.5, transformedRayStart, transformedRayDir);
        if(hit_t)
        {
            return true;
        } 
        
    }
    render(projection_mat, view_mat)
    {
        this.clickCube.bindBuffers();
        this.clickCube.updateShader(this.getWorldMat(), view_mat, projection_mat, this.isToggled() ? this.toggleColor : this.bgColor);
        this.clickCube.bindTexture(this.gl.TEXTURE0, this.textureObj.glTextureId, this.clickCube.shader.uniforms.texSampler);
        this.clickCube.render();
    }
}


let static_TexturedTextButton = new Map();
export class TexturedTextButton_Statics
{
    static get(gl)
    {
        if(!static_TexturedTextButton.has(gl))
        {
            console.log("creating TexturedTextButton_Statics");
            let statics = new TexturedTextButton_Statics(gl);
            static_TexturedTextButton.set(gl, statics);
        }
        return static_TexturedTextButton.get(gl);
    }

    constructor(gl)
    {
        this.gl = gl;
        this.font = new Montserrat_BMF(gl, "../shared_resources/Textures/Fonts/Montserrat_ss_alpha_1024x1024_wb.png");
        this.font.setFontColor(vec3.fromValues(0,0,0));
    }
    
}

export class TexturedTextButton extends TexturedCubeRadialButton
{
    constructor(gl, textureObj, text="")
    {
        super(gl, textureObj);

        let statics = TexturedTextButton_Statics.get(gl);

        this.text = new TextBlockSceneNode(gl, statics.font, text);
        this.text.setParent(this);
        this.text.setLocalPosition(vec3.fromValues(0,0,0.6));

        this.closeLayerOnAction = true;

        this.updateLayout();
    }

    updateLayout()
    {
        // let radii = this.text.wrappedText.getLocalWidth() / 2;
        // let localScale = this.text.getLocalScale(vec3.create());    //this correction should probably be done in scene text wrapper
        // radii = radii * localScale[0];
        // this.radiusVector = vec4.fromValues(radii, 0, 0, 0);
        // let calcRadius = this.getButtonRadius();

        let textWidth = this.text.wrappedText.getLocalWidth() / 2;

        let createBorderFactor = 0.05;
        let textureCubeWidth = 0.5 - (createBorderFactor);
        let scaleUp = textureCubeWidth / textWidth;
        scaleUp = scaleUp > 20 ? 20 : scaleUp;
        this.text.setLocalScale(vec3.fromValues(scaleUp, scaleUp, scaleUp));

    }

    takeAction()
    {
        if(this.customTextActionFunction)
        {
            this.customTextActionFunction(this.text.wrappedText.text);
        }
        super.takeAction();
    }

    actionClosesLayer(){return this.closeLayerOnAction;}

    render(projection_mat, view_mat)
    {
        this.requestClean();
        super.render(projection_mat, view_mat);
        this.text.render(projection_mat, view_mat);
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
