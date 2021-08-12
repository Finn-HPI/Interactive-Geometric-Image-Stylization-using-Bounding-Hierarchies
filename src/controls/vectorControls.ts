import { SVGBuilder } from "../building/builder/svgBuilder";
import { Layer } from "../building/layer/layer";
import { Config } from "../config/config";
import { setProgress } from "../global/progressbar";
import { KdTree } from "../trees/kd/kdTree";
import { QuadTree } from "../trees/quad/quadTree";
import { VPTree } from "../trees/vp/vpTree";
import { Controls } from "../utils/htmlUtil";
import { ImageRenderer } from "../webgl/renderer";
import { DataStructure } from "./layerControls";
export class VectorControls {

    protected _controls!: [Controls, Controls];
    protected _svgBuilder!: SVGBuilder;
    protected _renderer!: ImageRenderer;

    public constructor(id: string, id2: string){
        this._controls = [new Controls(id), new Controls(id2)];
        this._svgBuilder = new SVGBuilder();
    }

    public setup(){
        const buildButton = this._controls[0].createActionButton('Build SVG', 'btn-secondary', ['mb-1']);
        buildButton.addEventListener('click', () => {
            this.build();
        });
        const exportSVGButton = this._controls[0].createActionButton('Export SVG', 'btn-warning');
        exportSVGButton.addEventListener('click', () => {
            this.exportSVG();
        });

        const exportTemplateButton = this._controls[1].createActionButton('Export Template', 'btn-warning');
        exportTemplateButton.addEventListener('click', () => {
            this.exportTemplate();
        });
    }

    private build(){
        if(Config.layers.size == 0)
            return;
        this._svgBuilder.reset();
        Config.layers.forEach((item: [number, HTMLElement, HTMLButtonElement, HTMLButtonElement, HTMLButtonElement], key: Layer) => {
            let tree = this.createTree(key.structure);
            tree.clipPath = key.clipPath;
            tree.buildFrom(
                key.points,
                this._renderer.canvasSize[0], this._renderer.canvasSize[1],
                key.colorMode
            );
            console.log(tree);
            this._svgBuilder.buildFrom(
                tree,
                this._renderer.canvasSize[0], this._renderer.canvasSize[1],
                key.maxLod,
                key.maxLevel
            );
            this._svgBuilder.treeToSvg();

        });
        setProgress(0);
        this._svgBuilder.display();
    }


    private exportSVG(){
        let link = document.createElement("a");
        let url = "data:image/svg+xml;utf8," + encodeURIComponent(this._svgBuilder.lastSVG);
        link.download = 'svg';
        link.href = url;
        link.click();
    }

    private exportTemplate(){

    }

    public createTree(type: DataStructure){
        switch(type){
            case DataStructure.VP:
                return new VPTree();
            case DataStructure.QUAD:
                return new QuadTree();
            case DataStructure.KD:
                return new KdTree();
        }
    }

    public set renderer(renderer: ImageRenderer){
        this._renderer = renderer;
    }
}