/* @flow */

import { cached } from 'shared/util'
import { parseFilters } from './filter-parser'

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // 默认的匹配插值表达式正则 {{}}
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g // 用户可自定义的分隔符

// 根据自定义的插值表达式的分隔符，构建正则表达式
const buildRegex = cached(delimiters => {
  // $&当前匹配的内容
  // 将匹配到的正则运算符转义，例如+ => \+
  const open = delimiters[0].replace(regexEscapeRE, '\\$&')
  const close = delimiters[1].replace(regexEscapeRE, '\\$&')
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
})

type TextParseResult = {
  expression: string,
  tokens: Array<string | { '@binding': string }>
}

// 处理文本和插值表达式
export function parseText (
  text: string,
  delimiters?: [string, string]
): TextParseResult | void {
  // 若使用了自定义的分隔符，则构建对应的正则表达式；
  // 否则使用默认的{}分隔符的正则表达式
  const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE
  // 没有匹配到插值和表达式
  if (!tagRE.test(text)) {
    return
  }
  const tokens = []
  const rawTokens = [] // 用于保存插值和表达式直接的纯文本
  let lastIndex = tagRE.lastIndex = 0 // 将上次匹配的索引重置
  let match, index, tokenValue
  // 不断对文本匹配，获取到所有的插值、表达式
  while ((match = tagRE.exec(text))) {
    index = match.index // 匹配到的插值表达式的索引
    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index)) // 将匹配到的插值表达式之间的原始文本保存
      tokens.push(JSON.stringify(tokenValue)) // 将该原始文本转换为字符串保存
    }
    // tag token
    // 对表达式进行过滤器解析
    const exp = parseFilters(match[1].trim())
    tokens.push(`_s(${exp})`)
    rawTokens.push({ '@binding': exp })
    lastIndex = index + match[0].length
  }
  // 最后的插值表达式的后面的文本处理
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex))
    tokens.push(JSON.stringify(tokenValue))
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}
