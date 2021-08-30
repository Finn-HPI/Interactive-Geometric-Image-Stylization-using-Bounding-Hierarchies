import { Color } from "paper/dist/paper-core";
import { Config } from "../config/config";
import { BrushTool } from "../lod/brushTool";
import { Controls } from "../utils/htmlUtil";
import { ImageRenderer } from "../webgl/renderer";
import { LayerControls } from "./layerControls";

export class ImportanceMapControls {

    protected _controls!: [Controls, Controls, Controls];
    protected _renderer!: ImageRenderer;
    protected _brush!: BrushTool;

    protected _layerControls!: LayerControls;

    protected _settings!: Map<string, [number, number, HTMLInputElement, HTMLInputElement]>;

    public constructor(id: string, id2: string, id3: string){
        this._controls = [new Controls(id, 0.5, 'webgl-canvas'), new Controls(id2), new Controls(id3)];
        this._settings = new Map<string, [number, number, HTMLInputElement, HTMLInputElement]>();
    }

    public setup(){
        this.fillColumns();
        this.fillLocal();
        this.setupBrush();
        
        const applyButton = this._controls[2].createActionButton('Apply', 'btn-warning');
        applyButton.addEventListener('click', () => {
            this.apply();
        });
    }

    private setupBrush(){
        this._brush = new BrushTool('mask-canvas');
        const svg = document.getElementById('mask-canvas') as HTMLCanvasElement;
        svg.addEventListener('mousedown', (event) => {
            this._brush.mouseDown(event);
        });
        svg.addEventListener('mouseup', (event) => {
            this._brush.endStroke(event);
        });
        svg.addEventListener('mouseout', (event) => {
            this._brush.endStroke(event);
        });
        svg.addEventListener('mouseenter', (event) => {
            this._brush.mouseEnter(event);
        });
        svg.addEventListener('mousemove', (event) => {
            this._brush.mouseMove(event);
        });
    }

    private fillLocal(){
        this._controls[1].createRow2Cols('brushRow1', 'col-4', 'col-8');
        this._controls[1].createRow2Cols('brushRow2', 'col-4', 'col-8');

        const intensitySlider = this._controls[1].createSliderInput('Intensity', '', 0, '', 0, 1, 0.0005, undefined, 'brushRow1-col2');
        intensitySlider.addEventListener('change', (event) => {
            this._brush.intensity = (event.target as HTMLInputElement).valueAsNumber;
        });

        const brushSizeSlider = this._controls[1].createSliderInput('Brush Size', '', 1, '', 1, 100, 1, undefined, 'brushRow2-col2');
        brushSizeSlider.addEventListener('change', (event) => {
            this._brush.strokeSize = (event.target as HTMLInputElement).valueAsNumber;
        });

        const positiveBrush = this._controls[1].createActionButton('\uf55d', 'btn-light', ['fas', 'fa-input', 'mt-2', 'light-border'], '', undefined, 'brushRow1-col1');
        positiveBrush.addEventListener('click', () => {
            this._brush.color = new Color(1);
        });

        const negativeBrush = this._controls[1].createActionButton('\uf55d', 'btn-dark', ['fas', 'fa-input', 'mt-2'], '', undefined, 'brushRow1-col1');
        negativeBrush.addEventListener('click', () => {
            this._brush.color = new Color(0);
        });

        const clearButton = this._controls[1].createActionButton('\uf1f8', 'btn-primary', ['fas', 'fa-input', 'mt-2'], '', undefined, 'brushRow2-col1');
        clearButton.addEventListener('click', () => {
            this._brush.clear();
        });

        Config.registerList([
            {name: 'intensity', element: intensitySlider},
            {name: 'brushSize', element: brushSizeSlider}
        ]);
    }

