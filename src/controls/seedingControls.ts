import { Config } from "../config/config";
import { BlueNoise } from "../noise/bluenoise";
import { NoiseViewer } from "../noise/noiseViewer";
import { Controls } from "../utils/htmlUtil";
import { ImageRenderer, Mode } from "../webgl/renderer";
import { v4 as uuid } from 'uuid';
import { LayerControls } from "./layerControls";

export enum NoiseMode{
    BLUE_NOISE, SIMPLE
}

export class SeedingControls {

    protected _controls!: [Controls, Controls, Controls, Controls];
    protected _renderer!: ImageRenderer;
    protected _noiseViewer!: NoiseViewer;
    protected _layerControls!: LayerControls;

    protected _seedField!: HTMLInputElement;

    protected _sampleModes: Map<string, NoiseMode> = new Map<string, NoiseMode>([
        ['BlueNoise', NoiseMode.BLUE_NOISE],
        ['Simple', NoiseMode.SIMPLE]
    ]);

    protected _noiseGenerator!: BlueNoise;
    protected _samplingMode!: NoiseMode;
    protected _minDist!: number;
    protected _maxTries!: number;
    protected _probability!: number;
    protected _maxColorCount!: number;
    protected _seed!: string;

    protected _points!: Array<{x: number, y: number}>

    public constructor(id: string, id2: string, id3: string, id4: string){
        this._controls = [new Controls(id), new Controls(id2), new Controls(id3), new Controls(id4)];
        this._samplingMode = this._sampleModes.values().next().value;
        this._minDist = 0;
        this._maxTries = 0;
        this._probability = 0;
        this._maxColorCount = 2;
        this._seed = 'defaul-seed';
    }

    public setup(){

        const sampleMode = this._controls[0].createSelectListInput(
            'Sampling', Array.from(this._sampleModes.keys()));
        sampleMode.addEventListener('change', (event) => {
            this._samplingMode = this._sampleModes.get((event.target as HTMLInputElement).value) as number;
        });

        const minDist = this._controls[0].createSliderInput(
            'minDist', '', 0, '', 0, 200, 1, 'minDistSlider');
        minDist.addEventListener('change', (event) => {
            this._minDist = (event.target as HTMLInputElement).valueAsNumber;
        });

        const maxTries = this._controls[0].createSliderInput(
            'maxTries', '', 0, '', 0, 200, 1, 'maxTriesSlider');
        maxTries.addEventListener('change', (event) => {
            this._maxTries = (event.target as HTMLInputElement).valueAsNumber;
        });

        const probability = this._controls[0].createSliderInput(
            'probability', '', 0, '', 0, 1, 0.005, 'probabilitySlider');
        probability.addEventListener('change', (event) => {
            this._probability = (event.target as HTMLInputElement).valueAsNumber;
        });

        const maxColorCount = this._controls[1].createSliderInput(
            'max color count', '', 2, '', 2, 256, 1, 'max colorCount');
        maxColorCount.addEventListener('change', (event) => {
            this._maxColorCount = (event.target as HTMLInputElement).valueAsNumber;
        });

        this._controls[2].createRow2Cols('seedRow', 'col-8', 'col-4', 'pr-0', 'pl-0');
        this._seedField = this._controls[2].createTextInput(undefined, '', ['tlbl-rounded'], '', undefined, 'seedRow-col1');
        this._seedField.addEventListener('change', (event) => {
            this._seed = (event.target as HTMLInputElement).value;
        });

        const renewButton = this._controls[2].createActionButton('\uf2f1', 'btn-light', ['fas', 'fa-input', 'light-border', 'trbr-rounded'], '', undefined, 'seedRow-col2');
        renewButton.addEventListener('click', (event) => {
            this.renew();
        });

        const applyButton = this._controls[3].createActionButton('Apply', 'btn-warning');
        applyButton.addEventListener('click', () => {
            this.apply();
        });

        Config.registerList([
            {name: 'samplingMode', element: sampleMode},
            {name: 'minDist', element: minDist},
            {name: 'maxTries', element: maxTries},
            {name: 'probability', element: probability},
            {name: 'maxColorCount', element: maxColorCount},
            {name: 'seed', element: this._seedField}
        ]);
    }

    public renew(){
        this._seed = uuid();
        this._seedField.value = this._seed;
    }

    public generateNoiseData(){
        let width = this._renderer.canvasSize[0];
        let height = this._renderer.canvasSize[1];

        let viewport = [0, 0, width, height];
        this._noiseGenerator = new BlueNoise(viewport, this._minDist, this._maxTries);
        this._points = this._noiseGenerator.allPoints();

        let noiseData = new Uint8Array(width * height * 4);
        this._points.forEach((each: {x: number, y: number}) => {
            const i = ((height - Math.floor(each.y)) * width + Math.floor(each.x)) * 4;
            noiseData[i] = 1;
            noiseData[i+1] = 1;
            noiseData[i+2] = 1;
            noiseData[i+3] = 1;
        });
        Config.noiseData = noiseData;
    }

    public updateSampling(){
        return new Promise((resolve) => {
            switch(this._samplingMode){
                case NoiseMode.SIMPLE:
                    (document.getElementById('point-canvas') as HTMLCanvasElement).style.display = 'none';
                    this._noiseViewer.clear();
                    this._renderer.mode = Mode.SAMPLE;
                    this._renderer.updateChange();
                    break;
                case NoiseMode.BLUE_NOISE:
                    (document.getElementById('point-canvas') as HTMLCanvasElement).style.display = 'block';
                    this.generateNoiseData();
                    this._noiseViewer.showSamplePoints(this._points);
                    break;
            }
            resolve('generated');
        });
    }

    public apply(){
        let ignore = Config.applyIgnore('seeding');
        return new Promise((resolve) => {
            let paletteChanged = Config.updateValue('maxColorCount', this._maxColorCount) || ignore;
            let samplingChanged = Config.updateValues([
                ['samplingMode', this._samplingMode],
                ['minDist', this._minDist],
                ['maxTries', this._maxTries],
                ['probability', this._probability],
                ['seed', this._seed]
            ]) || ignore;

            Config.setApplyIgnore('seeding');

            if(samplingChanged)
                this.updateSampling().then((res) => {resolve('finished')});

            if(samplingChanged || paletteChanged){
                this._layerControls.refreshExistingLayers();
            }

            if(!samplingChanged)
                resolve('finished');
        });
    }

    public set noiseViewer(viewer: NoiseViewer){
        this._noiseViewer = viewer;
    }

    public set renderer(renderer: ImageRenderer){
        this._renderer = renderer;
    }

    public set layerControls(controls: LayerControls){
        this._layerControls = controls;
    }
}