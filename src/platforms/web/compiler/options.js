/* @flow */

import {
  isPreTag,
  mustUseProp,
  isReservedTag,
  getTagNamespace
} from '../util/index'

import modules from './modules/index'
import directives from './directives/index'
import { genStaticKeys } from 'shared/util'
import { isUnaryTag, canBeLeftOpenTag } from './util'

// 编译的基本配置项
export const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules,
  directives,
  isPreTag, // 判断是否为html的pre标签
  isUnaryTag, // 判断是否自闭合标签
  mustUseProp,
  canBeLeftOpenTag,
  isReservedTag, // 是否为保留的标签
  getTagNamespace, // 获取标签的命名空间
  staticKeys: genStaticKeys(modules)
}
