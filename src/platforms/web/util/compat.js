/* @flow */

import { inBrowser } from 'core/util/index'

// check whether current browser encodes a char inside attribute values
let div
// ie会在使用innnerHTML的时候对换行符和制表符进行转码为：&#10和&#9。
function getShouldDecode (href: boolean): boolean {
  div = div || document.createElement('div')
  div.innerHTML = href ? `<a href="\n"/>` : `<div a="\n"/>`
  return div.innerHTML.indexOf('&#10;') > 0
}

// 检查div中的属性是否制表符和换行符是否会被转义为&#10和&#9
export const shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false
// 检查a中的href属性是否制表符和换行符是否会被转义为&#10和&#9
export const shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false
