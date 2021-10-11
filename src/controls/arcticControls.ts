import { Config } from "../config/config";
import { Controls } from "../utils/htmlUtil";
import {svg2png} from 'svg-png-converter';
import WebProcessor, { LogSeverityFlags } from "@digitalmasterpieces/web-processor";
import StylesClient from "@digitalmasterpieces/styles-client";
import { getEffects } from "../effects/effects";
export class ArcticControls{

    protected _controls!: [Controls, Controls, Controls];
    protected _currentEffect!: string;

    protected _effects!: any;

    protected _registry!: any;
    protected _processor!: WebProcessor;
    protected _client!: StylesClient;

    protected _file!: File;
    protected _fileUrl!: string;

    protected _inputCanvas!: HTMLCanvasElement;
    protected _outputCanvas!: HTMLCanvasElement;

    protected _effectList: Array<string> = [
        'Toon',
        'Toon - Portratit',
        'Toon B/W',
        'Oilpaint Toon B/W',
        'Oilpaint Comic B/W Fall',
        'Color LUT',
        '20\'s Cam',
        'Grayscale',
        'Watercolor'
    ];

    public constructor(id: string, id2: string, id3: string){
        this._controls = [new Controls(id), new Controls(id2), new Controls(id3)];
        this._currentEffect = this._effectList.values().next().value;
        this._effects = getEffects();
        this.register();
        this.initProcessorAndClient();
    }

    public setup(){
        const svg2imgButton = this._controls[0].createActionButton('Convert SVG To Image', 'btn-primary', ['mb-1', 'disabled']);
        svg2imgButton.addEventListener('click', () => {
            // this.convertSvg2Img();
        });

        const showButton = this._controls[0].createActionButton('Show Image', 'btn-secondary', ['disabled']);
        showButton.addEventListener('click', () => {
            // this.showImage();
        });

        const effectControl = this._controls[1].createSelectListInput(
            'Effect', Array.from(this._effectList));
        
        effectControl.addEventListener('change', (event) => {
            const value = (event.target as HTMLInputElement).value;
            this._currentEffect = value;
        });

        const applyButton = this._controls[2].createActionButton('Apply', 'btn-warning', ['disabled']);
        applyButton.addEventListener('click', () => {
            // this.apply();
        });

        this._outputCanvas = document.getElementById('arctic-out-canvas') as HTMLCanvasElement;
        this._inputCanvas = document.getElementById('arctic-in-canvas') as HTMLCanvasElement;
    }

    public async convertSvg2Img(){
        let svgString = Config.lastSvg;
        let outputBuffer = await svg2png({ 
            input: svgString, 
            encoding: 'buffer', 
            format: 'jpeg',
        });
        this._file = new File([outputBuffer as BlobPart], 'svg2img.png');
        this._fileUrl = URL.createObjectURL(this._file);
        console.log(outputBuffer, this._fileUrl, this._file);
        this.showImage();
    }

    private register(){
        this._registry = {
            getAssetBundle: async (id: any) => {
                const name = id.split("/")[3];
                const asset = await fetch(`/${name}.zip`);
                const assetBlob = await asset.blob();
                return assetBlob;
            },
            getSchema: async () => {
                const schema = await fetch("/schema.zip");
                const schemaBlob = await schema.blob();
                return schemaBlob;
            },
        };
    }
    

    private async initProcessorAndClient(){

        //TODO: get Webworker running on webpack 4

        // this._processor = new WebProcessor({
        //     canvas: this._outputCanvas,
        //     corePath: '/arctic-core/index.js',
        //     registry: this._registry,
        //     logSeverity: LogSeverityFlags.ERROR
        // });
        this._client = new StylesClient({
            apiKey: {
                id: "6bbfae86-7f9f-483a-8da1-ccc539f17612",
                key:
                    "1Qniy0sJjczoOv4Z~3tfM64fh3-0uAA.4aOi5hpOSmESo~20Pr-Ify.FCn-UzpDc2O7jSgPMaXHcrtH7rZnCJeoTBjlt85V-l~x4uYn4Bwhi9ytA08_v4HP6s2SixaRGeHuEh1cStNrsHeLBSFDL1fjmZ2kVbEiRvHxyN0_oxfaNQdn42HXpdP7BZ1zduKFfdaSV_8gc0k4Pl7zPKWT_91kSVh2pkG1EWr4RC9I7haMUyRndG_ED9.iLVr-B4sba"
            },
            // processor: this._processor,
            // devMode: true
        });

        // await this._processor.load();
        // console.log('artic processor loaded');
    }

    public showImage(){
        if(!this._fileUrl) return;
        this._inputCanvas.style.display = 'block';
        this._outputCanvas.style.display = 'none';

        const inputCtx = this._inputCanvas.getContext('bitmaprenderer') as ImageBitmapRenderingContext;
        let inputElement = new Image();

        inputElement.onload = async () => {
            const inputBitmap = await createImageBitmap(inputElement);
            inputCtx.transferFromImageBitmap(inputBitmap);
        };

        inputElement.src = this._fileUrl;

    }

    public apply(){
        if(!this._file) return;
        this._inputCanvas.style.display = 'none';
        this._outputCanvas.style.display = 'block';

        const pipeline = this.getPipeline();
        this._processor.process(this._file, pipeline);
    }

    private getPipeline(){
        return this._effects[this._currentEffect];
    }
}