import { Color, PaperScope, Path } from "paper/dist/paper-core";
import { Layer } from "./layer";

export class ClipPathViewer {
    protected _scope!: paper.PaperScope;
    protected _canvasSize!: [number, number];

    protected _activeLayer!: Layer;
    protected _mousePressed!: boolean;
    protected _currentPath!: paper.Path;
    protected _startPoint!: paper.Point;

    protected _clipPath!: paper.PathItem;

    public constructor(canvasSize: [number, number]){
        this._canvasSize = canvasSize;
        this._scope = new PaperScope();
    }

    public activateLayer(layer: Layer, show = true){
        this._scope.setup('clip-canvas');
        this._scope.activate();
        this._activeLayer = layer;
        if(show) this.showClipPath();
    }

    public acitvate(){
        this._scope.setup('clip-canvas');
        this._scope.activate();
    }

    public showClipPath(){
        this.clear();
        if(!this._activeLayer)
            return;
        
        let paths = this._activeLayer.generateClipPath(
            this._canvasSize[0], this._canvasSize[1], false
        );
        this._clipPath = paths[0];
        let usableSpace = paths[1];
        usableSpace.fillColor = new Color(0.37, 0.58, 0.89, 0.2);
      
        
        this._clipPath.fillColor = new Color(0.37, 0.58, 0.89, 0.4);
        this._clipPath.strokeColor = new Color(1);
        this._clipPath.strokeWidth = 3;
        this._clipPath.strokeCap = 'round';
        this._clipPath.dashArray = [5, 8];

        const scaling = this.getScaling();
        this._activeLayer.scaleX = scaling[0];
        this._activeLayer.scaleY = scaling[1];
    }

    public mouseDown(point: paper.Point){
        if(this._activeLayer == undefined)
            return;
        
        this._scope.activate();
        this._mousePressed = true;

        this._currentPath = new Path();
        this._currentPath.strokeColor = new Color(1);
        this._currentPath.strokeColor = new Color(1);
        this._currentPath.strokeWidth = 2;
        this._currentPath.strokeCap = 'round';
        this._currentPath.dashArray = [5, 8];
        
        this._currentPath.add(point);
        this._startPoint = point;
    }

    public mouseUp(point: paper.Point){
        if(this._activeLayer == undefined)
            return;
        this._mousePressed = false;
        this._currentPath.add(point);
        this._currentPath.closed = true;
        this._activeLayer.addPathArea(this._currentPath.clone({insert: false, deep: true}));
        this._currentPath.remove();

        this.showClipPath();
    }

    public handleKeys(event: KeyboardEvent){
        if(event.ctrlKey && event.key === 'z' && this._activeLayer){
            this._activeLayer.removeLastPath();
            this.showClipPath();
        }
    }

    public mouseMove(point: paper.Point){
        if(this._activeLayer == undefined || !this._mousePressed || !this._currentPath)
            return;
        if(this._currentPath.lastSegment.point.getDistance(point) > 5)
           this._currentPath.add(point);
    }

    public clear(){
        if(this._scope && this._scope.project)
            this._scope.project.clear();
    }

    public getScaling(){
        const xScale = this._canvasSize[0] / this._scope.view.viewSize.width;
        const yScale = this._canvasSize[1]  /this._scope.view.viewSize.height;
        return [xScale, yScale];
    }

    public get scope(){
        return this._scope;
    }
}