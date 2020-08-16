/* @flow */

const validDivisionCharRE = /[\w).+\-_$\]]/

// 解析过滤器
export function parseFilters (exp: string): string {
  let inSingle = false
  let inDouble = false
  let inTemplateString = false
  let inRegex = false
  let curly = 0
  let square = 0
  let paren = 0
  let lastFilterIndex = 0
  let c, prev, i, expression, filters

  for (i = 0; i < exp.length; i++) {
    prev = c
    c = exp.charCodeAt(i) // 获取字符的编码
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) inSingle = false
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) inDouble = false
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) inTemplateString = false
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) inRegex = false
    } else if (
      // 若匹配到|且不是||，则表示为过滤器，
      c === 0x7C && // |
      exp.charCodeAt(i + 1) !== 0x7C &&
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren
    ) {
      // 若expressiong未赋值，则表示未第一个filter。
      if (expression === undefined) {
        // 第一个filter的开始，表达式的结尾
        lastFilterIndex = i + 1
        expression = exp.slice(0, i).trim() // 获取表达式
      } else {
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break         // "
        case 0x27: inSingle = true; break         // '
        case 0x60: inTemplateString = true; break // `
        case 0x28: paren++; break                 // (
        case 0x29: paren--; break                 // )
        case 0x5B: square++; break                // [
        case 0x5D: square--; break                // ]
        case 0x7B: curly++; break                 // {
        case 0x7D: curly--; break                 // }
      }
      // 正则
      if (c === 0x2f) { // /
        let j = i - 1
        let p
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j)
          if (p !== ' ') break
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true
        }
      }
    }
  }

  if (expression === undefined) {
    expression = exp.slice(0, i).trim()
  } else if (lastFilterIndex !== 0) {
    pushFilter()
  }

  // 将匹配到的filter进行保存
  function pushFilter () {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim())
    lastFilterIndex = i + 1
  }

  // 若插值表达式中存在过滤器，生成过滤器字符串
  if (filters) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i])
    }
    // name | call("1") | demo("2") => _f("demo")(_f("call")(name, "1"), "2")
  }

  return expression
}

// 创建filter
function wrapFilter (exp: string, filter: string): string {
  const i = filter.indexOf('(')
  // 若没有括号，表示没有filter的参数，直接将表达式作为参数，生成字符串
  // 若有括号，则表示已经包含参数
  if (i < 0) {
    // _f: resolveFilter
    return `_f("${filter}")(${exp})` // 例如： name | capitalize => _f("capitalize")(name)
  } else {
    const name = filter.slice(0, i)
    const args = filter.slice(i + 1)
    return `_f("${name}")(${exp}${args !== ')' ? ',' + args : args}`
    // 例如： name|capitalize("122","444") => _f("capitalize")(name, "122", "444")
  }
}
