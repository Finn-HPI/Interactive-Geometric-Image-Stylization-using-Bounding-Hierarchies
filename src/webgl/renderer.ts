import Jimp from "jimp";
import { Context, DefaultFramebuffer, Framebuffer, Renderer, Texture2D } from "webgl-operate";
import { Config } from "../config/config";
import { NoiseMode } from "../controls/seedingControls";
import { setProgress } from "../global/progressbar";
import { ExportPass } from "./exportPass";
import { RenderPass, TextureType } from "./renderPass";

export enum Mode {
    NORMAL,
    NORMAL_EXPORT,
    LOD,
    LOD_EXPORT,
    SAMPLE,
    SAMPLE_EXPORT
}

export class ImageRenderer extends Renderer {

    protected _lastMode: Mode = Mode.NORMAL;

    protected _gl!: WebGL2RenderingContext;
    protected _context!: Context;

    protected _rawImage!: Jimp;
    protected _type!: TextureType;

    protected _exportPass!: ExportPass;
    protected _renderPass!: RenderPass;

    protected _outputFBO!: DefaultFramebuffer;
    protected _exportFBO!: Framebuffer;

    protected _exportTexture!: Texture2D;
    protected _imgResolutions!: Float32Array;
    protected _textures!: Uint8Array[];
    protected _loadedTextures!: number;

    protected _loaded: boolean = false;
    protected _layerMode!: number;

    protected _mode = Mode.NORMAL;
    protected _inputChanged!: boolean;

    private dumpPixelData(): Uint8Array{
        const w = this.canvasSize[0];
        const h = this.canvasSize[1];
        const out = new Uint8Array(w * h * 4);
        this._exportFBO.bind();
        this._gl.readPixels(
            0, 0, w, h, this._gl.RGBA, this._gl.UNSIGNED_BYTE, out
        );
        this._exportFBO.unbind();
        return out;
    }

    private loadTexture(path: string, type: TextureType): void {
        Jimp.read(path).then((img) => {
            this._rawImage = img;
            this._rawImage.flip(false, true);
            this.resizeTexture(type);
        });
    }
   
    private resizeTexture(type: TextureType): void {
        this._renderPass.initTexture(type);
        this._exportPass.initTexture(type);

        let img = new Jimp(this._rawImage);
        img.cover(this._canvasSize[0], this._canvasSize[1]);
        let onlyRGB = img.bitmap.data.filter((v, i) => i % 4 !== 3);

        this._textures[type] = new Uint8Array(onlyRGB.length);
        this._type = type;

        for(let i = 0; i < onlyRGB.length; i++)
            this._textures[type][i] = onlyRGB[i];

        this._imgResolutions[type * 2] = img.bitmap.width;
        this._imgResolutions[type * 2 + 1] = img.bitmap.height;
        
        this.imageLoaded();
    }

    private imageLoaded(){
        this._loadedTextures++;
        setProgress(this._loadedTextures / this._textures.length);
        if(this._loadedTextures >= this._textures.length)
            this.finalizeImageLoading();
    }

    private finalizeImageLoading(){
        this.updateChange();
        if(!this._loaded){
            this._loaded = true;
        }
        this._renderPass.layerMode = this._layerMode;
        setProgress(0);
    }

    public loadImages(file: string){
        
        this._loadedTextures = 0;
        this.loadTexture('img/depth/new/' + file, TextureType.Depth);
        this.loadTexture('img/input/' + file, TextureType.Input);
        this.loadTexture('img/matting/modnetcamera/' + file, TextureType.Matting);
        this.loadTexture('img/normal/' + file, TextureType.Normal);
        this.loadTexture('img/saliency/attention/' + file, TextureType.SaliencyA);
        this.loadTexture('img/saliency/objectness/' + file, TextureType.SaliencyO);
        this.loadTexture('img/segmentation/deeplab1/' + file, TextureType.Segmentation);

        this._mode = Mode.NORMAL;
    }

