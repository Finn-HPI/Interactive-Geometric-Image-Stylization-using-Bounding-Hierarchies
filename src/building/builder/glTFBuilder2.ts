import { Config } from "../../config/config";
import { ExportMode } from "../../controls/geometryControls";
import { TreeNode } from "../../trees/node";
import { bytesToBase64 } from "../../utils/base64";

export class GlTFBuilder {

    protected ARRAY_BUFFER = 34962;
    protected ELEMENT_ARRAY_BUFFER = 34963;
    protected FLOAT = 5126;
    protected UNSIGNED_SHORT = 5123;
    protected UNSIGNED_INT = 5125

    protected _width!: number;
    protected _height!: number;

    protected _lastIndex = 0;
    protected _vertices = new Array<number>();
    protected _indices = new Array<number>();
    protected _colors = new Array<number>();
    protected _texCoords = new Array<number>();

    protected _centers = new Array<number>();
    protected _offsets = new Array<number>();

    protected _encodedImage!: string;

    protected _minMaxInfo = {
        minIndex: 0,
        maxIndex: 0,
        minX: 0, maxX: 0, 
        minY: 0, maxY: 0, 
        minZ: 0, maxZ: 0,
        minUVX: 0, maxUVX: 0, 
        minUVY: 0, maxUVY: 0,
        minRed: 0, maxRed: 0,
        minGreen: 0, maxGreen: 0,
        minBlue: 0, maxBlue: 0,
        minCenterX: 0, maxCenterX: 0,
        minCenterY: 0, maxCenterY: 0,
        minCenterZ: 0, maxCenterZ: 0,
        minOffsetX: 0, maxOffsetX: 0,
        minOffsetY: 0, maxOffsetY: 0,
        minOffsetZ: 0, maxOffsetZ: 0
    };

    public preprocessAndBuild(){
        let paddingLength = 0;
        let indices2 = new Uint32Array(this._indices.length + paddingLength);

        for(let i = 0; i < indices2.length; i++)
            indices2[i] = this._indices[i];

        let vertices2 = new Float32Array(this._vertices);
        let colors2 = new Float32Array(this._colors);
        let texCoords2 = new Float32Array(this._texCoords);
        let centers2 = new Float32Array(this._centers);
        let offsets2 = new Float32Array(this._offsets);

        let i = new Uint8Array(indices2.buffer);
        let v = new Uint8Array(vertices2.buffer);
        let c = new Uint8Array(colors2.buffer);
        let t = new Uint8Array(texCoords2.buffer);
        let center = new Uint8Array(centers2.buffer);
        let o = new Uint8Array(offsets2.buffer);

        let indexUri = "data:application/gltf-buffer;base64," + bytesToBase64(i);
        let vertexUri = "data:application/gltf-buffer;base64," + bytesToBase64(v);
        let colorUri = "data:application/gltf-buffer;base64," + bytesToBase64(c);
        let texCoordUri = "data:application/gltf-buffer;base64," + bytesToBase64(t);
        let centerUri = "data:application/gltf-buffer;base64," + bytesToBase64(center);
        let offsetUri = "data:application/gltf-buffer;base64," + bytesToBase64(o);

        this.exportGlTF(
            indexUri,
            vertexUri,
            colorUri,
            texCoordUri,
            centerUri,
            offsetUri,
            indices2.length * 4,
            paddingLength,
            this._vertices.length * 4,
            this._colors.length * 4,
            this._texCoords.length * 4,
            this._indices.length,
            this._vertices.length / 3,
            this._colors.length / 3
        );
    }

    private extractDataFromPath(
        node: TreeNode,
        path: paper.PathItem
    ){
        const earcut = require('earcut');
        let poly = new Array<number>();

        (path as paper.Path).segments.forEach((segment: paper.Segment) => {
            let point = this.normalizePoint(segment.point.x, segment.point.y, this._width, this._height);
            poly.push(point[0]);
            poly.push(point[1]);
            
            const depth = node.depth / 255 - 0.5;
            this._vertices.push(point[0]);
            this._vertices.push(point[1]);
            this._vertices.push(depth);

            let center = this.normalizePoint(
                (node.path as paper.PathItem).bounds.center.x,
                (node.path as paper.PathItem).bounds.center.y,
                this._width,
                this._height
            );
            
            this._centers.push(center[0]);
            this._centers.push(center[1]);
            this._centers.push(depth);
            

            this._offsets.push(point[0] - center[0]);
            this._offsets.push(point[1] - center[0]);
            this._offsets.push(0);

            this._colors.push(node.color.red);
            this._colors.push(node.color.green);
            this._colors.push(node.color.blue);

            this._texCoords.push(segment.point.x / this._width);
            this._texCoords.push(segment.point.y / this._height);
        });
        let polyIndices: Array<number> = earcut(poly);
        for(let i = 0; i < polyIndices.length - 2; i++){
            this._indices.push(polyIndices[i] + this._lastIndex);
            this._indices.push(polyIndices[i + 1] + this._lastIndex);
            this._indices.push(polyIndices[i + 2] + this._lastIndex);
        }
        this._lastIndex = this._vertices.length / 3;
    }

