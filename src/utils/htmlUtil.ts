import { v4 as uuid } from 'uuid';

export class Controls {

    protected _controlsElement: HTMLFormElement;

    public constructor(containerID: string, heightOfParent?: number, parentID?: string) {
        const _container = document.getElementById(containerID) as HTMLElement;
        this._controlsElement = document.createElement('form');
        this._controlsElement.onsubmit = (ev) => {
            ev.preventDefault();
            return false;
        };
        _container.appendChild(this._controlsElement);

        if(heightOfParent && parentID){
            const parent = document.getElementById(parentID) as HTMLElement;
            new ResizeObserver(()=>{
                _container.style.height = (parent.clientHeight * heightOfParent) + 'px';
            }).observe(parent);
        }
    }

    private createGenericRangedInput(
        label: string|undefined,
        type: string,
        placeholder = '',
        value?: number,
        description?: string,
        min?: number,
        max?: number,
        step?: number,
        id?: string,
        parentId?: string
    ): HTMLInputElement {
        const rangedInput = this.createGenericInput(
            label, type, placeholder, description, id, parentId);
        rangedInput.min = String(min);
        rangedInput.max = String(max);
        rangedInput.step = String(step);
        rangedInput.value = String(value);
        return rangedInput;
    }

    protected createLabel(
        label: string,
        htmlFor: string,
        parentId?: string
    ): HTMLLabelElement {
        const labelElement = document.createElement('label');
        labelElement.htmlFor = htmlFor;
        labelElement.innerText = label;
        if(parentId !== undefined)
            (document.getElementById(parentId) as HTMLElement).appendChild(labelElement);
        else
            this._controlsElement.appendChild(labelElement);
        return labelElement;
    }

    protected createDescription(
        description: string
    ): HTMLElement {
        const smallId = uuid();
        const smallElement = document.createElement('small');
        smallElement.className = 'form-text text-muted';
        smallElement.innerText = description;
        smallElement.id = smallId;
        this._controlsElement.appendChild(smallElement);
        return smallElement;
    }

    protected createInput(
        label: string | undefined,
        createMainElement: () => HTMLElement,
        description?: string,
        id?: string,
        parentId?: string
    ): HTMLElement {
        if (!id) {
            id = uuid();
        }

        if(label) {
            this.createLabel(label, id, parentId);
        }

        const inputElement = createMainElement();
        inputElement.id = id;

        if(parentId !== undefined)
            (document.getElementById(parentId) as HTMLElement).appendChild(inputElement);
        else
            this._controlsElement.appendChild(inputElement);

        if (description) {
            const smallElement = this.createDescription(description);
            inputElement.setAttribute('aria-describedby', smallElement.id);
        }

        return inputElement;
    }

    public createActionButton(
        label: string,
        button_style?: string,
        other_classes?: string[],
        description?: string,
        id?: string,
        parentId?: string,
    ): HTMLButtonElement {
        const buttonElement = this.createGenericInput(
            '', 'button', undefined, description, id, parentId);
        buttonElement.value = label;
        buttonElement.classList.add('btn');
        buttonElement.classList.add(button_style != undefined? button_style : 'btn-primary');

        other_classes?.forEach((currentClass: string) => {
            buttonElement.classList.add(currentClass);
        })
        
        return buttonElement as HTMLButtonElement;
    }

    public createCollapseButton(
        label: string,
        forID: string,
        description?: string,
        id?: string
    ): HTMLButtonElement {
        const buttonElement = this.createButton(
            '', 'button', description, id);
        buttonElement.value = label;
        buttonElement.setAttribute('data-bs-target', '#' + forID);
        buttonElement.setAttribute('data-bs-toggle', 'collapse');
        buttonElement.setAttribute('aria-expanded', 'false');
        buttonElement.setAttribute('aria-controls', forID);

        return buttonElement as HTMLButtonElement;
    }

    public createButton(
        label: string,
        type = 'text',
        description?: string,
        id?: string
    ): HTMLButtonElement{
        const createMainElement = (): HTMLButtonElement => {
            const buttonElement = document.createElement('button');
            if(id !== undefined)
            buttonElement.id = id;
            buttonElement.className = 'btn btn-secondary';
            buttonElement.type = type;
            this._controlsElement.appendChild(buttonElement);
            return buttonElement;
        };

        const buttonElement =
            this.createInput(label, createMainElement, description, id);

        return buttonElement as HTMLButtonElement;
    }

    public createRow2Cols(id: string, col1: string = 'col-6', col2: string = 'col-6', pad1?: string, pad2?: string) {
        const rowElement = document.createElement('div');
        if(id !== undefined)
            rowElement.id = id;
        rowElement.className = 'row';

        const column = document.createElement('div');
        if(id !== undefined)
            column.id = id + '-col1';
        column.className = col1 + ' ' + pad1;

        const column2 = document.createElement('div');
        if(id !== undefined)
            column2.id = id + '-col2';
        column2.className = col2 + ' ' + pad2;

        rowElement.appendChild(column);
        rowElement.appendChild(column2);

        this._controlsElement.appendChild(rowElement);
        return rowElement;
    }

