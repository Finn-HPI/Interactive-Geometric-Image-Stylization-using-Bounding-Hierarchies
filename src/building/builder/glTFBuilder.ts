import { PathItem } from "paper/dist/paper-core";
import { Config } from "../../config/config";
import { ExportMode } from "../../controls/geometryControls";
import { bytesToBase64 } from "../../utils/base64";
import { getColorFromHex } from "../../utils/colorUtil";
import { svgPathToPolygons } from "../../utils/svgUtils";

export class GlTFBuilder {

    protected _encodedUri!: string;

    protected ARRAY_BUFFER = 34962;
    protected ELEMENT_ARRAY_BUFFER = 34963;
    protected FLOAT = 5126;
    protected UNSIGNED_SHORT = 5123;
    protected UNSIGNED_INT = 5125

    protected _width!: number;
    protected _height!: number;

    protected _lastIndex = 0;
    protected _vertices!: Array<number>;
    protected _normals!: Array<number>;
    protected _indices!: Array<number>;
    protected _colors!: Array<number>;
    protected _texCoords!: Array<number>;

    protected _centers!: Array<number>;
    protected _offsets!: Array<number>;

    protected _encodedImage!: string;

    protected _minMaxInfo!: {
        minIndex: number,
        maxIndex: number,
        minX: number, maxX: number, 
        minY: number, maxY: number, 
        minZ: number, maxZ: number,
        minUVX: number, maxUVX: number, 
        minUVY: number, maxUVY: number,
        minRed: number, maxRed: number,
        minGreen: number, maxGreen: number,
        minBlue: number, maxBlue: number,
        minCenterX: number, maxCenterX: number,
        minCenterY: number, maxCenterY: number,
        minCenterZ: number, maxCenterZ: number,
        minOffsetX: number, maxOffsetX: number,
        minOffsetY: number, maxOffsetY: number,
        minOffsetZ: number, maxOffsetZ: number,
        minNormalX: number, maxNormalX: number,
        minNormalY: number, maxNormalY: number,
        minNormalZ: number, maxNormalZ: number
    };

    public constructor(){
        this.cleanSetup();
    }

    private cleanSetup(){
        this._lastIndex = 0;
        this._vertices = new Array<number>();
        this._normals = new Array<number>();
        
        this._indices = new Array<number>();
        this._colors = new Array<number>();
        this._texCoords = new Array<number>();
    
        this._centers = new Array<number>();
        this._offsets = new Array<number>();

        this._minMaxInfo = {
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
            minOffsetZ: 0, maxOffsetZ: 0,
            minNormalX: 0, maxNormalX: 0,
            minNormalY: 0, maxNormalY: 0,
            minNormalZ: 0, maxNormalZ: 0,
        };
    }

    public preprocessAndBuild(){
        let paddingLength = 0;
        let indices2 = new Uint32Array(this._indices.length + paddingLength);

        for(let i = 0; i < indices2.length; i++)
            indices2[i] = this._indices[i];

        let vertices2 = new Float32Array(this._vertices);
        let normals2 = new Float32Array(this._normals);
        let colors2 = new Float32Array(this._colors);
        let texCoords2 = new Float32Array(this._texCoords);
        let centers2 = new Float32Array(this._centers);
        let offsets2 = new Float32Array(this._offsets);

        let i = new Uint8Array(indices2.buffer);
        let v = new Uint8Array(vertices2.buffer);
        let n = new Uint8Array(normals2.buffer);
        let c = new Uint8Array(colors2.buffer);
        let t = new Uint8Array(texCoords2.buffer);
        let center = new Uint8Array(centers2.buffer);
        let o = new Uint8Array(offsets2.buffer);

        let indexUri = "data:application/gltf-buffer;base64," + bytesToBase64(i);
        let vertexUri = "data:application/gltf-buffer;base64," + bytesToBase64(v);
        let normalUri = "data:application/gltf-buffer;base64," + bytesToBase64(n);
        let colorUri = "data:application/gltf-buffer;base64," + bytesToBase64(c);
        let texCoordUri = "data:application/gltf-buffer;base64," + bytesToBase64(t);
        let centerUri = "data:application/gltf-buffer;base64," + bytesToBase64(center);
        let offsetUri = "data:application/gltf-buffer;base64," + bytesToBase64(o);

        this.exportGlTF(
            indexUri,
            vertexUri,
            normalUri,
            colorUri,
            texCoordUri,
            centerUri,
            offsetUri,
            indices2.length * 4,
            paddingLength,
            this._vertices.length * 4,
            this._colors.length * 4,
            this._offsets.length * 4,
            this._texCoords.length * 4,
            this._indices.length,
            this._vertices.length / 3,
            this._colors.length / 3,
            this._offsets.length / 3
        );
    }

