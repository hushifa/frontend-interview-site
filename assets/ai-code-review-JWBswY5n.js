var e={answerHtml:`<h2>简答</h2>
<ul>
<li>生成的代码可能用了过时 API、漏掉取消和清理、引入不必要的依赖，或者把用户输入直接插进 HTML。它是候选补丁，不是成品。</li>
<li>审查前先把需求写成可检查的约束：错误怎么处理、请求能否取消、卸载时清理什么、允许哪些依赖。</li>
<li>先读差异和数据流，追踪输入最终进入哪里（DOM、URL、存储、网络请求），再看演示效果。</li>
<li>类型检查和 lint 只能发现一部分问题，测试要覆盖失败、取消、快速切换和组件卸载后的迟到响应。</li>
<li>新增依赖要确认包真实存在、来源可信、许可证可用。模型可能编造一个不存在的包名，攻击者可以抢注它。</li>
</ul>
<h2>需求约束示例</h2>
<p>&quot;写一个搜索组件&quot;太宽泛。至少明确：</p>
<ul>
<li>输入防抖多久，旧请求是取消还是丢弃结果。</li>
<li>接口错误、空结果、加载中分别显示什么。</li>
<li>卸载时清理哪些监听、计时器和请求。</li>
<li>是否允许新增依赖，目标浏览器和 TypeScript 版本。</li>
<li>键盘和读屏器怎样操作。</li>
</ul>
<h2>读数据流</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">preview.<span class="hljs-property">innerHTML</span> = modelOutput; <span class="hljs-comment">// 不可信内容进入 HTML 解析器</span>
</code></pre></div>
<p>纯文本用 <code>textContent</code>；确实需要富文本，就走白名单净化流程。变量叫 <code>safeHtml</code> 不代表它真的安全。URL、文件路径、SQL、权限判断都按同样方式追踪。</p>
<h2>自动化检查</h2>
<ul>
<li>跑项目已有的类型检查、lint、格式检查和构建。不要为了让代码通过而加 <code>any</code>、关规则或删测试。</li>
<li>异步组件的测试至少覆盖：成功、HTTP 错误、格式错误、取消、快速切换输入、卸载后响应、重复提交、空结果。</li>
<li>测试也可能由模型生成，要检查它是不是只测了成功路径，mock 是否符合真实接口。</li>
</ul>
<h2>依赖与安全</h2>
<ul>
<li>安装前查看包的官方仓库、维护状态、下载量和许可证。</li>
<li>让 Agent 修改代码、运行命令时，限制它能访问的文件和网络，不给生产密钥。</li>
<li>issue、网页、文档里的内容可能藏有提示词注入，诱导模型关闭校验或加入恶意依赖。</li>
</ul>
<h2>人工审查重点</h2>
<ul>
<li>监听和 effect 是否成对清理。</li>
<li>loading、空数据、错误、取消是否区分。</li>
<li>是否符合项目现有的状态管理和错误处理方式，而不是另起一套。</li>
<li>客户端配置有没有被误当成秘密。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>让模型自己审查自己的代码可行吗？</strong> 可以作为辅助，帮助发现明显问题，但不能替代测试和人工审查，它可能沿用同样的错误假设。</li>
<li><strong>生成代码的版权怎么处理？</strong> 遵守公司政策；如果代码明显来自某个已有项目，要核对原许可证。</li>
</ul>`};export{e as default};