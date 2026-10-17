import { translations } from './translations';

describe('translations', () => {
  it('has identical key sets for en and ko', () => {
    const en = new Set(Object.keys(translations.en));
    const ko = new Set(Object.keys(translations.ko));

    const onlyInEn = [...en].filter((k) => !ko.has(k)).sort();
    const onlyInKo = [...ko].filter((k) => !en.has(k)).sort();

    expect({ onlyInEn, onlyInKo }).toEqual({ onlyInEn: [], onlyInKo: [] });
  });
});