    public getCoordinates(point: [number, number], pathDepth: number): [number, number, number]{
        let pointXY = this.normalizePoint(point[0], point[1], this._width, this._height);
        let pointZ = pathDepth / 255 - 0.5;
        return [pointXY[0], pointXY[1], pointZ];
    }

    private addCoordinateToVerticesAndNormals(point: [number, number, number], normal: [number, number, number]){
        this._vertices.push(... point);
        this._normals.push(... normal);
    }

    private upadateIndeces(poly: Array<number>, dimensions = 2){
        const earcut = require('earcut');
        let polyIndices: Array<number> = earcut(poly, null, dimensions);
        for(let i = 0; i < polyIndices.length - 2; i += 3){
            this._indices.push(polyIndices[i] + this._lastIndex);
            this._indices.push(polyIndices[i + 1] + this._lastIndex);
            this._indices.push(polyIndices[i + 2] + this._lastIndex);
        }
        this._lastIndex = this._vertices.length / 3;
    }

    private cross(a: [number, number, number], b: [number, number, number]): [number, number, number]{
       return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }

    private minus(a: [number, number, number], b: [number, number, number]): [number, number ,number]{
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    private multiply(a: [number, number, number], f: number): [number, number, number]{
        return [a[0] * f, a[1] * f, a[2] * f];
    }

    private magnitude(a: [number, number, number]){
        return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    }

    private extendPathToBack(polygon: Array<[number, number]>, pathDepth: number, color: paper.Color){
        if(polygon.length < 2) return;
        for(let i = 0; i < polygon.length -1; i++){
            let poly = new Array<number>();

            const point1 = this.getCoordinates(polygon[i], pathDepth);
            const point2 = this.getCoordinates(polygon[i+1], pathDepth);
            const point3: [number, number, number] = [point1[0], point1[1], -0.5];
            const point4: [number, number, number] = [point2[0], point2[1], -0.5];

            const points = [point1, point2, point4, point3];
            points.forEach((point: [number, number, number]) => {

                poly.push(... point);

                let normal = this.multiply(this.cross(this.minus(point1, point2), this.minus(point4, point2)), -1);
                const mag = this.magnitude(normal);
                normal = this.multiply(normal, 1/mag);

                this.addCoordinateToVerticesAndNormals(point, normal);

                this._colors.push(color.red);
                this._colors.push(color.green);
                this._colors.push(color.blue);

                this._texCoords.push(polygon[i][0] / this._width);
                this._texCoords.push(polygon[i][1] / this._height);
            });

            this._indices.push(1 + this._lastIndex);
            this._indices.push(0 + this._lastIndex);
            this._indices.push(3 + this._lastIndex);

            this._indices.push(3 + this._lastIndex);
            this._indices.push(2 + this._lastIndex);
            this._indices.push(1 + this._lastIndex);

            this._lastIndex = this._vertices.length / 3;
        }
    }


    private async triangulatePath(path: string, pathDepth: number, color: paper.Color, extend = false){
        
        let poly = new Array<number>();
        let maxRecursionDepth = Config.getValue('maxRecursionDepth') as number;

        let points = svgPathToPolygons(path, maxRecursionDepth, {tolerance:1, decimals:1});
        points[0].forEach((item: [number, number]) => {

            let point = this.getCoordinates(item, pathDepth);
            poly.push(point[0], point[1]);

            this.addCoordinateToVerticesAndNormals(point, [0, 0, 1]);
            let pathItem = PathItem.create(path);

            let center = this.normalizePoint(
                pathItem.bounds.center.x,
                pathItem.bounds.center.y,
                this._width,
                this._height
            );
            
            this._centers.push(center[0]);
            this._centers.push(center[1]);
            this._centers.push(point[2]);
            

            this._offsets.push(point[0] - center[0]);
            this._offsets.push(point[1] - center[0]);
            this._offsets.push(0);

            this._colors.push(color.red);
            this._colors.push(color.green);
            this._colors.push(color.blue);

            this._texCoords.push(item[0] / this._width);
            this._texCoords.push(item[1] / this._height);
        });
        this.upadateIndeces(poly);

        if(extend){
            let polyBack = new Array<number>();
            points[0].forEach((item: [number, number]) => {
                let point = this.getCoordinates(item, 0);

                polyBack.push(point[0], point[1]);
                this.addCoordinateToVerticesAndNormals(point, [0, 0, -1]);
               
                this._colors.push(color.red);
                this._colors.push(color.green);
                this._colors.push(color.blue);

                this._texCoords.push(item[0] / this._width);
                this._texCoords.push(item[1] / this._height);
            });
            if(polyBack.length > 0)
                this.upadateIndeces(polyBack);

            this.extendPathToBack(points[0], pathDepth, color);
        }
    }

    public fromColorGroups(groups: Map<string, Array<string>>, width: number, height: number, encoded_image: string, extend = false){
        this._encodedImage = encoded_image;
        this._width = width;
        this._height = height;
        
        groups.forEach((value: Array<string>, key: string) => {
            value.forEach((item: string) => {
                let pathRegex = item.match(/path d="([^"]*)"/);
                let depthRegex = item.match(/depth="([^"]*)"/);
                let groupColorRegex = key.match(/fill="([^"]*)"/);
                let colorRegex = item.match(/fill="([^"]*)"/);

                let color;
                let depth;

                if(groupColorRegex && groupColorRegex[1].length > 0)
                    color = getColorFromHex(groupColorRegex[1]);

                if(colorRegex && colorRegex[1].length > 0 && colorRegex[1] != 'none')
                    color = getColorFromHex(colorRegex[1]);

                if(color && pathRegex && depthRegex && pathRegex[1].length > 0 && depthRegex.length > 0){
                    depth = Number(depthRegex[1])
                    this.triangulatePath(pathRegex[1], depth, color, extend);
                }
            });
        });
        this.gatherMinAndMaxInfo();
        this.preprocessAndBuild();
        this.cleanSetup();
    }

    public normalizePoint(x: number, y: number, width: number, height: number){
        let max = Math.max(width, height) / 2;
        let center = [width / 2, height / 2];
        let point: [number, number] = [x - center[0], y - center[1]];
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
                            TEXCOORD_0: 2,
                            NORMAL: 5        
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
                            COLOR_0: 2,
                            NORMAL: 5
                        },
                        indices: 0,
                    }]
                }];
        }
    }

    private getBufferData(
        indexUri: string, 
        vertexUri: string,
        normalUri: string,
        colorUri: string,
        texCoordUri: string,
        centerUri: string,
        offsetUri: string,
        byteLengthIndeces: number,
        paddingLength: number,
        byteLengthVertices: number,
        byteLengthColors: number,
        byteLengthOffsets: number,
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
                byteLength: byteLengthOffsets
            },
            {
                uri: offsetUri,
                byteLength: byteLengthOffsets
            },
            {
                uri: normalUri,
                byteLength: byteLengthVertices
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
        byteLengthColors: number, byteLengthOffsets: number,
        byteLengthTexCoords: number
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
                byteLength: byteLengthOffsets,
                target: this.ARRAY_BUFFER
            },
            {
                buffer: 4,
                byteOffset: 0,
                byteLength: byteLengthOffsets,
                target: this.ARRAY_BUFFER
            },
            {
                buffer: 5,
                byteOffset: 0,
                byteLength: byteLengthVertices,
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

    public getAccessorData(indexCount: number, vertexCount: number, colorCount: number, offsetCount: number){
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
                count: offsetCount,
                type: 'VEC3',
                max: [this._minMaxInfo.maxCenterX, this._minMaxInfo.maxCenterY, this._minMaxInfo.maxCenterZ],
                min: [this._minMaxInfo.minCenterX, this._minMaxInfo.minCenterY, this._minMaxInfo.minCenterZ]
            },
            {
                bufferView: 4,
                byteOffset: 0,
                componentType: this.FLOAT,
                count: offsetCount,
                type: 'VEC3',
                max: [this._minMaxInfo.maxOffsetX, this._minMaxInfo.maxOffsetY, this._minMaxInfo.maxOffsetZ],
                min: [this._minMaxInfo.minOffsetX, this._minMaxInfo.minOffsetY, this._minMaxInfo.minOffsetZ]
            },
            {
                bufferView: 5,
                byteOffset: 0,
                componentType: this.FLOAT,
                count: vertexCount,
                type: 'VEC3',
                max: [this._minMaxInfo.maxNormalX, this._minMaxInfo.maxNormalY, this._minMaxInfo.maxNormalZ],
                min: [this._minMaxInfo.minNormalX, this._minMaxInfo.minNormalY, this._minMaxInfo.minNormalZ]
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
        normalUri: string,
        colorUri: string,
        texCoordUri: string,
        centerUri: string,
        offsetUri: string,
        byteLengthIndeces: number,
        paddingLength: number,
        byteLengthVertices: number,
        byteLengthColors: number,
        byteLengthOffsets: number,
        byteLengthTexCoords: number,
        indexCount: number,
        vertexCount: number,
        colorCount: number,
        offsetCount: number
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
                normalUri,
                colorUri,
                texCoordUri,
                centerUri,
                offsetUri,
                byteLengthIndeces,
                paddingLength,
                byteLengthVertices,
                byteLengthColors,
                byteLengthOffsets,
                byteLengthTexCoords
            ),
            bufferViews: this.getBufferViewData(
                byteLengthIndeces, byteLengthVertices, 
                byteLengthColors, byteLengthOffsets,
                byteLengthTexCoords
            ),
            accessors: this.getAccessorData(indexCount, vertexCount, colorCount, offsetCount),
            asset: {
                version: '2.0'
            }
        };
        this._encodedUri = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gltf, null, 2));
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

        this._minMaxInfo.minNormalX = this._normals[0];
        this._minMaxInfo.maxNormalX = this._normals[0];

        this._minMaxInfo.minNormalY = this._normals[1];
        this._minMaxInfo.maxNormalY = this._normals[1];

        this._minMaxInfo.minNormalZ = this._normals[2];
        this._minMaxInfo.maxNormalZ = this._normals[2];

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

            if(this._normals[i] < this._minMaxInfo.minNormalX)
                this._minMaxInfo.minNormalX = this._normals[i];
            if(this._normals[i+1] < this._minMaxInfo.minNormalY)
                this._minMaxInfo.minNormalY = this._normals[i+1];
            if(this._normals[i+2] < this._minMaxInfo.minNormalZ)
                this._minMaxInfo.minNormalZ = this._normals[i+2];

            if(this._normals[i] > this._minMaxInfo.maxNormalX)
                this._minMaxInfo.maxNormalX = this._normals[i];
            if(this._normals[i+1] > this._minMaxInfo.maxNormalY)
                this._minMaxInfo.maxNormalY = this._normals[i+1];
            if(this._normals[i+2] > this._minMaxInfo.maxNormalZ)
                this._minMaxInfo.maxNormalZ = this._normals[i+2];
        }

        for(let i = 0; i < this._offsets.length - 2; i +=3){
            if(this._centers[i] < this._minMaxInfo.minCenterX)
                this._minMaxInfo.minCenterX = this._centers[i];
            if(this._centers[i+1] < this._minMaxInfo.minCenterY)
                this._minMaxInfo.minCenterY = this._centers[i+1];
            if(this._centers[i+2] < this._minMaxInfo.minCenterZ)
                this._minMaxInfo.minCenterZ = this._centers[i+2];

            if(this._centers[i] > this._minMaxInfo.maxCenterX)
                this._minMaxInfo.maxCenterX = this._centers[i];
            if(this._centers[i+1] > this._minMaxInfo.maxCenterY)
                this._minMaxInfo.maxCenterY = this._centers[i+1];
            if(this._centers[i+2] > this._minMaxInfo.maxCenterZ)
                this._minMaxInfo.maxCenterZ = this._centers[i+2];

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

    public get encodedUri(){
        return this._encodedUri;
    }
}