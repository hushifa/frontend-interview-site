var e={answerHtml:`<h2>简答</h2>
<p>Server Function 是标了 &#x27;use server&#x27; 的服务端异步函数，框架会为它生成一个可从客户端调用的引用，本质上是一个公开的 HTTP 端点。传给 form action 或在 Transition 中调用时，称为 Server Action。参数和返回值必须可序列化。每个 Server Function 都要自己做身份验证和授权，不能依赖客户端界面。它需要支持 RSC 的框架（如 Next.js），并要及时升级到修复安全漏洞的补丁版本。</p>
<p>Server Function 的核心是跨执行环境调用：真正的函数实现留在服务端，支持的 React 框架为客户端提供一个可调用引用。浏览器调用这个引用时，经过网络协议把参数交给服务器，再接收可传递的结果。</p>
<p>从调用方看像在调用函数，但它不是普通的同进程函数调用。网络失败、输入不可信、用户权限变化和序列化限制都仍然存在。</p>
<h2>use server 需要框架解释，不是浏览器内置指令</h2>
<p>支持 Server Functions 的环境会识别函数或模块中的 &#x27;use server&#x27;，建立服务端入口与客户端引用。普通浏览器或 Node 直接执行一段带这个字符串的 JavaScript，并不会自动创建远程端点。</p>
<p>因此纯静态托管的 React 应用，不会只因为加了 use server 就具备服务器写入能力。需要框架构建支持与实际服务端部署，或者继续调用独立的后端 API。</p>
<p>Server Function 是跨边界函数的能力；当它被用于提交、变更等 Action 流程时，常被称为 Server Action。并不是所有客户端 Action 都是服务端函数，也不是 Server Component 中的每个普通函数都自动允许浏览器调用。</p>
<h2>一个明确不写数据库的协议示例</h2>
<p>下面的 actions.js 需要支持该机制的框架。它只验证并返回姓名，便于看清参数与结果边界，不代表已经保存资料。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// actions.js</span>
<span class="hljs-string">&#x27;use server&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">validateDisplayName</span>(<span class="hljs-params">formData</span>) {
  <span class="hljs-keyword">if</span> (!(formData <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">FormData</span>)) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;提交格式不正确。&#x27;</span> };
  }
  <span class="hljs-keyword">const</span> rawName = formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;displayName&#x27;</span>);
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> rawName !== <span class="hljs-string">&#x27;string&#x27;</span> || rawName.<span class="hljs-title function_">trim</span>() === <span class="hljs-string">&#x27;&#x27;</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;请输入姓名。&#x27;</span> };
  }
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">value</span>: { <span class="hljs-attr">displayName</span>: rawName.<span class="hljs-title function_">trim</span>() } };
}
</code></pre></div>
<p>对应的客户端表单可以通过 Action 集成调用它：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// NameForm.jsx</span>
<span class="hljs-string">&#x27;use client&#x27;</span>;

<span class="hljs-keyword">import</span> { useActionState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { validateDisplayName } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./actions.js&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">NameForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [result, formAction, pending] = <span class="hljs-title function_">useActionState</span>(
    <span class="hljs-title function_">async</span> (_previous, formData) =&gt; <span class="hljs-title function_">validateDisplayName</span>(formData),
    { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;&#x27;</span> },
  );

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{formAction}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>姓名<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;displayName&quot;</span> <span class="hljs-attr">required</span> /&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{pending}</span>&gt;</span>校验姓名<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>{result.ok ? \`合法姓名：\${result.value.displayName}\` : result.message}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>框架必须把这个导入处理成服务端函数引用，不能把服务端实现当成普通浏览器模块打包。该示例的校验逻辑可以单独测试，但只有放入支持框架后，才具备真正的跨网络调用语义。</p>
<h2>参数和返回值需要符合 React 协议</h2>
<p>Server Function 是异步函数，调用者不能把返回值当作一个立即完成的同步结果。数据跨边界时也不会保留任意对象的内存身份。</p>
<p>React 允许的可传递类型不只局限于 JSON：协议支持一些原始值、普通数据结构、Date、Map、Set、FormData、部分二进制数据与特定函数引用等。但这不是 structuredClone 的完整替代，也不接受任意普通函数、DOM 节点或自定义类实例。</p>
<p>支持列表还应结合当前 React 与框架版本确认。对公开接口，优先采用清楚、最小的业务数据结构，不要把整个数据库对象、请求对象或带内部能力的实例直接返回给浏览器。</p>
<h2>服务端执行不等于参数已经可信</h2>
<p>客户端能控制传入参数，隐藏字段、按钮禁用、前端类型和页面里是否展示入口，都不能替代服务端验证。真实修改资料时，应从服务端会话取得当前身份，再检查该身份是否有权操作目标资源。</p>
<p>即使资源 ID 通过绑定参数或闭包形成，也不应跳过当前权限检查。用户可能重放旧调用，权限和资源状态也可能在页面打开后变化。</p>
<p>输入校验、授权和实际写入最好围绕明确的业务事务组织。不能先确认一个字段“格式像 ID”，就把它当成已经完成资源归属验证。示例不涉及受保护写入，真实业务必须增加对应逻辑。</p>
<h2>Action 状态不会替代服务器一致性</h2>
<p>React 可以帮助跟踪 pending、组织表单结果与乐观界面，但重复提交、网络重试、并发修改和响应乱序仍需要服务端策略。一个浏览器按钮禁用，不会阻止另一个标签页或客户端发送相同操作。</p>
<p>对于需要安全重试的写入，可根据业务采用幂等标识、版本检查、事务或明确的操作状态查询。客户端超时也不证明服务器没有执行成功，不能只在前端回滚画面就宣布数据已撤销。</p>
<p>可预期校验失败可以返回结构化结果；意外异常应由框架错误机制与日志处理。面向用户的返回数据应避免泄漏内部实现和敏感字段。</p>
<h2>读取、缓存刷新和渐进增强由具体环境组织</h2>
<p>Server Functions 主要面向变更工作，不应直接当作所有页面读取的通用请求缓存层。读取可由 Server Components、框架加载器或其他数据机制完成；React cache 与框架持久缓存也有不同作用范围。</p>
<p>写入成功后，哪些页面数据需要刷新或失效，要使用框架提供的机制明确处理。函数返回成功，并不保证所有客户端缓存自动知道新版本。</p>
<p>支持的框架可以将 Server Function 与原生表单提交衔接，提供一定的无 JavaScript 或尚未增强时的行为。但需要服务端表单和路由配置，不是任何客户端包装函数都天然保留同样的渐进增强能力。</p>
<h2>稳定能力与底层集成接口要分开看</h2>
<p>React 19 的 Server Functions 能力已经按官方说明提供稳定使用语义，但框架和打包器用于实现它的底层接口并不都遵循相同的跨次版本兼容承诺。应用应使用所选框架支持的入口；实现框架集成时则需要更精确地锁定版本并跟进变更。</p>
<p>不要自行把一个普通异步函数标成“Server Action”后就宣称架构已完成。真正需要验证的是构建分离、请求协议、身份权限、参数结果与失败恢复是否共同构成了正确边界。</p>
<p>补充参考：<a href="https://react.dev/reference/rsc/use-server">React · use server</a>。</p>`};export{e as default};