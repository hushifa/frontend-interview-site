var e={answerHtml:`<p>pnpm workspace 用工作区清单管理多个包，并可通过 <code>workspace:</code> 协议明确依赖必须来自本仓库的包。这样可以避免本地开发时意外解析到远程版本，也能在发布时按规则转换依赖范围。</p>
<p>多包仓库要明确包的构建顺序、类型产物、循环依赖和脚本过滤范围。<code>--filter</code> 适合只运行受影响的包，但必须理解依赖选择器，避免 CI 漏跑下游构建。</p>
<p>锁文件、Node/pnpm 版本和缓存策略要固定。workspace 能减少重复依赖，却不会自动解决包边界、公开 API、版本发布和测试隔离问题。</p>`};export{e as default};