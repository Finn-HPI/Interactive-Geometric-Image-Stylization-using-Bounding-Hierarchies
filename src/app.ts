import { Canvas } from "webgl-operate";
import { GlTFBuilder } from "./building/builder/glTFBuilder";
import { SVGBuilder } from "./building/builder/svgBuilder";
import { ClipPathViewer } from "./building/layer/clipPathViewer";
import { LayerViewer } from "./building/layer/layerViewer";
import { Config } from "./config/config";
import { ArcticControls } from "./controls/arcticControls";
import { ColoringBookControls } from "./controls/coloringBookControls";
import { GeneralControls } from "./controls/generalControls";
import { GeometryControls } from "./controls/geometryControls";
import { GlobalControls } from "./controls/globalControls";
import { ImportanceMapControls } from "./controls/importanceMapControls";
import { InputControls } from "./controls/inputControls";
import { LayerControls } from "./controls/layerControls";
import { SeedingControls } from "./controls/seedingControls";
import { VectorControls } from "./controls/vectorControls";
import { NoiseViewer } from "./noise/noiseViewer";
import { ImageRenderer } from "./webgl/renderer";

export class Application {
    
    protected _noiseViewer!: NoiseViewer;
    protected _layerViewer!: LayerViewer;
    protected _clipPathViewer!: ClipPathViewer;
    protected _renderer!: ImageRenderer;


    public startApplication() {
    
        const canvas = new Canvas('webgl-canvas', {preserveDrawingBuffer: true});
        this._renderer = new ImageRenderer;
        canvas.renderer = this._renderer;

        Config.setDefault();

        let svgBuilder = new SVGBuilder();
        let glTFBuilder = new GlTFBuilder();

        this._noiseViewer = new NoiseViewer(this._renderer.canvasSize);
        this._clipPathViewer = new ClipPathViewer(this._renderer.canvasSize);
        this._layerViewer = new LayerViewer(this._renderer.canvasSize);

        const generalControls = new GeneralControls('open-button', 'import-button', 'export-button');
        generalControls.setup();

        const inputControls = new InputControls('input-container', 'input-apply-container');
        inputControls.renderer = this._renderer;
        inputControls.setup();


        const layerControls = new LayerControls(
            'layer-container', 
            'layer-new-container',
            'layer-add-container',
            this._renderer
        );
        layerControls.layerViewer = this._layerViewer;
        layerControls.clipPathViewer = this._clipPathViewer;
        layerControls.renderer = this._renderer;
        layerControls.setup();
        Config.layerControls = layerControls;

        const importanceMapControls = new ImportanceMapControls(
            'global-importance-container', 
            'local-importance-container',
            'importance-apply-container'
        );
        importanceMapControls.renderer = this._renderer;
        importanceMapControls.layerControls = layerControls;
        importanceMapControls.setup();
    
        const seedingControls = new SeedingControls(
            'sampling-container', 
            'color-container',
            'seed-container',
            'seeding-apply-container',
        );
        seedingControls.renderer = this._renderer;
        seedingControls.noiseViewer = this._noiseViewer;
        seedingControls.layerControls = layerControls;
        seedingControls.setup();
    
        const geometryControls = new GeometryControls('gltf-container', 'gltf-gen-container', 'gltf-import-container');
        geometryControls.glTFBuilder = glTFBuilder;
        geometryControls.renderer = this._renderer;
        geometryControls.svgBuilder = svgBuilder;
        geometryControls.setup();
    
        const vectorControls = new VectorControls(
            'svg-gen-container', 
            'appearance-container', 
            'appearance-apply-container'
        );
        vectorControls.renderer = this._renderer;
        vectorControls.svgBuilder = svgBuilder;
        vectorControls.setup();

        const coloringBookControls = new ColoringBookControls('colBook-container');
        coloringBookControls.svgBuilder = svgBuilder;
        coloringBookControls.setup();

        inputControls.layerControls = layerControls;
        
        layerControls.inputControls = inputControls;
        layerControls.importanceControls = importanceMapControls;
        layerControls.seedingControls = seedingControls;

        const globalControls = new GlobalControls('global-container');
        globalControls.setup();

        const arcitcControls = new ArcticControls('svg2img-container', 'effect-container', 'arctic-apply-container');
        arcitcControls.setup();
        
        Config.applyConfig();
    }
}


   