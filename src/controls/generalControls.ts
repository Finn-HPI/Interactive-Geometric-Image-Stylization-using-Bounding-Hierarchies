import { Config } from "../config/config";

export class GeneralControls {

    protected _openButton!: HTMLButtonElement;
    protected _importButton!: HTMLButtonElement;
    protected _exportButton!: HTMLButtonElement;

    public constructor(openId: string, importId: string, exportId: string){
        this._openButton = document.getElementById(openId) as HTMLButtonElement;
        this._importButton = document.getElementById(importId) as HTMLButtonElement;
        this._exportButton = document.getElementById(exportId) as HTMLButtonElement;
    }

    public setup(){
        this._exportButton.addEventListener('click', (evt) => {
            Config.exportConfig();
        });

        this._importButton.addEventListener('click', (evt) => {
            let input = document.createElement('input');
            input.type = 'file';
            input.addEventListener('change', (event) => {
                let target = (event.target as HTMLInputElement);
                if(!target || !target.files) 
                    return;
                const file = target.files[0];
                if (!file || file.type !== 'application/json') 
                    return;
                const reader = new FileReader();
                reader.onload = () => {
                    Config.importConfig(JSON.parse(reader.result as string));
                };
                reader.readAsText(file);
            });
            input.click();
        });
    }
}