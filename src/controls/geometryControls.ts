import { Config } from "../config/config";
import { Controls } from "../utils/htmlUtil";
import { ImageRenderer } from "../webgl/renderer";

export enum ExportMode {
    COLOR, TEXTURE
}

export class GeometryControls {

    protected _controls!: [Controls, Controls];
    protected _exportModes: Map<string, ExportMode> = new Map<string, ExportMode>([
        ['Color', ExportMode.COLOR],
        ['Texture', ExportMode.TEXTURE]
    ]);

    protected _exportMode!: ExportMode;

    public constructor(id: string, id2: string){
        this._controls = [new Controls(id), new Controls(id2)];
    }

    public setup(){
        const exportMode = this._controls[0].createSelectListInput(
            'Export Mode', Array.from(this._exportModes.keys()));
        exportMode.addEventListener('change', (event) => {
            this._exportMode = this._exportModes.get((event.target as HTMLInputElement).value) as ExportMode;
            Config.updateValue('exportMode', this._exportMode);
        });

        const exportButton = this._controls[1].createActionButton('Export', 'btn-warning');
        exportButton.addEventListener('click', () => {
            this.export();
        });

        Config.register('exportMode', exportMode);
    }

    public export(){

    }
}