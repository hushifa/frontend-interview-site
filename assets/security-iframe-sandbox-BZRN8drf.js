var e={answerHtml:`<p><code>iframe sandbox</code> 默认禁止脚本、表单提交、弹窗、下载和顶层导航等能力，再通过 <code>allow-*</code> 逐项放开。它适合把不可信内容放进受限环境，但每个能力都要按业务需要开启。</p>
<p>对同源 iframe 同时开启 <code>allow-scripts</code> 和 <code>allow-same-origin</code> 可能让嵌入页面移除自己的 sandbox 属性，因此不能把这两个值组合当成通用安全配置。跨源隔离、CSP、Permissions Policy 和服务端响应头也要一起考虑。</p>
<p>Sandbox 不是任意第三方内容的绝对安全边界。需要限制消息来源、资源加载、跳转和通信能力，并测试浏览器差异和用户可见的失败体验。</p>
<h3>复习提示</h3>
<p>回答时先划分浏览器、服务端和用户输入的信任边界，再说明攻击面和防护位置。客户端校验只能改善体验，权限、令牌和最终数据校验仍要由服务端负责。可以把“iframe、sandbox、内容隔离”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};