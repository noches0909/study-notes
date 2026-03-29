export type Dictionary = {
  title: string
  description: string
  keywords: string
}
export const locales = ["en", "zh", "ja", "ko"] // 支持的语言
export const defaultLocale = "zh"
export function getDictionary(locale: string): Promise<Dictionary> {
  //例如locale为zh 则返回 src/dictionaries/zh.json
  //locale为en 则返回 src/dictionaries/en.json
  //locale为ja 则返回 src/dictionaries/ja.json
  //locale为ko 则返回 src/dictionaries/ko.json
  return import(`./${locale}.json`).then((module) => module.default)
}
