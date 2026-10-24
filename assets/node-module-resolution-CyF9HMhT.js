var e={answerHtml:`<p><code>exports</code> 可以定义包的公开入口和子路径，并阻止消费者通过未声明的内部路径导入文件。它还支持条件导出，例如 <code>import</code>、<code>require</code>、<code>node</code> 和 <code>default</code>，但条件顺序和工具支持会影响最终解析结果。</p>
<p>发布库时要同时考虑 ESM、CommonJS、类型声明、浏览器构建器和 Node 版本。不能只把 <code>main</code> 改成 <code>exports</code> 就认为兼容；应在目标环境分别测试入口、子路径、类型提示和打包结果。<code>imports</code> 主要用于包内部的私有映射，不等同于对外 API。</p>
<p>封装内部文件有助于稳定 API，但也可能让旧的深层导入突然失败。升级前需要记录公开入口并提供迁移说明，避免把构建工具偶然能解析当成 Node 官方解析规则。</p>
<h3>复习提示</h3>
<p>回答时明确代码运行在服务端还是浏览器，并说明权限、并发、流和资源释放。文件、网络、命令参数和环境变量都要按不可信输入处理，避免把 BFF 当成安全边界的替代品。可以把“Node.js、ESM、package exports”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};