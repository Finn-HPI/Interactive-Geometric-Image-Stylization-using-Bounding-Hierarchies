import { Color } from "paper/dist/paper-core";
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
import * as d3 from "d3";

export enum BorderMode{
    FILL, FILL_AND_BORDER, BORDER, WIREFRAME
}

export enum ColorMode{
    COLOR, GRAY_SCALE, IMAGE, WHITE
}
export class VectorControls {

    protected _controls!: [Controls, Controls, Controls, Controls];
    protected _svgBuilder!: SVGBuilder;
    protected _renderer!: ImageRenderer;

    protected _borderModes: Map<string, BorderMode> = new Map<string, BorderMode>([
        ['Fill', BorderMode.FILL],
        ['Fill + Border', BorderMode.FILL_AND_BORDER],
        ['Wireframe [Border color]', BorderMode.BORDER],
        ['Wireframe [Node color]', BorderMode.WIREFRAME]
    ]);

    protected _colorModes: Map<string, ColorMode> = new Map<string, ColorMode>([
        ['Color', ColorMode.COLOR],
        ['Gray Scale', ColorMode.GRAY_SCALE],
        ['Image', ColorMode.IMAGE]
    ]);

    public constructor(id: string, id2: string, id3: string, id4: string){
        this._controls = [new Controls(id), new Controls(id2, 0.5, 'webgl-canvas'), new Controls(id3), new Controls(id4)];
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

        const exportTemplateButton = this._controls[3].createActionButton('Export Template', 'btn-warning');
        exportTemplateButton.addEventListener('click', () => {
            this.exportTemplate();
        });

        this.initAppearanceSettings();
    }

    private initAppearanceSettings(){

        const colorMode = this._controls[1].createSelectListInput(
            'Color Mode', Array.from(this._colorModes.keys()));
        colorMode.addEventListener('change', (event) => {
            Config.updateValue('colorMode', this._colorModes.get((event.target as HTMLInputElement).value) as ColorMode);
        });

        const borderMode = this._controls[1].createSelectListInput(
            'Border Mode', Array.from(this._borderModes.keys()));
        borderMode.addEventListener('change', (event) => {
            Config.updateValue('borderMode', this._borderModes.get((event.target as HTMLInputElement).value) as BorderMode);
        });

        const borderWidth0 = this._controls[1].createNumberInput(
            'borderWidth [minLevel]', '', 0.3, '', 0, 20, 0.1
        );
        borderWidth0.addEventListener('change', (event) => {
            Config.updateValue('border0', Number((event.target as HTMLInputElement).value));
        });

        const borderWidth1 = this._controls[1].createNumberInput(
            'borderWidth [maxLevel]', '', 0.3, '', 1, 20, 0.1
        );
        borderWidth1.addEventListener('change', (event) => {
            Config.updateValue('border1', Number((event.target as HTMLInputElement).value));
        });

        const color0 = this._controls[1].createColorInput('color [minLevel]');
        color0.addEventListener('change', (event) => {
            let hex = (event.target as HTMLInputElement).value;
            Config.updateValue('color0', hex);
        });

        const color1 = this._controls[1].createColorInput('color [maxLevel]');
        color1.addEventListener('change', (event) => {
            let hex = (event.target as HTMLInputElement).value;
            Config.updateValue('color1', hex);
        });

        const applyButton = this._controls[2].createActionButton('Apply on existing SVG', 'btn-primary');
        applyButton.addEventListener('click', () => {
            if(!this._svgBuilder.isEmpty()){
                this._svgBuilder.applyAppearanceSettings();
                this._svgBuilder.display();
            }
        });

        Config.registerList([
            {name: 'colorMode', element: colorMode},
            {name: 'borderMode', element: borderMode},
            {name: 'border0', element: borderWidth0},
            {name: 'border1', element: borderWidth1},
            {name: 'color0', element: color0},
            {name: 'color1', element: color1}
        ]);
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
                key
            );
            this._svgBuilder.treeToSvg();

        });
        this._svgBuilder.applyAppearanceSettings();
        this._svgBuilder.display();
        setProgress(0);
    }


    private exportSVG(){
        let link = document.createElement("a");
        let url = "data:image/svg+xml;utf8," + encodeURIComponent(this._svgBuilder.lastSVG);
        link.download = 'svg';
        link.href = url;
        link.click();
    }

    private exportTemplate(){
        this._svgBuilder.applyAppearanceSettings({
            border0: 1,
            border1: 1,
            borderMode: BorderMode.FILL_AND_BORDER,
            colorMode: ColorMode.WHITE,
            color0: '#000000',
            color1: '#000000'
        });
        this._svgBuilder.buildColoringTemplate();
        this._svgBuilder.applyAppearanceSettings();
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

    public set svgBuilder(builder: SVGBuilder){
        this._svgBuilder = builder;
    }
}