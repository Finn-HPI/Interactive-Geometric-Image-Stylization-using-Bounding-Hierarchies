import { Config } from "../config/config";
import { Controls } from "../utils/htmlUtil";
import { ImageRenderer, Mode } from "../webgl/renderer";

export class InputControls {

    protected _controls!: [Controls, Controls];
    protected _renderer!: ImageRenderer;

    protected _image!: string;
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
        this._layerMode = this._layers.entries().next().value;

        const imageControl = this._controls[0].createSelectListInput(
            'Image', Array.from(this._images.keys()));
        
        imageControl.addEventListener('change', (event) => {
            this._image = this._images.get((event.target as HTMLInputElement).value) as string;
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
        let imageChanged = Config.updateValue('image', this._image);
        if(imageChanged)
            this._renderer.loadImages(this._image);
        
        let layerChanged = Config.updateValue('layer', this._layerMode);
        if(layerChanged){
            this._renderer.layerMode = this._layerMode;
            this._renderer.mode = Mode.NORMAL;
            this._renderer.updateChange();
        }
    }
}