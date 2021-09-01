import { Controls } from "../utils/htmlUtil";
import { ImageRenderer } from "../webgl/renderer";
import { v4 as uuid } from 'uuid';
import { Config } from "../config/config";
import { Layer } from "../building/layer/layer";
import { Sampler } from "../building/sampler";
import { LayerViewer } from "../building/layer/layerViewer";
import { InputControls } from "./inputControls";
import { ImportanceMapControls } from "./importanceMapControls";
import { SeedingControls } from "./seedingControls";
import { ClipPathViewer } from "../building/layer/clipPathViewer";
import { Point } from "paper/dist/paper-core";
import { setProgress } from "../global/progressbar";

export enum DataStructure {
    VP, QUAD, KD
}

export enum ColorMode {
    MEDIAN, AVG, POINT
}

export enum Criteria {
    LOD, DEPTH, MATTING, SALIENCY_A, SALIENCY_O
}

export class LayerControls {

    protected _controls!: [Controls, Controls, Controls];
    protected _sampler!: Sampler;
    protected _renderer!: ImageRenderer;

    protected _inputControls!: InputControls;
    protected _importanceControls!: ImportanceMapControls;
    protected _seedingControls!: SeedingControls;

    protected _criterias: Map<string, Criteria> = new Map<string, Criteria>([
        ['Lod', Criteria.LOD],
        ['Depth', Criteria.DEPTH],
        ['Matting', Criteria.MATTING],
        ['Saliency Attention', Criteria.SALIENCY_A],
        ['Saliency Objectness', Criteria.SALIENCY_O],
    ]);
    protected _trees: Map<string, DataStructure> = new Map<string, DataStructure>([
        ['VP', DataStructure.VP],
        ['Quad', DataStructure.QUAD],
        ['KD', DataStructure.KD]
    ]);
    protected _colorModes: Map<string, ColorMode> = new Map<string, ColorMode>([
        ['Median', ColorMode.MEDIAN],
        ['Average', ColorMode.AVG],
        ['Point', ColorMode.POINT]
    ]);

    protected _criteria!: Criteria;
    protected _tree!: DataStructure;
    protected _from!: number;
    protected _to!: number;
    protected _color!: ColorMode;
    protected _maxLevel!: number;
    protected _minArea!: number;

    protected _layerViewer!: LayerViewer;
    protected _clipViewer!: ClipPathViewer;

    public constructor(id: string, id2: string, id3: string, renderer: ImageRenderer){
        const parentId = 'webgl-canvas';
        this._controls = [new Controls(id, 0.4, parentId), new Controls(id2, 0.4, parentId), new Controls(id3)];
        this._sampler = new Sampler(renderer);
    }

    public setup(){
        this.handleMouseAndKeyInput();

        const criteria = this._controls[1].createSelectListInput(
            'Criteria', Array.from(this._criterias.keys()));
        criteria.addEventListener('change', (event) => {
            this._criteria = this._criterias.get((event.target as HTMLInputElement).value) as Criteria
        });

        const tree = this._controls[1].createSelectListInput(
            'Tree', Array.from(this._trees.keys()));
        tree.addEventListener('change', (event) => {
            this._tree = this._trees.get((event.target as HTMLInputElement).value) as DataStructure;
        });

        const from = this._controls[1].createNumberInput(
            'from', '', 0, '', 0, 255, 255
        );
        from.addEventListener('change', (event) => {
            this._from = (event.target as HTMLInputElement).valueAsNumber;
        });

        const to = this._controls[1].createNumberInput(
            'to', '', 0, '', 0, 255, 1
        );
        to.addEventListener('change', (event) => {
            this._to = (event.target as HTMLInputElement).valueAsNumber;
        });

        const color = this._controls[1].createSelectListInput(
            'Color', Array.from(this._colorModes.keys()));
        color.addEventListener('change', (event) => {
            this._color = this._colorModes.get((event.target as HTMLInputElement).value) as ColorMode;
        });

        const maxLevel = this._controls[1].createSliderInput(
            'max Level', '', 0, '', 0, 40, 1, 'range');

        maxLevel.addEventListener('change', (event) => {
            this._maxLevel = (event.target as HTMLInputElement).valueAsNumber;
        });

        const minArea = this._controls[1].createSliderInput(
            'min Area', '', 1, '', 0, 2500, 1, 'range');
        minArea.addEventListener('change', (event) => {
            this._minArea = (event.target as HTMLInputElement).valueAsNumber;
        });

        const addButton = this._controls[2].createActionButton('Add', 'btn-warning');
        addButton.addEventListener('click', () => {
            this.add();
        });

        Config.registerList([
            {name: 'criteria', element: criteria},
            {name: 'tree', element: tree},
            {name: 'from', element: from},
            {name: 'to', element: to},
            {name: 'color', element: color},
            {name: 'maxLevel', element: maxLevel},
            {name: 'minArea', element: minArea}
        ]);
    }

