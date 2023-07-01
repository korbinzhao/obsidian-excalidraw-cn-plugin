import en from './en';
import zhCN from './zh-CN';
import zhTW from './zh-TW';

import _ from 'lodash';

const allData: { [key: string]: object } = {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW
};

let langaugeData: object = en;

export const setLanguage = async (langCode: string) => {
    try {
        langaugeData = allData[langCode] || en;
    } catch (err) {
        console.warn(err);
    }
}

export const getLanguageText = (path: string): string => _.get(langaugeData, path);