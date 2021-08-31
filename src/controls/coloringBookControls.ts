import { SVGBuilder } from "../building/builder/svgBuilder";
import { Controls } from "../utils/htmlUtil";
import { BorderMode, ColorMode } from "./vectorControls";

export class ColoringBookControls {

    protected _control!: Controls;
    protected _svgBuilder!: SVGBuilder;

    public constructor(id: string){
        this._control = new Controls(id);
    }

    public setup(){
        const exportTemplateButton = this._control.createActionButton('Export Template', 'btn-warning');
        exportTemplateButton.addEventListener('click', () => {
            this.exportTemplate();
        });
    }
    
    private exportTemplate(){
        this._svgBuilder.applyAppearanceSettings({
            border0: 1,
            border1: 1,
            borderMode: BorderMode.FILL_AND_BORDER,
            colorMode: ColorMode.WHITE,
            color0: '#000000',
            color1: '#000000'
        });
        this._svgBuilder.buildColoringTemplate();
        this._svgBuilder.applyAppearanceSettings();
    }

    public set svgBuilder(builder: SVGBuilder){
        this._svgBuilder = builder;
    }
}