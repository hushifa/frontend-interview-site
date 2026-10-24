var e={answerHtml:`<p>ES Modules 具有可静态分析的 import/export 结构，导出通常是实时绑定；CommonJS 在执行时通过 require 与 module.exports 提供模块值。浏览器原生支持 ESM，CommonJS 主要存在于 Node.js 与工具链兼容场景。</p>
<p>ESM 的静态结构有利于依赖分析和 tree shaking，但副作用仍影响是否能删除代码。动态 import 返回 Promise，可用于代码分割。循环依赖在两种系统中的初始化行为不同，不能只记成“一个拷贝、一个引用”就涵盖全部情形。</p>
<p>Node.js 中 .mjs、.cjs 与 package.json 的 type 会影响解释方式。两种模块互操作的默认导出、命名导出推断和异步加载有环境差异，应查具体 Node 与打包工具文档，避免依赖偶然可用的导入写法。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。建议用一个最小示例验证“ESM、CommonJS、模块”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};