import { Color } from "paper/dist/paper-core";
import { Config } from "../config/config";
import { DataPoint } from "../trees/dataPoint";
import { colorArrayToColor, colorToColorArray } from "../utils/colorUtil";
import { ImageRenderer } from "../webgl/renderer";

export class Sampler{

    protected _renderer!: ImageRenderer;

    protected _sampleData!: Uint8Array;
    protected _lodData!: Uint8Array;
    protected _depthData!: Uint8Array;
    protected _mattingData!: Uint8Array;
    protected _saliencyAData!: Uint8Array;
    protected _saliencyOData!: Uint8Array;
    protected _segmentationData!: Uint8Array;
    protected _maskData!: Uint8ClampedArray;
    protected _rgbaData!: Uint8Array;

    protected _samplePoints!: Array<DataPoint>;
    protected _colorArray!: Array<[number, number, number]>;

    constructor(renderer: ImageRenderer){
        this._renderer = renderer;
        this.init();
    }

    private init(){
        this._samplePoints = new Array<DataPoint>();
        this._colorArray = new Array<[number, number, number]>();
        this._renderer.resizeExportTexture();
    }

    public generateSampleData(){
        this.init();
        this.gatherData();
        this.createSamplePoints(
            this._renderer.canvasSize[0], this._renderer.canvasSize[1]);
        this.colorQuantizeSamplePoints();
        return this._samplePoints;
    }

    private gatherData(){
        this._sampleData = this._renderer.getSampleData();
        this._depthData = this._renderer.getDepthData();
        this._mattingData = this._renderer.getMattingData();
        this._saliencyAData = this._renderer.getSaliencyAData();
        this._saliencyOData = this._renderer.getSaliencyOData();
        this._segmentationData = this._renderer.getSegmentationData();
        this._lodData = this._renderer.getLodData();

        this._rgbaData = this._renderer.getRGBAData();
        this._maskData = this._renderer.getMaskData();
    }

    private isValidPoint(index: number){
        return this._sampleData[index] + this._sampleData[index + 1] + this._sampleData[index + 2] == 3;
    }

    private createSamplePoints(width: number, height: number){
        let r, g, b = 0;
        for(let x = 0; x < width; x++)
            for(let y = 0; y < height; y++){
                const index = (y * width + x) * 4;
                r = this._rgbaData[index] / 255;
                g = this._rgbaData[index + 1] / 255;
                b = this._rgbaData[index + 2] / 255;

                if(this.isValidPoint(index)){
                    const flippedIndex = ((height - y) * width + x) * 4;
                    let mask_alpha = this._maskData[flippedIndex + 3] / 255;
                    let lod = this._lodData[index] * (1-mask_alpha) + this._maskData[flippedIndex] * mask_alpha;

                    let depth = this._depthData[index];
                    let matting = this._mattingData[index];
                    let saliencyA = this._saliencyAData[index];
                    let saliencyO = this._saliencyOData[index];

                    let segmentation: [number, number, number] = [
                        this._segmentationData[index], 
                        this._segmentationData[index + 1], 
                        this._segmentationData[index + 2]
                    ];
                    let point = new DataPoint(
                        x, height - y, lod, 
                        new Color(r, g, b), 
                        depth, matting, saliencyA, saliencyO, segmentation
                    );
                    this._colorArray.push([r * 255, g * 255, b * 255]);
                    this._samplePoints.push(point);
                    
                }
            }
    }

    private colorQuantizeSamplePoints(){
        let quantize = require('quantize');

        const maxColorCount = Config.getValue('maxColorCount');
        let colorMap = quantize(this._colorArray, maxColorCount);

        if(colorMap !== false)
            this._samplePoints.forEach((each: DataPoint) => {
                each.quantizisedColor = colorArrayToColor(colorMap.map(colorToColorArray(each.color)));
            });
        else{
            this._samplePoints.forEach((each: DataPoint) => {
                each.quantizisedColor = each.color;
            });
        }
    }

    public get samplePoints(){
        return this._samplePoints;
    }
}