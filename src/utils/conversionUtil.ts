import { ColorMode, Criteria, DataStructure } from "../controls/layerControls";

export function criteriaToString(criteria: Criteria){
    switch(criteria){
        case Criteria.DEPTH:
            return 'Depth';
        case Criteria.SALIENCY_O:
            return 'Saliency_O';
        case Criteria.SALIENCY_A:
            return 'Saliency_A';
        case Criteria.MATTING:
            return 'Matting';
        case Criteria.LOD:
            return 'Lod';
    }
}

export function stringToCriteria(s: string){
    switch(s){
        case 'Depth':
            return Criteria.DEPTH;
        case 'Saliency_O':
            return Criteria.SALIENCY_O;
        case 'Saliency_A':
            return Criteria.SALIENCY_A;
        case 'Matting':
            return Criteria.MATTING;
        case 'Lod':
            return Criteria.LOD;
        default:
            return Criteria.LOD;
    }
}

export function colorModeToString(colorMode: ColorMode){
    switch(colorMode){
        case ColorMode.AVG:
            return 'AVG';
        case ColorMode.MEDIAN:
            return 'MEDIAN';
        case ColorMode.POINT:
            return 'POINT';
    }
}

export function stringToColorMode(s: string){
    switch(s){
        case 'AVG':
            return ColorMode.AVG;
        case 'MEDIAN':
            return ColorMode.MEDIAN;
        case 'POINT':
            return ColorMode.POINT;
        default:
            return ColorMode.MEDIAN;
    }
}

export function dataStructureToString(structure: DataStructure){
    switch(structure){
        case DataStructure.KD:
            return 'KD';
        case DataStructure.QUAD:
            return 'QUAD';
        case DataStructure.VP:
            return 'VP';
    }
}

export function stringToDataStructure(s: string){
    switch(s){
        case 'KD':
            return DataStructure.KD;
        case 'QUAD':
            return DataStructure.QUAD;
        case 'VP':
            return DataStructure.VP;
        default:
            return DataStructure.VP;
    }
}
