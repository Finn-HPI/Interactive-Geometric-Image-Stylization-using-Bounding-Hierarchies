import { PaperScope, Path, Point, Color} from "paper/dist/paper-core";
export class NoiseViewer{

    protected _scope!: paper.PaperScope;
    protected _canvasSize!: [number, number];

    public constructor(canvasSize: [number, number]){
        this._canvasSize = canvasSize;
        this._scope = new PaperScope();
    }

    public showSamplePoints(points: Array<{x: number, y: number}>, backColor = new Color(0,0,0), frontColor = new Color(1,1,1)){
        this._scope.setup('point-canvas');
        this.clear();

        let back = new Path.Rectangle(new Point(0,0), new Point(this._canvasSize));
        back.fillColor = backColor;

        points.forEach((point: {x: number, y: number}) => {
            let circ = new Path.Circle(new Point(Math.floor(point.x), Math.floor(point.y)), 1);
            circ.fillColor = new Color(1, 1, 1);
        });
    }

    public clear(){
        if(this._scope && this._scope.project)
            this._scope.project.clear();
    }
}