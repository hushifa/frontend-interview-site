var e={answerHtml:`<p>use 让组件在渲染时表达“我需要读取这个资源的结果”。读取 Promise 时，未完成就参与 Suspense 等待，成功后返回兑现值，拒绝则按相应错误路径交给边界；读取 Context 时，则取得最近 Provider 提供的值。</p>
<p>它不是一个能接受任何对象的通用解包函数，也不等于在事件处理器里 await 一个请求。</p>
<h3>Promise 要在重新渲染之间保持正确身份</h3>
<p>下面在用户点击时创建 Promise，把它存到已存在的父组件状态中，再交给 Suspense 内部的组件读取。延迟只是演示，不包含网络请求。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createContext, <span class="hljs-title class_">Suspense</span>, use, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Message</span>(<span class="hljs-params">{ messagePromise }</span>) {
  <span class="hljs-keyword">const</span> message = <span class="hljs-title function_">use</span>(messagePromise);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{message}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">PromiseReader</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [messagePromise, setMessagePromise] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> [revision, setRevision] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">load</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> promise = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> {
      <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;消息已就绪&#x27;</span>), <span class="hljs-number">300</span>);
    });
    <span class="hljs-title function_">setMessagePromise</span>(promise);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{load}</span>&gt;</span>读取消息<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setRevision(value =&gt; value + 1)}&gt;无关重渲染<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>版本：{revision}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>等待消息<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
        {messagePromise ? <span class="hljs-tag">&lt;<span class="hljs-name">Message</span> <span class="hljs-attr">messagePromise</span>=<span class="hljs-string">{messagePromise}</span> /&gt;</span> : <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>尚未读取<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>点击后，Message 读取尚未完成的 Promise，最近的 Suspense 显示等待提示。Promise 就绪后，React 再尝试渲染 Message，use 返回字符串。</p>
<p>此时触发父组件的无关更新，不会每次新建一个不同 Promise，因为真正的创建发生在事件处理器中，状态持有的是同一个引用。点击“读取消息”则有意创建一份新资源。</p>
<h3>为什么不能每次渲染都直接创建请求 Promise</h3>
<p>如果组件一渲染就执行一个总会返回新 Promise 的请求函数，再立即 use 它，重新尝试渲染时可能又换成另一个未完成对象，导致重复请求或未缓存 Promise 的诊断。</p>
<p>把它随手放进同一个会在首次挂起时被重新尝试的组件 useMemo，也不是通用保证：首次尚未提交的缓存可能被丢弃。应由合适的数据源、框架缓存、服务器传入的资源，或已经明确持有身份的上层逻辑提供 Promise。</p>
<p>use 本身不定义过期时间、请求去重、权限边界或刷新策略。对服务器读取和客户端重新获取，应按相应环境选择数据层，而不是把所有 Promise 都存到一个永久模块级 Map 中。</p>
<p>也不要读取或修改 Promise 上看似存在的 status、value 字段来绕过 use。这些不是普通 Promise 的公共契约，React 需要通过自己的读取流程协调 Suspense 与重试。</p>
<h3>Context 读取允许条件调用，但仍有上下文要求</h3>
<p>以下组件沿用前面的导入：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> <span class="hljs-title class_">ThemeContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-string">&#x27;light&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">ThemeLabel</span>(<span class="hljs-params">{ visible }</span>) {
  <span class="hljs-keyword">if</span> (!visible) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> theme = <span class="hljs-title function_">use</span>(<span class="hljs-title class_">ThemeContext</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">data-theme</span>=<span class="hljs-string">{theme}</span>&gt;</span>当前主题：{theme}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">ThemeDemo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [dark, setDark] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-keyword">const</span> [visible, setVisible] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">true</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ThemeContext.Provider</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{dark</span> ? &#x27;<span class="hljs-attr">dark</span>&#x27; <span class="hljs-attr">:</span> &#x27;<span class="hljs-attr">light</span>&#x27;}&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setDark(value =&gt; !value)}&gt;切换主题<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setVisible(value =&gt; !value)}&gt;切换可见性<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">ThemeLabel</span> <span class="hljs-attr">visible</span>=<span class="hljs-string">{visible}</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">ThemeContext.Provider</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>use 与大多数常规 Hook 的调用限制不同，可以出现在这种条件路径中，也可以在符合规则的循环中使用。但它仍必须在组件或 Hook 的 React 执行上下文中调用，不能当成普通工具函数在 onClick 里随意读资源。</p>
<p>Context 值来自上方最近的 Provider，没有 Provider 时才使用创建时的默认值。它不能读取当前组件稍后 return 出来的 Provider，也不能让真正的 Server Component 直接消费客户端 Context。</p>
<h3>不要用 try/catch 包住 use 来处理等待</h3>
<p>use 需要把相应的等待或错误交给 React 协议处理。把它包在普通 try/catch 中，可能把框架用于协调渲染的流程截断，因此应使用 Suspense 与 Error Boundary，而不是捕获后自己猜测抛出的值。</p>
<p>若某种拒绝属于可接受的业务降级，可以在创建资源时把拒绝转换成明确的替代结果，再让 use 读取这份稳定 Promise。不要在每次渲染里重新调用 catch 创建新 Promise，又回到身份不稳定的问题。</p>
<p>拒绝后的重试也需要更换或刷新真正的数据资源。仅让组件多渲染一次，并不意味着已经缓存的失败 Promise 自动变成新的请求。</p>
<h3>服务端读取与客户端读取需要分清</h3>
<p>支持 Server Components 的环境中，服务器可以创建 Promise 并把允许的结果跨边界传给 Client Component，客户端 use 再与 Suspense 协作。跨边界值仍受序列化协议约束，不能把任意函数或运行时实例当成普通资源值传递。</p>
<p>在适合 async Server Component 的地方，await 通常更自然：它在等待后继续当前执行，而 use 的挂起可能使组件从头重新尝试。选择应结合框架和组件种类，不是把所有 await 都替换成 use。</p>
<h3>当前 React DOM 还有浏览器专属资源</h3>
<p>提供相应能力的 React DOM 版本可以通过 browser() 创建供 use 读取的浏览器渲染条件，用来表达某段组件只应在浏览器继续显示；服务器侧则通过相应 Suspense 回退安排客户端处理。</p>
<p>这与读取 Promise 或 Context 又是不同的资源语义，应按对应 React DOM 文档与版本使用。不要据此推断 use 可以识别任意自己创建的“资源对象”，也不要把单纯导入浏览器 API 的模块副作用误认为已经被边界隔离。</p>
<p>最终应先明确资源由谁创建、身份能否稳定、何时刷新、失败怎样恢复，再用 use 读取它。这样 Suspense 等待的是一个有清楚生命周期的资源，而不是每次渲染临时产生的新任务。</p>`};export{e as default};