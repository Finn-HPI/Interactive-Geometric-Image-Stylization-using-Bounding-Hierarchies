export function getEffects(){
    return {
        "Toon": [
            {
                "effectId": "default/toon/definition/toon/1"
            }
        ],
        "Toon - Portrait": [
            {
                "effectId": "default/toon/definition/toon/1",
                "preset": "portrait"
            }
        ],
        "Toon B/W": [
            {
                "effectId": "default/color/definition/color2gray_simple/1"
            },
            {
                "effectId": "default/toon/definition/toon/1",
                "preset": "portrait"
            }
        ],
        "Oilpaint Toon B/W": [
            {
                "effectId": "default/color/definition/color2gray_simple/1"
            },
            {
                "effectId": "default/toon/definition/toon/1",
                "preset": "portrait"
            },
            {
                "effectId": "default/oilpaint/definition/oilpaint/1",
                "preset": "selfie"
            }
        ],
        "Oilpaint Comic B/W Fall": [
            {
                "effectId": "default/color/definition/color2gray_simple/1"
            },
            {
                "effectId": "default/toon/definition/toon/1",
                "preset": "portrait"
            },
            {
                "effectId": "default/oilpaint/definition/oilpaint/1",
                "preset": "selfie",
                "parameters": {
                    "details": "0.9"
                }
            },
            {
                "effectId": "default/color/definition/color_lut_2d/1",
                "parameters": {
                    "lut": "Fall"
                }
            }
        ],
        "Color LUT": [
            {
                "effectId": "default/color/definition/color_lut_2d/1",
                "preset": "Evening"
            }
        ],
        "Oilpaint": [
            {
                "effectId": "default/oilpaint/definition/oilpaint/1",
                "preset": "selfie"
            }
        ],
        "20's Cam": [
            {
                "effectId": "default/20sCam/definition/20sCam/1",
                "preset": "Strong",
                "parameters": { "colorConversionLUTLayer": "4" }
            }
        ],
        "Grayscale": [
            {
                "effectId": "default/color/definition/color2gray_simple/1"
            }
        ],
        "Watercolor": [
            {
                "effectId": "default/watercolor/definition/watercolor/1",
                "preset": "abstract"
            }
        ]
    }
}