import { Color } from "paper/dist/paper-core";
import { colorToHex } from "../utils/colorUtil";

// https://dev.to/ascorbic/a-more-realistic-html-canvas-paint-tool-313b
export class BrushTool {

    protected _intensity!: number;
    protected _strokeSize!: number;
    protected _color!: paper.Color;

    protected _canMove = false;

    protected _latestPoint!: [number, number];
    protected _drawing = false;

    protected _canvas!: HTMLCanvasElement;
    protected _context!: CanvasRenderingContext2D;

    public constructor(id: string){
        this._intensity = 0;
        this._strokeSize = 0;
        this._canvas = document.getElementById(id) as HTMLCanvasElement;
        this._context = this._canvas.getContext('2d') as CanvasRenderingContext2D;
        this.init();
    }

    private init(){
        this._intensity = 0;
        this._color = new Color(1,1,1,0);
    }

    public mouseButtonIsDown(buttons: number) {
        return ((0b01 & buttons) === 0b01);
    }

    private convertPoint(point: [number, number]): [number, number]{
        let xScale = this._context.canvas.width / this._context.canvas.clientWidth;
        let yScale = this._context.canvas.height / this._context.canvas.clientHeight;

        return [point[0] * xScale, point[1] * yScale];
    }

    public continueStroke(point: [number, number]){
        point = this.convertPoint(point);
        this._context.beginPath();
        this._context.moveTo(this._latestPoint[0], this._latestPoint[1]);

        this._color.alpha = this._intensity;
        this._context.strokeStyle = colorToHex(this._color);

        console.log(this._intensity, this._strokeSize);
        this._context.lineWidth = this._strokeSize;
        this._context.lineCap = 'round';
        this._context.lineJoin = 'round';
        this._context.lineTo(point[0], point[1]);
        this._context.stroke();

        this._latestPoint = point;
    }

    public startStroke(point: [number, number]){
        point = this.convertPoint(point);
        this._drawing = true;
        this._latestPoint = point;
    }

    public mouseMove(evt: any){
        if(!this._drawing || !this._canMove)
            return;
        this.continueStroke([evt.offsetX, evt.offsetY]);
    }

    public mouseDown(evt: MouseEvent){
        if(this._drawing)
            return;
        evt.preventDefault();
        this._canMove = true;
        this.startStroke([evt.offsetX, evt.offsetY]);
    }

    public mouseEnter(evt: MouseEvent){
        if(!this.mouseButtonIsDown(evt.buttons) || this._drawing)
            return;
        this.mouseDown(evt);
    }

    public endStroke(evt: MouseEvent){
        if(!this._drawing)
            return;
        this._drawing = false;
        this._canMove = false;
    }

    public clear(){
        this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    }

    public set color(color: paper.Color){
        this._color = color;
    }

    public get strokeSize(){
        return this._strokeSize;
    }

    public set strokeSize(size: number){
        this._strokeSize = size;
    }

    public set intensity(intensity: number){
        this._intensity = intensity;
    }

    public get canMove(){
        return this._canMove;
    }
}