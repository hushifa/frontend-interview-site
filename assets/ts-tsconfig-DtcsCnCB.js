var e={answerHtml:`<p>strict 开启一组严格检查，是新项目常见起点，但并不包含所有有价值的检查。noUncheckedIndexedAccess 会让数组或索引签名访问结果包含 undefined，提醒调用者处理越界和缺失情况。</p>
<p>target 影响输出语法级别，lib 决定可用环境 API 的类型声明，二者都不会自动安装 polyfill。module 与 moduleResolution 应匹配运行环境和构建工具，不能为了消除报错随意切换。</p>
<p>建议把构建产物、依赖目录排除，并在 CI 单独执行类型检查。使用 Vite 等工具转换 TypeScript 时，语法转换成功不代表类型正确。升级 TypeScript 时也要检查诊断规则和模块解析行为变化。</p>`};export{e as default};