import { Config } from "../config/config";
import { Controls } from "../utils/htmlUtil";

export class GlobalControls {

    protected _control!: Controls;

    public constructor(id: string){
        this._control = new Controls(id);
    }

    public setup(){
        let modal = document.getElementById('global-modal') as HTMLElement;
        let globalBtn = document.getElementById('global-button') as HTMLButtonElement;
        let closeButton = document.getElementsByClassName('close')[0] as HTMLElement;

        globalBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });

        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if(event.target == modal)
                modal.style.display = 'none';
        });

        this.fillContainer();
    }

    private fillContainer(){
        let maxRecursionInput = this._control.createNumberInput('svg-path-to-polygon [max recursion depth]', '', 1, '', 1, 100, 1);
        maxRecursionInput.addEventListener('change', (event) => {
            Config.updateValue('maxRecursionDepth', (event.target as HTMLInputElement).valueAsNumber);
        });

        Config.register('maxRecursionDepth', maxRecursionInput);
    }
}