    public fromTree(tree: any, width: number, height: number, encoded_image: string){
        this._encodedImage = encoded_image;
        this._width = width;
        this._height = height;

        tree.allTreeNodes(tree.root).forEach((each: TreeNode) => {
            if(each.path !== null){
                if(each.childPaths.length >= 1)
                    each.childPaths.forEach((child: paper.PathItem) => {
                        this.extractDataFromPath(each, child);
                    });
                else
                    this.extractDataFromPath(each, each.path)
            }
        });
        
        this.gatherMinAndMaxInfo();
        this.preprocessAndBuild();
    }

    public normalizePoint(x: number, y: number, width: number, height: number){
        let max = Math.max(width, height) / 2;
        let center = [width / 2, height / 2];
        let point = [x - center[0], y - center[1]];
        point = [point[0] / max, -point[1] / max];
        return point;
    }

    private getMeshData(){
        switch(Config.getValue('exportMode')){
            case ExportMode.TEXTURE:
                return [{
                    primitives: [{
                        attributes: {
                            POSITION: 1,
                            TEXCOORD_0: 2
                        },
                        indices: 0,
                        material: 0
                    }]
                }];
            default:
                return [{
                    primitives: [{
                        attributes: {
                            POSITION: 1,
                            COLOR_0: 2
                        },
                        indices: 0,
                    }]
                }];
        }
    }

    private getBufferData(
        indexUri: string, 
        vertexUri: string,
        colorUri: string,
        texCoordUri: string,
        centerUri: string,
        offsetUri: string,
        byteLengthIndeces: number,
        paddingLength: number,
        byteLengthVertices: number,
        byteLengthColors: number,
        byteLengthTexCoords: number
    ){
        let buffers =[
            {
                uri: indexUri,
                byteLength: byteLengthIndeces + paddingLength
            },
            {
                uri: vertexUri,
                byteLength: byteLengthVertices
            },
            {
                uri: colorUri,
                byteLength: byteLengthColors
            },
            {
                uri: centerUri,
                byteLength: byteLengthColors
            },
            {
                uri: offsetUri,
                byteLength: byteLengthColors
            }
        ];
        if(Config.getValue('exportMode') == ExportMode.TEXTURE)
            buffers.splice(2,1, {
                uri: texCoordUri,
                byteLength: byteLengthTexCoords
            });
        return buffers;
    }

    public getBufferViewData(
        byteLengthIndeces: number, byteLengthVertices: number,
        byteLengthColors: number, byteLengthTexCoords: number
    ){
        let bufferView = [
            {
                buffer: 0,
                byteOffset: 0,
                byteLength: byteLengthIndeces,
                target: this.ELEMENT_ARRAY_BUFFER
            },
            {
                buffer: 1,
                byteOffset: 0,
                byteLength: byteLengthVertices,
                target: this.ARRAY_BUFFER
            },
            {
                buffer: 2,
                byteOffset: 0,
                byteLength: byteLengthColors,
                target: this.ARRAY_BUFFER
            },
            {
                buffer: 3,
                byteOffset: 0,
                byteLength: byteLengthColors,
                target: this.ARRAY_BUFFER
            },
            {
                buffer: 4,
                byteOffset: 0,
                byteLength: byteLengthColors,
                target: this.ARRAY_BUFFER
            }
        ];
        if(Config.getValue('exportMode') == ExportMode.TEXTURE)
            bufferView.splice(2,1, {
                buffer: 2,
                byteOffset: 0,
                byteLength: byteLengthTexCoords,
                target: this.ARRAY_BUFFER
            });
        return bufferView;
    }

