var e={answerHtml:`<p>MCP 定义 AI 应用与外部能力交换上下文的协议。宿主应用管理客户端，客户端连接服务器；服务器可暴露工具、资源和提示模板。它不规定模型怎样思考，也不自动替应用完成 Agent 编排。</p>
<p>模型工具调用是生成某个操作及参数的机制；MCP 是接入外部能力的协议；前端负责把能力、输入、过程和结果呈现给用户。这几层可以组合，但不是安装一个 MCP 客户端就自动获得安全可靠的智能体。</p>
<p>普通网页不能直接像本机进程一样启动 stdio 服务器。远程接入需考虑受支持的传输、认证、浏览器跨源限制及部署方式。工具描述与结果仍是不可信外部数据，不能凭服务器宣称“已授权”就扩大权限。具体协议版本和 SDK 必须配套核对。</p>
<p>补充参考：<a href="https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html">OWASP · 提示词注入防护</a>。</p>`};export{e as default};