    private fillColumns(){
        this._controls[0].createRow2Cols('depthRow');
        const depthSlider = this._controls[0].createSliderInput(
            'Depth', '', 0, '', -1, 1, 0.05, 'depthSlider', 'depthRow-col1');
        depthSlider.addEventListener('change', (event) => {
            this.updateValue('depth', Number((event.target as HTMLInputElement).value));
        });

        this._controls[0].createRow2Cols('mattingRow');
        const mattingSlider = this._controls[0].createSliderInput(
            'Matting', '', 0, '', -1, 1, 0.05, 'mattingSlider', 'mattingRow-col1');
        mattingSlider.addEventListener('change', (event) => {
            this.updateValue('matting', Number((event.target as HTMLInputElement).value));
        });

        this._controls[0].createRow2Cols('saliencyaRow');
        const saliencyASlider = this._controls[0].createSliderInput(
            'SaliencyA', '', 0, '', -1, 1, 0.05, 'saliencyaSlider', 'saliencyaRow-col1');
        saliencyASlider.addEventListener('change', (event) => {
            this.updateValue('saliencya', Number((event.target as HTMLInputElement).value));
        });

        this._controls[0].createRow2Cols('saliencyoRow');
        const saliencyOSlider = this._controls[0].createSliderInput(
            'SaliencyO', '', 0, '', -1, 1, 0.05, 'saliencyoSlider', 'saliencyoRow-col1');
        saliencyOSlider.addEventListener('change', (event) => {
            this.updateValue('saliencyo', Number((event.target as HTMLInputElement).value));
        });

        this._controls[0].createRow2Cols('normalRow');
        const normalSlider = this._controls[0].createSliderInput(
            'Normal (Intensity)', '', 0, '', -1, 1, 0.05, 'normalSlider', 'normalRow-col1');
        normalSlider.addEventListener('change', (event) => {
            this.updateValue('normal', Number((event.target as HTMLInputElement).value));
        });

        this._controls[0].createRow2Cols('normalXRow');
        const normalXSlider = this._controls[0].createSliderInput(
            'Normal (X)', '', 0, '', -1, 1, 0.05, 'normalXSlider', 'normalXRow-col1');
        normalXSlider.addEventListener('change', (event) => {
            this.updateValue('normalx', Number((event.target as HTMLInputElement).value));
        });

        this._controls[0].createRow2Cols('normalYRow');
        const normalYSlider = this._controls[0].createSliderInput(
            'Normal (Y)', '', 0, '', -1, 1, 0.05, 'normalYSlider', 'normalYRow-col1');
        normalYSlider.addEventListener('change', (event) => {
            this.updateValue('normaly', Number((event.target as HTMLInputElement).value));
        });

        this._controls[0].createRow2Cols('normalZRow');
        const normalZSlider = this._controls[0].createSliderInput(
            'Normal (Z)', '', 0, '', -1, 1, 0.05, 'normalZSlider', 'normalZRow-col1');
        normalZSlider.addEventListener('change', (event) => {
            this.updateValue('normalz', Number((event.target as HTMLInputElement).value));
        });

        const depth = this._controls[0].createNumberInput(
            '', '', 0, '', -1, 1, 0.05, undefined, 'depthRow-col2', 'mt-3'
        );
        depth.addEventListener('change', (event) => {
            this.updateValue('depth', Number((event.target as HTMLInputElement).value));
        });

        const matting = this._controls[0].createNumberInput(
            '', '', 0, '', -1, 1, 0.05, undefined, 'mattingRow-col2', 'mt-3'
        );
        matting.addEventListener('change', (event) => {
            this.updateValue('matting', Number((event.target as HTMLInputElement).value));
        });

        const saliencya = this._controls[1].createNumberInput(
            '', '', 0, '', -1, 1, 0.05, undefined, 'saliencyaRow-col2', 'mt-3'
        );
        saliencya.addEventListener('change', (event) => {
            this.updateValue('saliencya', Number((event.target as HTMLInputElement).value));
        });

        const saliencyo = this._controls[1].createNumberInput(
            '', '', 0, '', -1, 1, 0.05, undefined, 'saliencyoRow-col2', 'mt-3'
        );
        saliencyo.addEventListener('change', (event) => {
            this.updateValue('saliencyo', Number((event.target as HTMLInputElement).value));
        });

        const normal = this._controls[1].createNumberInput(
            '', '', 0, '', -1, 1, 0.05, undefined, 'normalRow-col2', 'mt-3'
        );
        normal.addEventListener('change', (event) => {
            this.updateValue('normal', Number((event.target as HTMLInputElement).value));
        });

        const normalx = this._controls[1].createNumberInput(
            '', '', 0, '', -1, 1, 0.05, undefined, 'normalXRow-col2', 'mt-3'
        );
        normalx.addEventListener('change', (event) => {
            this.updateValue('normalx', Number((event.target as HTMLInputElement).value));
        });

        const normaly = this._controls[1].createNumberInput(
            '', '', 0, '', -1, 1, 0.05, undefined, 'normalYRow-col2', 'mt-3'
        );
        normaly.addEventListener('change', (event) => {
            this.updateValue('normaly', Number((event.target as HTMLInputElement).value));
        });

        const normalz = this._controls[1].createNumberInput(
            '', '', 0, '', -1, 1, 0.05, undefined, 'normalZRow-col2', 'mt-3'
        );
        normalz.addEventListener('change', (event) => {
            this.updateValue('normalz', Number((event.target as HTMLInputElement).value));
        });

        this._settings.set('depth', [0, 0, depthSlider, depth]);
        this._settings.set('matting', [1, 0, mattingSlider, matting]);
        this._settings.set('saliencya', [2, 0, saliencyASlider, saliencya]);
        this._settings.set('saliencyo', [3, 0, saliencyOSlider, saliencyo]);
        this._settings.set('normal', [4, 0, normalSlider, normal]);
        this._settings.set('normalx', [5, 0, normalXSlider, normalx]);
        this._settings.set('normaly', [6, 0, normalYSlider, normaly]);
        this._settings.set('normalz', [7, 0, normalZSlider, normalz]);

        Config.registerList([
            {name: 'depth', element: depth},
            {name: 'matting', element: matting},
            {name: 'saliencya', element: saliencya},
            {name: 'saliencyo', element: saliencyo},
            {name: 'normal', element: normal},
            {name: 'normalx', element: normalx},
            {name: 'normaly', element: normaly},
            {name: 'normalz', element: normalz},
        ]);
    }