    public getAccessorData(indexCount: number, vertexCount: number, colorCount: number){
        let accessor = [
            {
                bufferView: 0,
                byteOffset: 0,
                componentType: this.UNSIGNED_INT,
                count: indexCount,
                type: 'SCALAR',
                max: [this._minMaxInfo.maxIndex],
                min: [this._minMaxInfo.minIndex]
            },
            {
                bufferView: 1,
                byteOffset: 0,
                componentType: this.FLOAT,
                count: vertexCount,
                type: 'VEC3',
                max: [this._minMaxInfo.maxX, this._minMaxInfo.maxY, this._minMaxInfo.maxZ],
                min: [this._minMaxInfo.minX, this._minMaxInfo.minY, this._minMaxInfo.minZ]
            },
            {
                bufferView: 2,
                byteOffset: 0,
                componentType: this.FLOAT,
                count: colorCount,
                type: 'VEC3',
                max: [this._minMaxInfo.maxRed, this._minMaxInfo.maxGreen, this._minMaxInfo.maxBlue],
                min: [this._minMaxInfo.minRed, this._minMaxInfo.minGreen, this._minMaxInfo.minBlue]
            },
            {
                bufferView: 3,
                byteOffset: 0,
                componentType: this.FLOAT,
                count: colorCount,
                type: 'VEC3',
                max: [this._minMaxInfo.maxCenterX, this._minMaxInfo.maxCenterY, this._minMaxInfo.maxCenterZ],
                min: [this._minMaxInfo.minCenterX, this._minMaxInfo.minCenterY, this._minMaxInfo.minCenterZ]
            },
            {
                bufferView: 4,
                byteOffset: 0,
                componentType: this.FLOAT,
                count: colorCount,
                type: 'VEC3',
                max: [this._minMaxInfo.maxOffsetX, this._minMaxInfo.maxOffsetY, this._minMaxInfo.maxOffsetZ],
                min: [this._minMaxInfo.minOffsetX, this._minMaxInfo.minOffsetY, this._minMaxInfo.minOffsetZ]
            }
        ];
        if(Config.getValue('exportMode') == ExportMode.TEXTURE)
            accessor.splice(2,1, {
                bufferView: 2,
                byteOffset: 0,
                componentType: this.FLOAT,
                count: vertexCount,
                type: 'VEC2',
                max: [this._minMaxInfo.maxUVX, this._minMaxInfo.maxUVY],
                min: [this._minMaxInfo.minUVX, this._minMaxInfo.minUVY]
            });
        return accessor;
    }

