import { SVGBuilder } from "../building/builder/svgBuilder";
import { Controls } from "../utils/htmlUtil";

export class VectorControls {

    protected _controls!: [Controls];
    protected _svgBuilder!: SVGBuilder;
    
    public constructor(id: string){
        this._controls = [new Controls(id)];
    }

    public setup(){
        const buildButton = this._controls[0].createActionButton('Build SVG', 'btn-warning');
        buildButton.addEventListener('click', () => {
            this.build();
        });
    }

    public build(){
        
    }

    public set svgBuilder(builder: SVGBuilder){
        this._svgBuilder = builder;
    }
}