    public set renderer(renderer: ImageRenderer){
        this._renderer = renderer;
    }

    public updateValue(option: string, value: number){
        let inputs = this._settings.get(option);
        if(!inputs) return;

        let evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);

        if(inputs[2].value != String(value))
            inputs[2].value = String(value);

        if(inputs[3].value != String(value))
            inputs[3].value = String(value);
        
        this._settings.set(option, [inputs[0], value, inputs[2], inputs[3]]);
    }

    private getCurrentValueItem(name: string): [string, number]{
        let element = this._settings.get(name);
        if(element)
            return [name, element[1]];
        return [name, 0];
    }

    public apply(){
        let ignore = Config.applyIgnore('importance');

        let changed = Config.updateValues([
            this.getCurrentValueItem('depth'),
            this.getCurrentValueItem('matting'),
            this.getCurrentValueItem('saliencya'),
            this.getCurrentValueItem('saliencyo'),
            this.getCurrentValueItem('normal'),
            this.getCurrentValueItem('normalx'),
            this.getCurrentValueItem('normaly'),
            this.getCurrentValueItem('normalz')
        ]) || ignore;
        console.log(changed);

        if(changed){
            this._settings.forEach((value: [number, number, HTMLInputElement, HTMLInputElement]) => {
                this._renderer.updateConfiguration(value[0], value[1]);
            });
            
            Config.setApplyIgnore('importance');
            this._layerControls.refreshExistingLayers();

            this._renderer.showLodMask();
        }
    }

    public set layerControls(controls: LayerControls){
        this._layerControls = controls;
    }
}