    public exportGlTF(
        indexUri: string, 
        vertexUri: string,
        colorUri: string,
        texCoordUri: string,
        centerUri: string,
        offsetUri: string,
        byteLengthIndeces: number,
        paddingLength: number,
        byteLengthVertices: number,
        byteLengthColors: number,
        byteLengthTexCoords: number,
        indexCount: number,
        vertexCount: number,
        colorCount: number
    ){
        const gltf = {
            scenes: [ { nodes: [0] } ],
            nodes: [ { mesh: 0 }],
            meshes: this.getMeshData(),
            images: [{
                uri: this._encodedImage
            }],
            samplers: [{
                magFilter: 9729,
                minFilter: 9987,
                wrapS: 33071,
                wrapT: 33071
            }],
            materials: [{
                pbrMetallicRoughness: {
                    baseColorTexture: {
                        index: 0
                    },
                    metallicFactor: 0.0,
                    roughnessFactor: 1.0
                }
            }],
            textures: [{
                sampler: 0,
                source: 0
            }],
            buffers: this.getBufferData(
                indexUri, 
                vertexUri,
                colorUri,
                texCoordUri,
                centerUri,
                offsetUri,
                byteLengthIndeces,
                paddingLength,
                byteLengthVertices,
                byteLengthColors,
                byteLengthTexCoords
            ),
            bufferViews: this.getBufferViewData(
                byteLengthIndeces, byteLengthVertices, 
                byteLengthColors, byteLengthTexCoords
            ),
            accessors: this.getAccessorData(indexCount, vertexCount, colorCount),
            asset: {
                version: '2.0'
            }
        };
        let link = document.createElement("a");
        link.download = 'test.gltf';
        link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gltf, null, 2));
        link.click();
    }

    private gatherMinAndMaxInfo(){
        this._minMaxInfo.minIndex = this._indices[0];
        this._minMaxInfo.maxIndex = this._indices[0];

        this._minMaxInfo.minX = this._vertices[0];
        this._minMaxInfo.maxX = this._vertices[0];

        this._minMaxInfo.minY = this._vertices[1];
        this._minMaxInfo.maxY = this._vertices[1];

        this._minMaxInfo.minZ = this._vertices[2];
        this._minMaxInfo.maxZ = this._vertices[2];

        this._minMaxInfo.minRed = this._colors[0];
        this._minMaxInfo.maxRed = this._colors[0];

        this._minMaxInfo.minGreen = this._colors[1];
        this._minMaxInfo.maxGreen = this._colors[1];

        this._minMaxInfo.minBlue = this._colors[2];
        this._minMaxInfo.maxBlue = this._colors[2];

        this._minMaxInfo.minUVX = this._texCoords[0];
        this._minMaxInfo.maxUVX = this._texCoords[0];

        this._minMaxInfo.minUVY = this._texCoords[1];
        this._minMaxInfo.maxUVY = this._texCoords[1];

        this._minMaxInfo.minCenterX = this._centers[0];
        this._minMaxInfo.maxCenterX = this._centers[0];

        this._minMaxInfo.minCenterY = this._centers[1];
        this._minMaxInfo.maxCenterY = this._centers[1];

        this._minMaxInfo.minCenterZ = this._centers[2];
        this._minMaxInfo.maxCenterZ = this._centers[2];

        this._minMaxInfo.minOffsetX = this._offsets[0];
        this._minMaxInfo.maxOffsetX = this._offsets[0];

        this._minMaxInfo.minOffsetY = this._offsets[1];
        this._minMaxInfo.maxOffsetY = this._offsets[1];

        this._minMaxInfo.minOffsetZ = this._offsets[2];
        this._minMaxInfo.maxOffsetZ = this._offsets[2];

        this._indices.forEach((index: number) => {
            if(index < this._minMaxInfo.minIndex)
                this._minMaxInfo.minIndex = index;
            if(index > this._minMaxInfo.maxIndex)
                this._minMaxInfo.maxIndex = index;
        });

        for(let i = 0; i < this._vertices.length -2; i += 3){
            if(this._vertices[i] < this._minMaxInfo.minX)
                this._minMaxInfo.minX = this._vertices[i];
            if(this._vertices[i+1] < this._minMaxInfo.minY)
                this._minMaxInfo.minY = this._vertices[i+1];
            if(this._vertices[i+2] < this._minMaxInfo.minZ)
                this._minMaxInfo.minZ = this._vertices[i+2];

            if(this._vertices[i] > this._minMaxInfo.maxX)
                this._minMaxInfo.maxX = this._vertices[i];
            if(this._vertices[i+1] > this._minMaxInfo.maxY)
                this._minMaxInfo.maxY = this._vertices[i+1];
            if(this._vertices[i+2] > this._minMaxInfo.maxZ)
                this._minMaxInfo.maxZ = this._vertices[i+2];

            if(this._colors[i] < this._minMaxInfo.minRed)
                this._minMaxInfo.minRed = this._colors[i];
            if(this._colors[i+1] < this._minMaxInfo.minGreen)
                this._minMaxInfo.minGreen = this._colors[i+1];
            if(this._colors[i+2] < this._minMaxInfo.minBlue)
                this._minMaxInfo.minBlue = this._colors[i+2];

            if(this._colors[i] > this._minMaxInfo.maxRed)
                this._minMaxInfo.maxRed = this._colors[i];
            if(this._colors[i+1] > this._minMaxInfo.maxGreen)
                this._minMaxInfo.maxGreen = this._colors[i+1];
            if(this._colors[i+2] > this._minMaxInfo.maxBlue)
                this._minMaxInfo. maxBlue = this._colors[i+2];

            if(this._centers[i] < this._minMaxInfo.minCenterX)
                this._minMaxInfo.minCenterX = this._centers[i];
            if(this._centers[i+1] < this._minMaxInfo.minCenterY)
                this._minMaxInfo.minCenterY = this._centers[i+1];

            if(this._centers[i] > this._minMaxInfo.maxCenterX)
                this._minMaxInfo.maxCenterX = this._centers[i];
            if(this._centers[i+1] > this._minMaxInfo.maxCenterY)
                this._minMaxInfo.maxCenterY = this._centers[i+1];

            if(this._offsets[i] < this._minMaxInfo.minOffsetX)
                this._minMaxInfo.minOffsetX = this._offsets[i];
            if(this._offsets[i+1] < this._minMaxInfo.minOffsetY)
                this._minMaxInfo.minOffsetY = this._offsets[i+1];
            if(this._offsets[i+2] < this._minMaxInfo.minOffsetZ)
                this._minMaxInfo.minOffsetZ = this._offsets[i+2];

            if(this._offsets[i] > this._minMaxInfo.maxOffsetX)
                this._minMaxInfo.maxOffsetX = this._offsets[i];
            if(this._offsets[i+1] > this._minMaxInfo.maxOffsetY)
                this._minMaxInfo.maxOffsetY = this._offsets[i+1];
            if(this._offsets[i+2] > this._minMaxInfo.maxOffsetZ)
                this._minMaxInfo.maxOffsetZ = this._offsets[i+2];
        }

        this._minMaxInfo.minCenterZ = this._minMaxInfo.minZ;
        this._minMaxInfo.maxCenterZ = this._minMaxInfo.maxZ;

        for(let i = 0; i < this._texCoords.length; i += 2){
            if(this._texCoords[i] < this._minMaxInfo.minUVX)
             this._minMaxInfo.minUVX = this._texCoords[i];
            if(this._texCoords[i+1] < this._minMaxInfo.minUVY)
                this._minMaxInfo.minUVY = this._texCoords[i+1];

            if(this._texCoords[i] > this._minMaxInfo.maxUVX)
             this._minMaxInfo.maxUVX = this._texCoords[i];
            if(this._texCoords[i+1] > this._minMaxInfo.maxUVY)
                this._minMaxInfo.maxUVY = this._texCoords[i+1];
        }
    }
}