    protected onInitialize(context: Context): boolean {

        this._context = context;
        this._gl = context.gl;
        this._textures = new Array(7);
        this._imgResolutions = new Float32Array(7 * 2);

        let valid = true;
        this._outputFBO = new DefaultFramebuffer(context);
        valid &&= this._outputFBO.initialize();

        this._exportTexture = new Texture2D(this._context);
        valid &&= this._exportTexture.initialize(1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        
        this._exportFBO = new Framebuffer(this._context);
        valid &&= this._exportFBO.initialize([
            [this._gl.COLOR_ATTACHMENT0, this._exportTexture]
        ]);

        this._exportPass = new ExportPass(context);
        valid &&= this._exportPass.initialize();
        this._renderPass = new RenderPass(context);
        valid &&= this._renderPass.initialize();
        
        this._gl.pixelStorei(this._context.gl.UNPACK_ALIGNMENT, 1);
        return valid;
    }

    protected onUninitialize(): void {
        super.uninitialize();
        this._exportPass.uninitialize();
        this._renderPass.uninitialize();
        this._exportFBO.uninitialize();
        this._outputFBO.uninitialize();
    }

    public updateConfiguration(index: number, value: number){
        if(!this._loaded) return;
        this._exportPass.configuration(index, value);
        this._mode = Mode.LOD;
        this.updateChange();
    }

    public setLodMode(mode: number){
        this._mode = Mode.LOD;
        this._exportPass.lodMode = mode;
        this.updateChange();
    }

    public showLodMask(){
        this._mode = Mode.LOD;
        this.updateChange();
    }

    protected onUpdate(): boolean {
        return this._altered.any || this._inputChanged;
    }

    protected onPrepare(): void {
        if (this._rawImage !== undefined && (this._canvasSize[0] !== this._imgResolutions[this._type*2] || this._canvasSize[1] !== this._imgResolutions[this._type*2+1])) {
            this.resizeTexture(this._type);
            this._inputChanged = true;
        }
        if (this._inputChanged) {
            this._renderPass.updateImage(this._textures, this._imgResolutions);
            this._exportPass.updateImage(this._textures, this._imgResolutions);
            this._inputChanged = false;
        }
    }

    protected onFrame(): void {
        let fbo: Framebuffer;
        let pass: ExportPass | RenderPass;

        switch(this._mode){
            case Mode.NORMAL:
                fbo = this._outputFBO;
                pass = this._renderPass;
                break;
            case Mode.NORMAL_EXPORT:
                fbo = this._exportFBO;
                pass = this._renderPass;
                break;
            case Mode.LOD:
                fbo = this._outputFBO;
                pass = this._exportPass
                pass.active = pass.lod;
                break;
            case Mode.LOD_EXPORT:
                fbo = this._exportFBO;
                pass = this._exportPass;
                pass.lodMode = 0;
                pass.active = pass.lod;
                break;
            case Mode.SAMPLE:
                fbo = this._outputFBO;
                pass = this._exportPass;
                pass.active = pass.sample;
                break;
            case Mode.SAMPLE_EXPORT:
                fbo = this._exportFBO;
                pass = this._exportPass;
                pass.active = pass.sample;
                break;
        }
        this._lastMode = this._mode;
        this._gl.viewport(0, 0, fbo.width, fbo.height);
        pass.target = fbo;
        pass.frame();
    }

    public resizeExportTexture(){
        this._exportTexture.resize(this._canvasSize[0], this._canvasSize[1]);
    }

    public getLodData(){
        this._mode = Mode.LOD_EXPORT;
        this.onFrame();
        return this.dumpPixelData();
    }

    public getDepthData(){
        this._mode = Mode.NORMAL_EXPORT;
        this._renderPass.layerMode = 1;
        this.onFrame();
        return this.dumpPixelData();
    }

    public getMattingData(){
        this._mode = Mode.NORMAL_EXPORT;
        this._renderPass.layerMode = 2;
        this.onFrame();
        return this.dumpPixelData();
    }

    public getSaliencyAData(){
        this._mode = Mode.NORMAL_EXPORT;
        this._renderPass.layerMode = 4;
        this.onFrame();
        return this.dumpPixelData();
    }

    public getSaliencyOData(){
        this._mode = Mode.NORMAL_EXPORT;
        this._renderPass.layerMode = 5;
        this.onFrame();
        return this.dumpPixelData()
    }

    public getSegmentationData(){
        this._mode = Mode.NORMAL_EXPORT;
        this._renderPass.layerMode = 6;
        this.onFrame();
        return this.dumpPixelData();
    }

    public getRGBAData(){
        this._mode = Mode.NORMAL_EXPORT;
        this._renderPass.layerMode = 0;
        this.onFrame();
        return this.dumpPixelData();
    }

    public getSampleData(){
        let sampleData: Uint8Array;
        const sampleMode = Config.getValue('samplingMode');
        switch(sampleMode){
            case NoiseMode.SIMPLE:
                this._mode = Mode.SAMPLE_EXPORT;
                this.onFrame();
                sampleData = this.dumpPixelData();
                break;
            case NoiseMode.BLUE_NOISE:
                sampleData = Config.noiseData;
                break;
            default:
                sampleData = new Uint8Array();
        }
        return sampleData;
    }

    public getMaskData(){
        let ctx = ((document.getElementById('mask-canvas') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D);
        // return ctx.getImageData(0, 0, this.canvasSize[0], this.canvasSize[1]).data;
        return new Uint8ClampedArray(this._canvasSize[0] * this._canvasSize[1] * 4);
    }

    public set layerMode(mode: number){
        this._layerMode = mode;
        if(this._loaded)
            this._renderPass.layerMode = mode;
    }

    public get layerMode(){
        return this._layerMode;
    }

    public updateChange(){
        this.invalidate(true);
        this._inputChanged = true;
    }

    protected onSwap(): void {};
    protected onDiscarded(): void {}

    public set mode(mode: Mode){
        this._mode = mode;
    }

    public get renderPass(){
        return this._renderPass;
    }

    public get exportPass(){
        return this._exportPass;
    }

    public get canvasSize(){
        return this._canvasSize;
    }
}