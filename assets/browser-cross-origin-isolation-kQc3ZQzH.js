var e={answerHtml:`<p>跨源隔离用于收紧文档与其他来源的共享关系，为 SharedArrayBuffer 等能力提供环境条件。常见部署组合是 COOP: same-origin，以及 COEP: require-corp 或 credentialless，还需满足安全上下文和相关 Permissions Policy 等要求。</p>
<p>部署时应通过 window.crossOriginIsolated 检查实际结果，并测试所有跨源资源和弹窗流程。COEP 可能使没有合适授权的资源加载失败，COOP 可能改变跨源弹窗与 opener 的关系，不能只添加响应头后就视为迁移完成。</p>
<p>这些机制不等于允许任意跨源读取，也不替代 CORS、输入校验或 XSS 防护。静态托管平台是否能配置相应响应头同样是实施前提，不能仅靠前端变量把页面切换成隔离环境。</p>
<h3>复习提示</h3>
<p>回答时沿着页面生命周期、事件循环、渲染和存储边界说明过程。浏览器 API 的支持情况要结合特性检测和目标版本验证，不能只凭开发机现象下结论。可以把“跨源隔离、COOP、COEP”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};