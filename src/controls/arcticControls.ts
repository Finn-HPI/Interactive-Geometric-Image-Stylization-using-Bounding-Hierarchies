import { Controls } from "../utils/htmlUtil";

export enum Effect {
    TOON, TOON_PORTRAIT, TOON_BW, OIPLAINT_TOON_BW, OILPAINT_COMIC_BW_FALL, COLOR_LUT, CAM_20, GRAYSCALE, WATERCOLOR
}

export class ArcticControls{

    protected _controls!: [Controls, Controls, Controls];

    protected _effects: Map<string, Effect> = new Map<string, Effect>([
        ['Toon', Effect.TOON],
        ['Toon - Portratit', Effect.TOON_PORTRAIT],
        ['Toon B/W', Effect.TOON_BW],
        ['Oilpaint Toon B/W', Effect.OIPLAINT_TOON_BW],
        ['Oilpaint Comic B/W Fall', Effect.OILPAINT_COMIC_BW_FALL],
        ['Color LUT', Effect.COLOR_LUT],
        ['20\'s Cam', Effect.CAM_20],
        ['Grayscale', Effect.GRAYSCALE],
        ['Watercolor', Effect.WATERCOLOR]
    ]);

    public constructor(id: string, id2: string, id3: string){
        this._controls = [new Controls(id), new Controls(id2), new Controls(id3)];
    }

    public setup(){
        const svg2imgButton = this._controls[0].createActionButton('Convert SVG To Image', 'btn-primary');
        svg2imgButton.addEventListener('click', () => {

        });

        const effectControl = this._controls[1].createSelectListInput(
            'Effect', Array.from(this._effects.keys()));
        
        effectControl.addEventListener('change', (event) => {
           
        });

        const applyButton = this._controls[2].createActionButton('Apply', 'btn-warning');
        applyButton.addEventListener('click', () => {
            this.apply();
        });
    }

    public apply(){

    }
}