var e={answerHtml:`<p>模型输出应按不可信内容处理。不要直接把生成文本作为 HTML 交给 dangerouslySetInnerHTML，也不要把生成的 JSX、MDX 或脚本直接编译执行。展示代码与执行代码是不同的权限边界。</p>
<p>react-markdown 默认提供安全基础，但其官方文档提醒：修改 URL 转换、添加插件或自定义组件可能引入风险。若确实支持原始 HTML，应使用合适的解析与净化流程，并为标签、属性和协议制定明确规则，而不是认为“用了 Markdown 库就都安全”。</p>
<p>外链和远程图片也需要产品策略：即使不执行脚本，加载图片仍可能向第三方发送请求，伪装链接也可能误导用户。流式内容尚不完整时，应允许暂时以纯文本展示，不要为了修补标签而绕过净化。公式、图表和代码沙盒属于额外能力，需要单独评估。</p>
<p>补充参考：<a href="https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html">OWASP · 提示词注入防护</a>。</p>
<h3>复习提示</h3>
<p>回答时把模型输出、应用状态、工具执行和用户权限分开建模。流式传输、结构化输出和检索结果都需要校验，不能把模型文本直接当作可信指令或最终事实。建议用一个最小示例验证“Markdown、模型输出、XSS”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};