    public handleMouseAndKeyInput(){
        let clipCanvas = document.getElementById('clip-canvas') as HTMLCanvasElement;

        clipCanvas.addEventListener('mouseup', (event: MouseEvent) => {
            this._clipViewer.mouseUp(new Point(event.offsetX, event.offsetY));
        });
        
        clipCanvas.addEventListener('mousedown', (event: MouseEvent) => {
            this._clipViewer.mouseDown(new Point(event.offsetX, event.offsetY));
        });

        clipCanvas.addEventListener('mousemove', (event: MouseEvent) => {
            this._clipViewer.mouseMove(new Point(event.offsetX, event.offsetY));
        })

        window.addEventListener('keydown', (event: KeyboardEvent) => {
            this._clipViewer.handleKeys(event);
        });
    }

    public add(){
        Config.updateValues([
            ['criteria', this._criteria],
            ['tree', this._tree],
            ['from', this._from],
            ['to', this._to],
            ['color', this._color],
            ['maxLevel', this._maxLevel],
            ['minArea', this._minArea],
        ]);
        let layer = new Layer(this._tree, this._criteria, this._from, this._to, this._maxLevel, this._minArea, this._color);
        this.createLayer(layer, true, Config.layers.size == 0);
    }

    public applySettings(){
        setProgress(0);
        return new Promise((resolve) => {
            this._inputControls.apply().then(() => {
                setTimeout(() => {
                    this._importanceControls.apply();
                    setProgress(0.2);
                    this._seedingControls.apply().then(() => {
                        Config.setApplyIgnore('seeding', true);
                        Config.setApplyIgnore('importance', true);
                        setProgress(0.6);
                        this._sampler.generateSampleData().then(() => {
                            if(Config.needsRefresh) Config.needsRefresh = false;
                            setProgress(1);
                            setProgress(0);
                            resolve('applied');
                        });
                    });
                }, 2000);
            });
        });
    }

    public finalizeLayer(layer: Layer, addToConfig = true){
        const id = uuid();
        console.log('finalize')
        const row = this._controls[0].createRow3Cols(id, 'col-8', 'col-2', 'col-2', 'pr-0', 'pr-0 pl-0', 'pl-0');
        const showButton = this._controls[0].createActionButton(layer.toString(), 'btn-secondary', ['mb-1', 'tlbl'], undefined, undefined, id + '-col1');

        const clipButton = this._controls[0].createActionButton('\uf5ee', 'btn-info', ['mb-1', 'fas', 'fa-input', 'not-round'], undefined, undefined, id + '-col2');
        const removeButton = this._controls[0].createActionButton('\uf2ed', 'btn-danger', ['mb-1', 'fas', 'fa-input', 'trbr'], '', undefined, id + '-col3');

        showButton.addEventListener('click', () => {
            this._layerViewer.showLayer(layer);
        });

        clipButton.addEventListener('click', () => {
            showButton.click();
            this._clipViewer.activateLayer(layer);
        });

        removeButton.addEventListener('click', () => {
            Config.removeLayer(layer);
        });

        this._clipViewer.activateLayer(layer);
        const scaling = this._clipViewer.getScaling();
        layer.scaleX = scaling[0];
        layer.scaleY = scaling[1];

        if(Config.needsRefresh){
            this._sampler.generateSampleData().then(() => {
                Config.needsRefresh = false;
                layer.points = this._sampler.samplePoints;
                Config.addLayer(layer, row, showButton, clipButton, removeButton, addToConfig);
            });
        }else{
            layer.points = this._sampler.samplePoints;
            Config.addLayer(layer, row, showButton, clipButton, removeButton, addToConfig);
        }
    }

    public createLayer(layer: Layer, addToConfig = true, apply = true){
        console.log('create');
        if(apply)
            this.applySettings()
            .then((res) => {
                this.finalizeLayer(layer, addToConfig)
            });
        else
            this.finalizeLayer(layer, addToConfig);
    }

    public refreshExistingLayers(){
        if(Config.layers.size == 0) return;
        this._sampler.generateSampleData();
        Config.layers.forEach((item: [number, HTMLElement, HTMLButtonElement, HTMLButtonElement, HTMLButtonElement], key: Layer) => {
            key.points = this._sampler.samplePoints;
        });
        Config.needsRefresh = false;
    }

    public activateLayer(layer: Layer, show = true){
        this._clipViewer.activateLayer(layer, show)
    }

    public activateScope(){
        this._clipViewer.acitvate();
    }

    public set layerViewer(viewer: LayerViewer){
        this._layerViewer = viewer;
    }

    public set clipPathViewer(viewer: ClipPathViewer){
        this._clipViewer = viewer;
    }

    public set inputControls(controls: InputControls){
        this._inputControls = controls;
    }

    public set importanceControls(controls: ImportanceMapControls){
        this._importanceControls = controls;
    }

    public set seedingControls(controls: SeedingControls){
        this._seedingControls = controls;
    }

    public set renderer(renderer: ImageRenderer){
        this._renderer = renderer;
    }
}