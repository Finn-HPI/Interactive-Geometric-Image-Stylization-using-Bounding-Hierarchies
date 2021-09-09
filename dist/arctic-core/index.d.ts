declare type Options = {
    canvas: HTMLCanvasElement | OffscreenCanvas;
};

declare type FileSystem = {
    lookupPath(path: string): { node: any; path: string };
    mkdir(path: string): void;
    rmdir(path: string): void;
    unlink(path: string): void;
    writeFile(path: string, data: Uint8Array): void;
};

interface GLTexture extends WebGLTexture {
    name: number;
}

declare type GLContext = {
    textures: (GLTexture | null)[];
    getNewId(textures: (GLTexture | null)[]): number;
};

declare class ProcessingCore {
    constructor(width: number, height: number);

    addEffectFromFile(definitionPath: string): string;
    unloadAllEffects(): void;
    loadInputFromImageFile(imagePath: string): void;
    loadInputFromTexture(handle: number, width: number, height: number): void;
    process(): void;
    setSize(width: number, height: number): void;
    applyEffectParameterByName(effect: string, name: string, value: string): void;
    applyEffectPresetByName(effect: string, name: string): void;
    disableErrorLogging(): void;
    disableInformationLogging(): void;
    enableErrorLogging(): void;
    enableInformationLogging(): void;
    getExceptionMessage(messagePointer: number): string;
}

declare type CoreModule = {
    FS: FileSystem;
    GL: GLContext;
    WebProcessorCore: typeof ProcessingCore;
};

export default function createCore(options: Options): Promise<CoreModule>;
