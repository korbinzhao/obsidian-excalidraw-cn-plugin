export const getThemeText = (theme: string, langCode: string) => {
    if (langCode === 'zh-CN') {
        return theme === 'light' ? '浅色模式' : '深色模式'
    } else if (langCode === 'zh-TW') {
        return theme === 'light' ? '淺色模式' : '深色模式'
    } else {
        return theme === 'light' ? 'Light Mode' : 'Dark Mode'
    }
}