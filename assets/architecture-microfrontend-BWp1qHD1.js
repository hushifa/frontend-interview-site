var e={answerHtml:`<h2>简答</h2>
<ul>
<li>微前端主要解决组织问题：多个团队负责同一个产品的不同部分，需要独立开发、独立部署、独立回滚。</li>
<li>集成方式有三类：构建时集成（npm 包）、运行时集成（Module Federation、import maps、qiankun 等）和 iframe。</li>
<li>运行时集成才能真正独立部署，代价是共享依赖版本、样式隔离、全局状态和故障隔离都要自己处理。</li>
<li>团队少、发布节奏一致时，一个模块化良好的单体应用通常更简单。</li>
<li>子应用之间只通过明确的契约通信（路由、事件、少量共享数据），避免互相访问内部实现。</li>
</ul>
<h2>什么时候值得</h2>
<ul>
<li>产品由多个团队负责，每个团队需要按自己的节奏发布。</li>
<li>需要渐进迁移旧系统，例如在旧的 AngularJS 应用里逐页替换成 React。</li>
<li>不同部分对技术栈有不同要求。</li>
</ul>
<p>如果所有代码都由一个团队维护，微前端带来的协调成本往往超过收益，按功能划分模块就够了。</p>
<h2>集成方式对比</h2>
<table><thead><tr><th>方式</th><th>独立部署</th><th>隔离性</th><th>主要成本</th></tr></thead><tbody><tr><td>构建时（npm 包）</td><td>否，主应用要重新构建</td><td>无</td><td>发布要串行协调</td></tr><tr><td>Module Federation</td><td>是</td><td>弱，共享同一个页面</td><td>共享依赖版本协商</td></tr><tr><td>import maps + ES 模块</td><td>是</td><td>弱</td><td>手动管理模块地址和共享依赖</td></tr><tr><td>qiankun / single-spa</td><td>是</td><td>JS 沙箱和样式隔离（不完全）</td><td>框架自身复杂度</td></tr><tr><td>iframe</td><td>是</td><td>强</td><td>通信、路由同步、弹窗和样式统一困难</td></tr></tbody></table>
<h2>Module Federation 示例</h2>
<p>Module Federation 由 webpack 5 引入，Module Federation 2.0 提供了 Rspack、Vite 等工具的插件。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 子应用 orders 的配置</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">ModuleFederationPlugin</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;orders&#x27;</span>,
  <span class="hljs-attr">filename</span>: <span class="hljs-string">&#x27;remoteEntry.js&#x27;</span>,
  <span class="hljs-attr">exposes</span>: { <span class="hljs-string">&#x27;./OrderPage&#x27;</span>: <span class="hljs-string">&#x27;./src/OrderPage.tsx&#x27;</span> },
  <span class="hljs-attr">shared</span>: { <span class="hljs-attr">react</span>: { <span class="hljs-attr">singleton</span>: <span class="hljs-literal">true</span> }, <span class="hljs-string">&#x27;react-dom&#x27;</span>: { <span class="hljs-attr">singleton</span>: <span class="hljs-literal">true</span> } },
});
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 主应用</span>
<span class="hljs-keyword">const</span> <span class="hljs-title class_">OrderPage</span> = <span class="hljs-title class_">React</span>.<span class="hljs-title function_">lazy</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;orders/OrderPage&#x27;</span>));
</code></pre></div>
<p><code>singleton</code> 让 React 在页面上只加载一份，否则多个 React 实例会导致 Hooks 报错。</p>
<h2>必须处理的问题</h2>
<ul>
<li><strong>共享依赖</strong>：版本不一致时可能加载多份，体积变大，单例库出错。要约定共享库的版本范围和升级流程。</li>
<li><strong>样式冲突</strong>：用 CSS Modules、命名前缀或 Shadow DOM 隔离，全局样式只由主应用提供。</li>
<li><strong>故障隔离</strong>：子应用加载失败或运行报错时，主应用用错误边界显示降级内容，不能整页白屏。</li>
<li><strong>契约</strong>：路由前缀、跨应用事件名、共享数据格式都要写成文档并做版本管理。</li>
<li><strong>回滚</strong>：每个子应用独立回滚，前提是它和主应用之间的契约向后兼容。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎样共享登录状态？由主应用负责登录并通过 Cookie 或共享的上下文提供用户信息，子应用不各自实现登录。</li>
<li>微前端会影响性能吗？会增加请求和重复代码的风险，需要共享依赖和合理的预加载来弥补。</li>
</ul>`};export{e as default};