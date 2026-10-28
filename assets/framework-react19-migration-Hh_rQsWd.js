var e={answerHtml:`<p>一个 React 18 后台同时使用组件库、表单库和 SSR 框架。升级依赖后构建能通过，但弹窗打开时报旧 API 错误，输入框 ref 又出现类型错误。迁移涉及应用代码、第三方库和服务端构建，不能只把 package.json 中的版本号改完就结束。</p>
<p>这里讨论官方 React 18 → 19 的迁移边界，不代表所有 19.x 小版本行为相同。实际安装应选择维护中的目标版本，核对其补丁与框架安全公告，不要把升级指南中的首次发布版本当成今天的部署推荐。</p>
<h2>先让旧版本告诉你哪里需要修改</h2>
<p>官方建议先升级到 React 18.3：它在 18.2 基础上增加针对弃用 API 和迁移事项的警告。先在旧主版本清除这些警告，可以把行为修改与主版本升级分开定位。</p>
<p>同时查看应用的 React、React DOM、类型包和框架支持矩阵。组件库的 peerDependencies 只表达声明支持范围，不证明所有交互已验证；反过来，也不要用强制安装绕过冲突后就忽略风险。检查依赖树中是否存在重复 React 副本，尤其是本地链接的组件库和工作区包。</p>
<p>保存当前锁文件与可部署产物，记录登录、编辑、提交、弹窗焦点和 SSR 导航的基线。此次迁移先保持产品行为一致，不同时引入一整套新表单架构，这样出现问题才容易定位。</p>
<h2>根节点 API 决定应用怎样启动和销毁</h2>
<p>React 19 删除了 ReactDOM.render、ReactDOM.hydrate 等旧入口。普通客户端页面使用 createRoot，已有服务端 HTML 则使用 hydrateRoot，不能为了消除错误把 SSR 页面改成清空后重新渲染。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createRoot } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/client&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-title class_">App</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./App.jsx&#x27;</span>;

<span class="hljs-keyword">const</span> container = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">getElementById</span>(<span class="hljs-string">&#x27;root&#x27;</span>);
<span class="hljs-keyword">if</span> (!container) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;缺少应用挂载容器&#x27;</span>);

<span class="hljs-keyword">const</span> root = <span class="hljs-title function_">createRoot</span>(container);
root.<span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>);

<span class="hljs-comment">// 仅供宿主真正移除整个应用时调用，不在每次普通路由切换时执行。</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">unmountApp</span>(<span class="hljs-params"></span>) {
  root.<span class="hljs-title function_">unmount</span>();
}
</code></pre></div>
<p>迁移时搜索的不只是主入口，还包括测试工具、旧弹窗封装和微前端挂载器。由 SSR 框架管理的入口应遵循框架迁移说明，不自行创建第二个根节点。root.unmount 后若需要重新挂载，应创建新的 root。</p>
<h2>ref 回调的返回值有了明确含义</h2>
<p>React 19 支持 ref 回调返回清理函数。原来无意中返回 DOM 的箭头表达式可能因此出现类型错误，例如 <code>ref={node =&gt; current = node}</code>。如果只是保存引用，改成花括号块避免隐式返回；如果注册资源，就明确返回清理函数。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useCallback } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">MeasuredBox</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> attach = <span class="hljs-title function_">useCallback</span>(<span class="hljs-function">(<span class="hljs-params">node</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">[entry]</span>) =&gt;</span> {
      node.<span class="hljs-property">dataset</span>.<span class="hljs-property">width</span> = <span class="hljs-title class_">String</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(entry.<span class="hljs-property">contentRect</span>.<span class="hljs-property">width</span>));
    });
    observer.<span class="hljs-title function_">observe</span>(node);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
  }, []);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{attach}</span>&gt;</span>调整窗口可更新测量值<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>;
}
</code></pre></div>
<p>这是 React 19 的清理语义示例，不可原样当成 React 18 兼容实现。它只把测量值写入 data 属性，不用测量结果反复改变宽度，避免制造尺寸反馈循环。ResizeObserver 的目标环境仍需单独检查。</p>
<p>返回清理函数后，不应再假设卸载时一定靠传入 null 完成清理。开发 Strict Mode 的额外 ref 检查也可能暴露重复订阅问题。useCallback 保持函数身份只是减少不必要的拆装，不能替代正确释放资源。</p>
<h2>类型错误要修复语义，不能批量压成 any</h2>
<p>更新 React 类型包后，应检查 ref 返回值、useRef 调用、JSX 命名空间以及 ReactElement.props 的使用。若代码曾依赖宽松类型读取未知元素属性，应先缩小类型或改变组件接口；直接断言为 any 会把迁移问题留到运行时。</p>
<p>React 19 要求现代 JSX transform。确认构建工具实际生成的代码，而不是只看源码里是否写了 import React。官方 codemod 可辅助替换语法，但不能理解全部业务副作用；先固定工具版本，在可回退分支运行，审查差异后再进行验证。</p>
<h2>怎样证明没有改变关键行为</h2>
<p>首先运行类型和现有测试，再用生产构建验证以下真实路径：表单输入是否保留、提交是否只执行一次、弹窗关闭是否恢复焦点、路由切换是否清理订阅、错误边界是否展示恢复入口。</p>
<p>SSR 应检查首次 HTML、hydration 警告和客户端导航，特别是日期、ID 和客户端专属状态。开发 Strict Mode 与生产各有检查价值：开发中的额外执行用于发现副作用错误，不应通过关闭它来证明迁移成功。</p>
<p>升级前后的错误上报也要核对。React 19 改变了部分渲染错误的报告方式，不能只盯全局 error 监听器；按框架和根节点 API 文档配置捕获路径，确认不会漏报或重复上报。上传诊断数据时裁剪用户输入、表单值和敏感地址。</p>
<h2>回滚需要完整发布单元</h2>
<p>出现回归时应恢复兼容的源码、锁文件、服务端与客户端构建产物，而不只是把 react 版本改回去。若新版本已经使用 ref 清理函数等 19 专属行为，直接降依赖不能保证旧代码可运行。缓存中的旧 HTML 与新资源也需兼容，发布切换必须沿用项目既有的原子部署或版本化资源策略。</p>
<p>迁移成功的证据是目标版本下关键行为、错误监控和资源清理符合预期。包安装成功、警告减少或首屏能打开，都只能证明其中一部分。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://react.dev/blog/2024/04/25/react-19-upgrade-guide">React · React 19 Upgrade Guide</a></li>
<li><a href="https://react.dev/reference/react-dom/client/createRoot">React · createRoot</a></li>
<li><a href="https://react.dev/reference/react-dom/components/common#ref-callback">React · ref callback</a></li>
</ul>`};export{e as default};