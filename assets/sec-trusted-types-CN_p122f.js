var e={answerHtml:`<p>不会。Trusted Types 把进入特定注入入口的数据集中到策略中处理，例如生成 TrustedHTML 后交给 innerHTML。策略里的转换或净化逻辑仍由应用定义；原样返回任意字符串的策略不会神奇地消除 XSS。</p>
<p>仅创建策略也不等于强制所有调用经过策略。通常还要配置 require-trusted-types-for 等 CSP 指令，并管理允许创建的策略名称。部署前应盘点第三方库和现有 DOM 写入，逐步处理违规路径。</p>
<p>对于 HTML，可在策略中采用经过维护的净化库，并按实际用途配置。还需核对目标浏览器支持情况和 CSP 生效方式。它主要约束特定 DOM 注入入口，不是对服务端注入、所有 URL 或全部脚本行为的通用安全证明。</p>`};export{e as default};