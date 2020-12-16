import en_US from "./en_US.json";
import pt_BR from "./pt_BR.json";

export const langs = {
    //en_US,
    pt_BR,
}

/**
 *
 * @param {string} key
 * @param {string} lang
 * @param {Object<string, string>?} params
 */
export default function getLocalizedString(key, lang, params = {}) {
    if (!(key in langs[lang])) {
        throw new ReferenceError('Invalid key.');
    }

    if (Object.keys(params).length === 0) {
        return langs[lang][key];
    }

    return langs[lang][key].replace(new RegExp(Object.keys(params).map(k => `:${k}`).join('|'), 'gmu'), match => params[match] ?? match);
}
