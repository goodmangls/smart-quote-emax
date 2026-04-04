export const PDF_LAYOUT = {
    MARGIN_X: 20,
    MARGIN_RIGHT: 20,
    PAGE_WIDTH: 210, // A4
    LINE_HEIGHT: 7,
    COLORS: {
      PRIMARY: [2, 132, 199] as [number, number, number], // J-Ways Blue
      PRIMARY_LIGHT: [240, 249, 255] as [number, number, number],
      TEXT: [0, 0, 0] as [number, number, number],
      TEXT_LIGHT: [100, 100, 100] as [number, number, number],
      WARNING: [180, 83, 9] as [number, number, number],
      BG_HEADER: [240, 249, 255] as [number, number, number],
      BG_TABLE: [245, 245, 245] as [number, number, number],
      WHITE: [255, 255, 255] as [number, number, number],
    },
    FONTS: {
      FAMILY: 'NotoSansKR',
      FALLBACK: 'helvetica',
      SIZE_TITLE: 18,
      SIZE_HEADER: 22,
      SIZE_SUBHEADER: 12,
      SIZE_NORMAL: 10,
      SIZE_SMALL: 8,
      SIZE_TABLE: 9,
    },
    LOGO: {
      WIDTH: 40,
      HEIGHT: 12,
    },
};
