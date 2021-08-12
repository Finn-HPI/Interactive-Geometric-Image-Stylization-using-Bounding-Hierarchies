import { PaperScope, Path, Point} from "paper/dist/paper-core";
import { DataPoint } from "../../trees/dataPoint";
import { Layer } from "./layer";

export class LayerViewer{

    protected _scope!: paper.PaperScope;
    protected _canvasSize!: [number, number];

    public constructor(canvasSize: [number, number]){
        this._canvasSize = canvasSize;
        this._scope = new PaperScope();
    }

    public showLayer(layer: Layer){
        this._scope.setup('layer-canvas');
        this.clear();
        const bounds = this._scope.view.bounds;
        const xScale = bounds.width / this._canvasSize[0];
        const yScale = bounds.height / this._canvasSize[1];

        layer.points.forEach((point: DataPoint) => {
            let circ = new Path.Circle(new Point(point.x * xScale, point.y * yScale), 1);
            circ.fillColor = point.color;
        });
    }

    public clear(){
        if(this._scope && this._scope.project)
            this._scope.project.clear();
    }
}