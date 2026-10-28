var e={answerHtml:`<h2>简答</h2>
<ul>
<li>同名 <code>interface</code> 合并为一个，同名属性类型必须相同；同名方法合并为重载，后声明的重载排在前面。</li>
<li><code>namespace</code> 能与同名函数、类、枚举合并，给它们添加静态成员；但它会生成运行时代码。</li>
<li><code>declare module &#x27;./x&#x27;</code> 给已有模块补充类型（模块增补），只能修改已有导出，不能新增顶层导出。</li>
<li><code>declare global { interface Window { ... } }</code> 在模块文件中扩展全局类型。</li>
<li>所有扩展都只是类型声明，运行时必须有对应的实现，并通过副作用导入确保它被执行。</li>
</ul>
<h2>接口合并</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">PanelOptions</span> {
  <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span>;
}
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">PanelOptions</span> {
  <span class="hljs-attr">width</span>: <span class="hljs-built_in">number</span>;
}
<span class="hljs-keyword">const</span> <span class="hljs-attr">panel</span>: <span class="hljs-title class_">PanelOptions</span> = { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;阅读设置&#x27;</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">320</span> };
</code></pre></div>
<h2>函数与 namespace 合并</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">formatLabel</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">trim</span>();
}
<span class="hljs-keyword">namespace</span> <span class="hljs-title class_">formatLabel</span> {
  <span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> version = <span class="hljs-string">&#x27;1.0.0&#x27;</span>;
}
</code></pre></div>
<p><code>namespace</code> 会编译成给函数对象赋值的 IIFE。开启 <code>erasableSyntaxOnly</code>（TS 5.8+）时报 <code>TS1294</code>，Node.js 直接运行也会失败。等价的可擦除写法：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> formatLabel = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">assign</span>(
  <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>) =&gt;</span> value.<span class="hljs-title function_">trim</span>(),
  { <span class="hljs-attr">version</span>: <span class="hljs-string">&#x27;1.0.0&#x27;</span> },
);
</code></pre></div>
<p>只含类型的 <code>namespace</code> 和 <code>declare namespace</code> 是可擦除的，不受影响。</p>
<h2>模块增补</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// counter.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  value = <span class="hljs-number">0</span>;
  <span class="hljs-title function_">increment</span>(): <span class="hljs-built_in">void</span> {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> += <span class="hljs-number">1</span>;
  }
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// counter-reset.ts</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Counter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span>;

<span class="hljs-keyword">declare</span> <span class="hljs-variable language_">module</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span> {
  <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Counter</span> {
    <span class="hljs-title function_">reset</span>(): <span class="hljs-built_in">void</span>;
  }
}

<span class="hljs-title class_">Counter</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">reset</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> = <span class="hljs-number">0</span>;
};
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// main.ts</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Counter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-string">&#x27;./counter-reset.js&#x27;</span>;

<span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>();
counter.<span class="hljs-title function_">increment</span>();
counter.<span class="hljs-title function_">reset</span>();
</code></pre></div>
<p>去掉 <code>main.ts</code> 中的副作用导入后，类型检查仍然通过，运行时 <code>reset</code> 不存在。增补文件自身必须是模块（有 <code>import</code> 或 <code>export</code>），否则 <code>declare module</code> 会声明一个新的环境模块而不是增补。</p>
<h2>全局扩展</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// globals.d.ts</span>
<span class="hljs-keyword">export</span> {};
<span class="hljs-keyword">declare</span> <span class="hljs-variable language_">global</span> {
  <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Window</span> {
    <span class="hljs-attr">appVersion</span>?: <span class="hljs-built_in">string</span>;
  }
}
</code></pre></div>
<p>这只告诉编译器 <code>window.appVersion</code> 可能存在，赋值要在别处完成。</p>
<h2>常见场景与风险</h2>
<ul>
<li>给 Vue 的 <code>ComponentCustomProperties</code>、Express 的 <code>Request</code> 增加字段，这是库预留的扩展点。</li>
<li>不要用增补掩盖版本不兼容：库删除了某个方法，补上类型只会让错误推迟到运行时。</li>
<li>全局扩展影响整个项目，容易和其他库冲突。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>type</code> 能合并吗？不能，同名 <code>type</code> 报重复标识符错误，见<a href="/questions/ts-interface-type/">《type 和 interface 有哪些区别？》</a>。</li>
<li>类和接口能合并吗？能，同名 interface 会给类实例补充成员，但不提供实现，同样需要另外赋值。</li>
</ul>`};export{e as default};