    public createRow3Cols(id: string, col1: string = 'col-4', col2: string = 'col-4', col3: string = 'col-4',
        pad1?: string, pad2?: string, pad3?: string
    ) {
        const rowElement = document.createElement('div');
        if(id !== undefined)
            rowElement.id = id;
        rowElement.className = 'row';

        const column = document.createElement('div');
        if(id !== undefined)
            column.id = id + '-col1';
        column.className = col1 + ' ' + pad1;

        const column2 = document.createElement('div');
        if(id !== undefined)
         column2.id = id + '-col2';
        column2.className = col2 + ' ' + pad2;

        const column3 = document.createElement('div');
        if(id !== undefined)
         column3.id = id + '-col3';
        column3.className = col3 + ' ' + pad3;

        rowElement.appendChild(column);
        rowElement.appendChild(column2);
        rowElement.appendChild(column3);

        this._controlsElement.appendChild(rowElement);
        return rowElement;
    }

    public createGenericInput(
        label: string|undefined,
        type = 'text',
        placeholder = '',
        description?: string,
        id?: string,
        parentId?: string
    ): HTMLInputElement {
        const createMainElement = (): HTMLInputElement => {
            const inputElement = document.createElement('input');
            if(id !== undefined)
                inputElement.id = id;
            inputElement.className = 'form-control';
            inputElement.type = type;
            inputElement.placeholder = placeholder;

            if(parentId !== undefined)
                (document.getElementById(parentId) as HTMLElement).appendChild(inputElement);
            else
                this._controlsElement.appendChild(inputElement);
            
            return inputElement;
        };

        const inputElement =
            this.createInput(label, createMainElement, description, id, parentId);

        return inputElement as HTMLInputElement;
    }

    public createSelectListInput(
        label: string,
        options: string[],
        description?: string,
        id?: string
    ): HTMLSelectElement {

        const createMainElement = (): HTMLSelectElement => {
            const selectElement = document.createElement('select');
            if(id !== undefined)
                selectElement.id = id;
            selectElement.className = 'form-control';
            this._controlsElement.appendChild(selectElement);

            options.forEach( (element) => {
                const optionElement  = document.createElement('option');
                optionElement.innerHTML = element;
                selectElement.appendChild(optionElement);
            });
            return selectElement;
        };

        const inputElement =
            this.createInput(label, createMainElement, description, id);

        return inputElement as HTMLSelectElement;
    }

    public createTextInput(
        label: string|undefined,
        placeholder = '',
        other_classes?: string[],
        description?: string,
        id?: string,
        parentId?: string,
    ): HTMLInputElement {
        let element = this.createGenericInput(
            label, 'text', placeholder, description, id, parentId);

        other_classes?.forEach((currentClass: string) => {
            element.classList.add(currentClass);
        })
        return element;
    }

    public createColorInput(
        label: string,
        placeholder = '',
        description?: string,
        id?: string
    ): HTMLInputElement {
        return this.createGenericInput(
            label, 'color', placeholder, description, id);
    }

    public createNumberInput(
        label: string|undefined,
        placeholder = '',
        value?: number,
        description?: string,
        min?: number,
        max?: number,
        step?: number,
        id?: string,
        parentId?: string,
        margin?: string
    ): HTMLInputElement {
        let input =  this.createGenericRangedInput(
            label, 'number', placeholder, value, description,
            min, max, step, id, parentId);
        if(margin !== undefined)
            input.classList.add(margin);
        return input;
    }

    public createSliderInput(
        label: string,
        placeholder = '',
        value?: number,
        description?: string,
        min?: number,
        max?: number,
        step?: number,
        id?: string,
        parentId?: string,
    ): HTMLInputElement {
        const sliderInput = this.createGenericRangedInput(
            label, 'range', placeholder, value, description,
            min, max, step, id, parentId);
        sliderInput.classList.add('custom-range');
        return sliderInput;
    }

    public createFileInput(
        label: string|undefined,
        accept?: string,
        multiple = false,
        placeholder = '',
        description?: string,
        id?: string
    ): HTMLInputElement {
        const fileInput = this.createGenericInput(
            label, 'file', placeholder, description, id);
        if(accept !== undefined)
            fileInput.accept = accept;
        fileInput.multiple = multiple;

        const wrapper = document.createElement('div');
        wrapper.classList.add('fileInputWrapper');
        fileInput.height;
        fileInput.parentElement?.replaceChild(wrapper, fileInput);

        const button = this.createActionButton('Choose File');
        wrapper.appendChild(button);
        wrapper.appendChild(fileInput);

        button.onclick = () => fileInput.click();
        fileInput.onchange = () => {
            if(fileInput.files)
                button.value = Array.from(fileInput.files)
                    .map((file) => file.name)
                    .join('; ');
        };

        return fileInput;
    }
}
