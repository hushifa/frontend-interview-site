var e={answerHtml:`<p>import type 明确表达只在类型层面使用的依赖，整条纯类型导入会在输出中擦除。verbatimModuleSyntax 让导入导出的保留规则更直接：没有 type 修饰的内容按相应模块语法保留，类型部分被移除。</p>
<p>需要注意整条 import type 与在普通 import 中只写 type 成员并不完全相同：后者可能留下空导入，从而仍保留模块求值。如果依赖模块的注册副作用，应显式写副作用导入，不能寄希望于某个类型引用碰巧留下。</p>
<p>启用该选项后，ESM 语法不会在配置指向 CommonJS 时被悄悄改写为 require。应统一文件扩展名、package.json 的 type、模块设置与运行环境。它提高可预测性，但不代替打包器的 Tree shaking 或运行时模块解析。</p>
<h3>复习提示</h3>
<p>回答时区分编译期类型检查与运行时 JavaScript 行为。类型体操或配置项要说明适用边界，公共类型还要关注错误提示、编译耗时和不同 TypeScript 版本的差异。建议用一个最小示例验证“类型导入、模块副作用、verbatimModuleSyntax”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};