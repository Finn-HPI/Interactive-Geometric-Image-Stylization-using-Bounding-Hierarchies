import { Path, Point } from "paper/dist/paper-core";
import { ColorMode, Criteria, DataStructure } from "../../controls/layerControls";
import { DataPoint } from "../../trees/dataPoint";
import { criteriaToString, dataStructureToString } from "../../utils/conversionUtil";

export class Layer {

    protected _points!: DataPoint[];
    protected _structure!: DataStructure;
    protected _criteria!: Criteria;
    protected _colorMode!: ColorMode;

    protected _scaleX!: number;
    protected _scaleY!: number;

    protected _maxLod!: number;
    protected _maxLevel!: number;
    protected _minArea!: number;

    protected _from!: number;
    protected _to!: number;

    protected _clipPath!: paper.PathItem;
    protected _pathAreas!: Array<paper.Path>;

    protected _prevLayer!: Layer;
    protected _nextLayer!: Layer;

    public constructor(
        structure: DataStructure,
        criteria: Criteria,
        from: number,
        to: number,
        maxLevel: number,
        minArea: number,
        colorMode: ColorMode,
    ){
        this._structure = structure;
        this._criteria = criteria;
        this._from = from;
        this._to = to;
        this._maxLevel = maxLevel;
        this._minArea = minArea;
        this._colorMode = colorMode;
        this._pathAreas = new Array<paper.Path>();

        this._scaleX = 1, this._scaleY = 1;
    }

    private validataPoints(){
        let validPoints = new Array<DataPoint>();
        this._points.forEach((point: DataPoint) => {
            if(this.isValidPoint(point)){
                validPoints.push(point);
                if(point.lod > this._maxLod)
                    this._maxLod = point.lod;
            }
        });
        this._points = validPoints;
    }

    private isValidPoint(point: DataPoint){
        switch(this._criteria){
            case Criteria.LOD:
                return this._from <= point.lod && this._to >= point.lod;
            case Criteria.DEPTH:
                return this._from <= point.depth && this._to >= point.depth;
            case Criteria.MATTING:
                return this._from <= point.matting && this._to >= point.matting;
            case Criteria.SALIENCY_A:
                return this._from <= point.saliencyA && this._to >= point.saliencyA;
            case Criteria.SALIENCY_O:
                return this._from <= point.saliencyO && this._to >= point.saliencyO;
            default:
                return false;
        }
    }

    public generateClipPath(width: number, height: number, scaling = true): paper.PathItem{
        const offset = 3
        this._clipPath = new Path.Rectangle([-offset, -offset, width + offset, height + offset]);
       
        if(this._prevLayer)
            this._clipPath = this._prevLayer.generateClipPath(width, height, scaling);

        this._pathAreas.forEach((area: paper.Path) => {
            this._clipPath = this._clipPath.subtract(area);
        });
        if(scaling)
            this._clipPath.scale(this._scaleX, this._scaleY, new Point(0, 0));
        return this._clipPath;
    }

    public get points(){
        return this._points;
    }

    public set points(points: Array<DataPoint>){
        this._points = points;
        this.validataPoints();
    }

    public get structure(){
        return this._structure;
    }

    public get maxLevel(){
        return this._maxLevel;
    }

    public get minArea(){
        return this._minArea
    }

    public get from(){
        return this._from;
    }

    public get to(){
        return this._to;
    }

    public get colorMode(){
        return this._colorMode;
    }

    public get criteria(){
        return this._criteria;
    }

    public get clipPath(){
        return this._clipPath;
    }

    public set clipPath(path: paper.PathItem){
        this._clipPath = path;
    }

    public get maxLod(){
        return this._maxLod;
    }

    public get prevLayer(){
        return this._prevLayer;
    }

    public set prevLayer(layer: Layer){
        this._prevLayer = layer;
    }

    public get nextLayer(){
        return this._nextLayer;
    }

    public set nextLayer(layer: Layer){
        this._nextLayer = layer;
    }

    public toString(){
        return criteriaToString(this._criteria) + ' [' + dataStructureToString(this._structure) + ': ' + this._from + ' - ' + this._to + ']'
    }

    public addPathArea(area: paper.Path){
        this._pathAreas.push(area);
    }

    public removePathArea(area: paper.Path){
        const index = this._pathAreas.indexOf(area);
        if (index > -1)
            this._pathAreas.splice(index, 1);
    }

    public get pathAreas(){
        return this._pathAreas;
    }

    public clearPathAreas(){
        this._pathAreas = new Array<paper.Path>();
    }

    public set scaleX(scale: number){
        this._scaleX = scale;
    }

    public set scaleY(scale: number){
        this._scaleY = scale;
    }
}