var e={answerHtml:`<p>库发布至少要让消费者能找到运行时代码和类型声明。通常需要构建 ESM 或 CommonJS 入口、生成 <code>.d.ts</code>，并在 <code>package.json</code> 中正确声明 <code>types</code> 或通过 <code>exports</code> 的条件暴露类型入口。</p>
<p><code>exports</code> 会封装未声明的子路径，也可能改变旧项目的解析结果。发布者应分别测试 Node、打包器、TypeScript 不同 moduleResolution 设置下的 <code>import</code>、<code>require</code>、类型导入和子路径，不能只在本仓库能编译就认为兼容。</p>
<p>类型声明描述的是公开 API 契约，不能保证运行时一定提供同样行为。发布前应检查产物中是否误包含源码路径、测试文件或仅开发环境存在的依赖，并用一个独立消费者项目验证安装包。</p>
<h3>复习提示</h3>
<p>回答时区分编译期类型检查与运行时 JavaScript 行为。类型体操或配置项要说明适用边界，公共类型还要关注错误提示、编译耗时和不同 TypeScript 版本的差异。可以把“TypeScript、类型声明、npm 发布”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};