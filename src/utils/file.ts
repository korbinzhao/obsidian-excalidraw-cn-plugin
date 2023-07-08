export const DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX = /\[\[(.+)\]\]/;
export const DOUBLE_CHAIN_LINK_AS_OBSIDIAN_LINK_REGEX = /^obsidian:\/\/open\?vault=.+\&file=(.+)$/;

export const getLinkFileName = (linkText: string | null): string | undefined => {
    if (!linkText) {
        return;
    }

    const fileName = linkText?.match(DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX)?.[1] || linkText?.match(DOUBLE_CHAIN_LINK_AS_OBSIDIAN_LINK_REGEX)?.[1];
    return fileName && decodeURIComponent(fileName);
}
