import { GlTFBuilder } from "../building/builder/glTFBuilder";
import { SVGBuilder } from "../building/builder/svgBuilder";
import { Config } from "../config/config";
import { Controls } from "../utils/htmlUtil";
import { ImageRenderer } from "../webgl/renderer";

export enum ExportMode {
    COLOR, TEXTURE
}

export class GeometryControls {

    protected _controls!: [Controls, Controls, Controls];
    protected _renderer!: ImageRenderer;
    
    protected _glTFBuilder!: GlTFBuilder;
    protected _svgBuilder!: SVGBuilder;

    protected _exportModes: Map<string, ExportMode> = new Map<string, ExportMode>([
        ['Color', ExportMode.COLOR],
        ['Texture', ExportMode.TEXTURE]
    ]);

    protected _exportMode!: ExportMode;

    public constructor(id: string, id2: string, id3: string){
        this._controls = [new Controls(id), new Controls(id2), new Controls(id3)];
    }

    public setup(){
        const buildMode = this._controls[0].createSelectListInput(
            'Export Mode', Array.from(this._exportModes.keys()));
            buildMode.addEventListener('change', (event) => {
            this._exportMode = this._exportModes.get((event.target as HTMLInputElement).value) as ExportMode;
            Config.updateValue('exportMode', this._exportMode);
        });

        const buildButton = this._controls[1].createActionButton('Build', 'btn-secondary', ['mb-1']);
        buildButton.addEventListener('click', () => {
            this.build();
        })

        const exportButton = this._controls[1].createActionButton('Export', 'btn-warning');
        exportButton.addEventListener('click', () => {
            this.export();
        });

        const importButton = this._controls[2].createFileInput('Import');

        importButton.addEventListener('click', (event) => {
            this.import(event);
        })

        Config.register('exportMode', buildMode);
    }

    public import(event: Event){
        let target = (event.target as HTMLInputElement);
        if(!target || !target.files) 
            return;
        const file = target.files[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            this.changeGltfSource(reader.result as string);
            console.log(reader.result as string);
        };
        reader.readAsDataURL(file);
    }

    public build(){
        let canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
        this._glTFBuilder.fromColorGroups(this._svgBuilder.colorGroups, canvas.width, canvas.height, this._renderer.getEncodedRGBImage());
        this.changeGltfSource(this._glTFBuilder.encodedUri);
    }

    public export(){
        let url = this._glTFBuilder.encodedUri;
        if(url.length === 0)
            return;

         let link = document.createElement("a");
        link.download = 'export.gltf';
        link.href = url;
        link.click();
    }

    private changeGltfSource(uri: string){
        (document.getElementById('gltf-canvas') as HTMLElement).setAttribute('src', uri);
    }

    public set glTFBuilder(builder: GlTFBuilder){
        this._glTFBuilder = builder;
    }

    public set svgBuilder(builder: SVGBuilder){
        this._svgBuilder = builder;
    }

    public set renderer(renderer: ImageRenderer){
        this._renderer = renderer;
    }
}