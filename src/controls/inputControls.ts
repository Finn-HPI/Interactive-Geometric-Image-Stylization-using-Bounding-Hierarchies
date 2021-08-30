import { Config } from "../config/config";
import { Controls } from "../utils/htmlUtil";
import { ImageRenderer, Mode } from "../webgl/renderer";
import { LayerControls } from "./layerControls";

export class InputControls {

    protected _controls!: [Controls, Controls];
    protected _renderer!: ImageRenderer;
    protected _layerControls!: LayerControls;

    protected _image!: string;
    protected _imageSelection!: number;
    protected _layerMode!: number;

    protected _images: Map<string, string> = new Map<string, string>([
        ['Portrait', 'portrait.png'],
        ['Portrait2', 'portrait2.png'],
        ['Portrait3', 'portrait3.png'],
        ['Architecture', 'architecture.png'],
        ['Architecture2', 'architecture2.png'],
        ['Cat', 'cat.png'],
        ['Group', 'group.png'],
        ['Group2', 'group2.png'],
        ['Indoor', 'indoor.png'],
        ['Indoor2', 'indoor2.png'],
        ['IPhone', 'iPhone.png'],
        ['Landscape', 'landscape.png'],
        ['Landscape2', 'landscape2.png'],
        ['Panorama', 'panorama.png']
    ]);
    protected _layers: Map<string, number> = new Map<string, number>([
        ['RGB', 0],
        ['Depth', 1],
        ['Matting', 2],
        ['Normal', 3],
        ['Saliency Attention', 4],
        ['Saliency Objectness', 5],
        ['Segmentation', 6],
    ]);

    public constructor(id: string, id2: string){
        this._controls = [new Controls(id), new Controls(id2)];
    }

    public setup(){

        this._image = this._images.values().next().value;
        this._imageSelection = 0;
        this._layerMode = this._layers.entries().next().value;

        const imageControl = this._controls[0].createSelectListInput(
            'Image', Array.from(this._images.keys()));
        
        imageControl.addEventListener('change', (event) => {
            this._image = this._images.get((event.target as HTMLInputElement).value) as string;
            this._imageSelection = imageControl.selectedIndex;
        });

        const layer = this._controls[0].createSelectListInput(
            'Layer', Array.from(this._layers.keys()));

        layer.addEventListener('change', (event) => {
            this._layerMode = Number(this._layers.get((event.target as HTMLInputElement).value));
        });

        const applyButton = this._controls[1].createActionButton('Apply', 'btn-warning');
        applyButton.addEventListener('click', () => {
            this.apply();
        });

        Config.registerList([
            {name: 'image', element: imageControl},
            {name: 'layer', element: layer}
        ]);
    }

    public set renderer(renderer: ImageRenderer){
        this._renderer = renderer;
    }

    public apply(){
        let ignore = Config.applyIgnore('input');

        let imageChanged = Config.updateValue('image', this._imageSelection) || ignore;
        let layerChanged = Config.updateValue('layer', this._layerMode) || ignore;
        
        Config.setApplyIgnore('input');
        let promise = new Promise((resolve) => {
            if(imageChanged){
                this._renderer.loadImages(this._image)
                .then((res) => {
                    if(layerChanged){
                        this._renderer.layerMode = this._layerMode;
                        this._renderer.mode = Mode.NORMAL;
                        this._renderer.updateChange();
                    }
                    this._layerControls.refreshExistingLayers();
                    resolve('loaded');
                });
            }else{
                if(layerChanged){
                    this._renderer.layerMode = this._layerMode;
                    this._renderer.mode = Mode.NORMAL;
                    this._renderer.updateChange();
                }
                resolve('loaded 2');
            }
        });

        return promise;
    }

    public set layerControls(controls: LayerControls){
        this._layerControls = controls;
    }
}